/**
 * Client for GET /api/entitlement. This module is deliberately free of
 * React, localStorage and app imports: entitlement is decided by the server,
 * and nothing in here reads or writes browser storage as proof of access.
 * (Its only import is the shared ID validator.)
 */
import { normalizeCustomerId } from '../../../shared/customerId.js';

export class EntitlementUnavailableError extends Error {
  constructor(code) {
    super(`Entitlement check unavailable: ${code}`);
    this.name = 'EntitlementUnavailableError';
    this.code = code; // invalid_id | network | timeout | rate_limited | http_<n> | bad_response
  }
}

const STATUSES = new Set(['active', 'expired', 'revoked', 'none']);
const PLANS = new Set(['monthly', 'lifetime']);

/** Strictly validates the server response. Anything unexpected — including an
 * HTML page served by an SPA fallback — is rejected rather than trusted. */
export function parseEntitlementResponse(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const { isPro, plan, status, expiresAt } = data;
  if (typeof isPro !== 'boolean' || !STATUSES.has(status)) return null;
  if (plan !== null && !PLANS.has(plan)) return null;
  if (expiresAt !== null && !(typeof expiresAt === 'string' && Number.isFinite(Date.parse(expiresAt)))) return null;
  if (isPro && (status !== 'active' || plan === null)) return null;
  if (!isPro && status === 'active') return null;
  if (plan === 'lifetime' && expiresAt !== null) return null;
  if (isPro && plan === 'monthly' && expiresAt === null) return null;
  return { isPro, plan, status, expiresAt };
}

export async function fetchEntitlement(customerId, { fetchImpl = globalThis.fetch, timeoutMs = 6000, baseUrl = '' } = {}) {
  const id = normalizeCustomerId(customerId);
  if (!id) throw new EntitlementUnavailableError('invalid_id');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}/api/entitlement?id=${encodeURIComponent(id)}`, {
        method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store', credentials: 'omit', signal: controller.signal,
      });
    } catch {
      throw new EntitlementUnavailableError(controller.signal.aborted ? 'timeout' : 'network');
    }
    if (response.status === 429) throw new EntitlementUnavailableError('rate_limited');
    if (!response.ok) throw new EntitlementUnavailableError(`http_${response.status}`);
    let data;
    try {
      data = await response.json();
    } catch {
      throw new EntitlementUnavailableError(controller.signal.aborted ? 'timeout' : 'bad_response');
    }
    const parsed = parseEntitlementResponse(data);
    if (!parsed) throw new EntitlementUnavailableError('bad_response');
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

const FREE = Object.freeze({ isPro: false, plan: null, status: null, expiresAt: null });

/** Turns the last server-verified result into what the UI should honour.
 * A monthly plan is re-checked against the clock, so a stale in-memory
 * result can never outlive its own expiry during an outage. */
export function resolveClientAccess(verified, nowMs = Date.now()) {
  if (!verified) return FREE;
  if (verified.isPro && verified.plan === 'monthly') {
    const expiry = Date.parse(verified.expiresAt);
    if (!Number.isFinite(expiry) || nowMs >= expiry) {
      return { isPro: false, plan: 'monthly', status: 'expired', expiresAt: verified.expiresAt };
    }
  }
  return { isPro: verified.isPro, plan: verified.plan, status: verified.status, expiresAt: verified.expiresAt };
}

/**
 * Restore-access flow: look up an existing customer ID on the server and,
 * only if it currently has active PRO, adopt it as this device's ID.
 * A non-PRO or unreachable lookup never changes the stored ID.
 * `adopt` is injected (it writes the ID to localStorage) to keep this pure.
 */
export async function attemptRestore(rawId, { fetchImpl, adopt, now = Date.now(), ...options } = {}) {
  const customerId = normalizeCustomerId(rawId);
  if (!customerId) return { ok: false, reason: 'invalid_id' };

  let result;
  try {
    result = await fetchEntitlement(customerId, { fetchImpl, ...options });
  } catch (err) {
    return { ok: false, reason: err?.code === 'rate_limited' ? 'rate_limited' : 'unavailable' };
  }
  const access = resolveClientAccess(result, now);
  if (!access.isPro) return { ok: false, reason: result.status === 'none' ? 'not_found' : access.status };

  adopt(customerId);
  return { ok: true, customerId, result };
}
