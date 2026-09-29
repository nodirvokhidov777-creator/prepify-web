import { normalizeCustomerId } from '../shared/customerId.js';
import {
  adminView, applyGrant, applyRevoke, deriveAccess, entitlementKey, lockKey,
  parseStoredRecord, validateGrantBody, validateRevokeBody,
} from './entitlement.js';
import { bump, clientBucket, getBearerToken, getQueryParam, readJsonBody, safeEqual, sendJson } from './http.js';
import { StoreError, createStoreFromEnv } from './redisStore.js';

export const MIN_ADMIN_SECRET_LENGTH = 32;
export const ADMIN_FAIL_LIMIT = 10;
export const ADMIN_FAIL_WINDOW_SECONDS = 900;
export const PUBLIC_LIMIT = 60;
export const PUBLIC_WINDOW_SECONDS = 60;
const LOCK_TTL_SECONDS = 10;

const BODY_ERRORS = {
  unsupported_media_type: [415, 'Content-Type must be application/json.'],
  invalid_json: [400, 'Body must be a valid JSON object.'],
  payload_too_large: [413, 'Request body is too large.'],
};

/**
 * deps (all optional, injected by tests):
 *   getEnv()   -> environment object (default process.env)
 *   getStore() -> store or null       (default: Upstash from env)
 *   now()      -> Date                (default: new Date())
 */
export function createHandlers(deps = {}) {
  const getEnv = deps.getEnv ?? (() => process.env);
  const now = deps.now ?? (() => new Date());
  let cachedStore;
  const getStore = deps.getStore ?? (() => {
    if (cachedStore === undefined) cachedStore = createStoreFromEnv(getEnv());
    return cachedStore;
  });

  /** Safe, uniform failure response. Details go to server logs only, and
   * error messages never contain credentials (see StoreError). */
  function fail(res, err) {
    if (err instanceof StoreError) {
      console.error('[entitlement] storage error:', err.message);
      return sendJson(res, 503, { error: 'storage_unavailable' });
    }
    console.error('[entitlement] unexpected error:', err?.name ?? 'Error');
    return sendJson(res, 500, { error: 'internal_error' });
  }

  async function withCustomerLock(store, customerId, work) {
    const acquired = await store.set(lockKey(customerId), '1', { nx: true, exSeconds: LOCK_TTL_SECONDS });
    if (acquired !== 'OK') return { busy: true };
    try {
      return { busy: false, value: await work() };
    } finally {
      try { await store.del(lockKey(customerId)); } catch { /* the lock expires on its own */ }
    }
  }

  /** method -> config -> throttle -> auth -> body. Returns the parsed body
   * and store, or null after having already responded. */
  async function authorizeAdmin(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' });
      return null;
    }
    const secret = getEnv().ADMIN_SECRET;
    if (typeof secret !== 'string' || secret.length < MIN_ADMIN_SECRET_LENGTH) {
      sendJson(res, 503, { error: 'admin_not_configured' }); // refuses to run with a missing/weak secret
      return null;
    }
    const store = getStore();
    const failKey = `prepify:rl:adminfail:${clientBucket(req)}`;

    if (store) {
      try {
        if (Number(await store.get(failKey)) >= ADMIN_FAIL_LIMIT) {
          sendJson(res, 429, { error: 'too_many_attempts' }, { 'Retry-After': String(ADMIN_FAIL_WINDOW_SECONDS) });
          return null;
        }
      } catch { /* throttling is best-effort; authentication below never depends on it */ }
    }

    const token = getBearerToken(req);
    if (!token || !safeEqual(token, secret)) {
      if (store) { try { await bump(store, failKey, ADMIN_FAIL_WINDOW_SECONDS); } catch { /* best-effort */ } }
      sendJson(res, 401, { error: 'unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
      return null;
    }
    if (!store) {
      sendJson(res, 503, { error: 'storage_not_configured' });
      return null;
    }
    const body = await readJsonBody(req);
    if (!body.ok) {
      const [status, message] = BODY_ERRORS[body.error];
      sendJson(res, status, { error: body.error, message });
      return null;
    }
    return { store, body: body.value };
  }

  async function grant(req, res) {
    try {
      const ctx = await authorizeAdmin(req, res);
      if (!ctx) return;
      const check = validateGrantBody(ctx.body, now());
      if (!check.ok) return sendJson(res, 400, { error: check.error, message: check.message });

      const { customerId } = check.value;
      const locked = await withCustomerLock(ctx.store, customerId, async () => {
        const existing = parseStoredRecord(await ctx.store.get(entitlementKey(customerId)));
        const outcome = applyGrant(existing, check.value, now());
        if (outcome.ok && outcome.changed) await ctx.store.set(entitlementKey(customerId), JSON.stringify(outcome.record));
        return outcome;
      });
      if (locked.busy) return sendJson(res, 409, { ok: false, error: 'busy', message: 'Another update for this customer is in progress. Retry shortly.' });
      const outcome = locked.value;
      if (!outcome.ok) return sendJson(res, 409, { ok: false, error: outcome.error, entitlement: adminView(outcome.current, now()) });
      return sendJson(res, 200, { ok: true, changed: outcome.changed, entitlement: adminView(outcome.record, now()) });
    } catch (err) {
      return fail(res, err);
    }
  }

  async function revoke(req, res) {
    try {
      const ctx = await authorizeAdmin(req, res);
      if (!ctx) return;
      const check = validateRevokeBody(ctx.body);
      if (!check.ok) return sendJson(res, 400, { error: check.error, message: check.message });

      const { customerId } = check.value;
      const locked = await withCustomerLock(ctx.store, customerId, async () => {
        const existing = parseStoredRecord(await ctx.store.get(entitlementKey(customerId)));
        const outcome = applyRevoke(existing, check.value, now());
        if (outcome.ok && outcome.changed) await ctx.store.set(entitlementKey(customerId), JSON.stringify(outcome.record));
        return outcome;
      });
      if (locked.busy) return sendJson(res, 409, { ok: false, error: 'busy', message: 'Another update for this customer is in progress. Retry shortly.' });
      const outcome = locked.value;
      if (!outcome.ok) return sendJson(res, 404, { ok: false, error: outcome.error });
      return sendJson(res, 200, { ok: true, changed: outcome.changed, entitlement: adminView(outcome.record, now()) });
    } catch (err) {
      return fail(res, err);
    }
  }

  /** Public, read-only. Returns only what the app needs to render. */
  async function entitlement(req, res) {
    try {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET' });
      const customerId = normalizeCustomerId(getQueryParam(req, 'id'));
      if (!customerId) return sendJson(res, 400, { error: 'invalid_customer_id' });
      const store = getStore();
      if (!store) return sendJson(res, 503, { error: 'service_unavailable' });

      try {
        if ((await bump(store, `prepify:rl:public:${clientBucket(req)}`, PUBLIC_WINDOW_SECONDS)) > PUBLIC_LIMIT) {
          return sendJson(res, 429, { error: 'rate_limited' }, { 'Retry-After': String(PUBLIC_WINDOW_SECONDS) });
        }
      } catch { /* fail open: the lookup below reports a real outage itself */ }

      const record = parseStoredRecord(await store.get(entitlementKey(customerId)));
      const { isPro, plan, status, expiresAt } = deriveAccess(record, now());
      return sendJson(res, 200, { isPro, plan, status, expiresAt });
    } catch (err) {
      return fail(res, err);
    }
  }

  return { grant, revoke, entitlement };
}
