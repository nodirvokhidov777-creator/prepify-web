import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EntitlementUnavailableError, attemptRestore, fetchEntitlement, parseEntitlementResponse, resolveClientAccess,
} from '../src/features/premium/entitlementApi.js';
import { DAY, ID_A } from './helpers/app.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const LIFETIME = { isPro: true, plan: 'lifetime', status: 'active', expiresAt: null };
const NOW = Date.parse('2026-10-01T12:00:00Z');
const codeOf = (promise) => promise.then(() => null, (err) => (err instanceof EntitlementUnavailableError ? err.code : `unexpected:${err}`));

test('requests the right URL without credentials or caching', async () => {
  let seen;
  const fetchImpl = async (url, init) => { seen = { url, init }; return json(LIFETIME); };
  const result = await fetchEntitlement(' prp-testcust-aaaaaa ', { fetchImpl });
  assert.deepEqual(result, LIFETIME);
  assert.equal(seen.url, `/api/entitlement?id=${ID_A}`);
  assert.equal(seen.init.method, 'GET');
  assert.equal(seen.init.credentials, 'omit');
  assert.equal(seen.init.cache, 'no-store');
});

test('an invalid id never reaches the network', async () => {
  let calls = 0;
  assert.equal(await codeOf(fetchEntitlement('nope', { fetchImpl: async () => { calls++; return json(LIFETIME); } })), 'invalid_id');
  assert.equal(calls, 0);
});

test('parseEntitlementResponse accepts only coherent server answers', () => {
  const good = [
    LIFETIME,
    { isPro: true, plan: 'monthly', status: 'active', expiresAt: '2026-11-01T00:00:00.000Z' },
    { isPro: false, plan: 'monthly', status: 'expired', expiresAt: '2026-09-01T00:00:00.000Z' },
    { isPro: false, plan: null, status: 'revoked', expiresAt: null },
    { isPro: false, plan: null, status: 'none', expiresAt: null },
  ];
  for (const body of good) assert.deepEqual(parseEntitlementResponse(body), body);

  const bad = [
    null, [], 'yes', 42, {},
    { isPro: 'true', plan: 'lifetime', status: 'active', expiresAt: null },
    { isPro: true, plan: 'lifetime', status: 'expired', expiresAt: null }, // PRO but not active
    { isPro: true, plan: null, status: 'active', expiresAt: null },
    { isPro: false, plan: 'lifetime', status: 'active', expiresAt: null }, // active but not PRO
    { isPro: true, plan: 'platinum', status: 'active', expiresAt: null },
    { isPro: true, plan: 'lifetime', status: 'active', expiresAt: '2030-01-01T00:00:00Z' }, // lifetime with expiry
    { isPro: true, plan: 'monthly', status: 'active', expiresAt: null }, // monthly without expiry
    { isPro: true, plan: 'monthly', status: 'active', expiresAt: 'garbage' },
    { isPro: false, plan: null, status: 'mystery', expiresAt: null },
  ];
  for (const body of bad) assert.equal(parseEntitlementResponse(body), null, JSON.stringify(body));
});

test('service problems throw instead of granting anything', async () => {
  assert.equal(await codeOf(fetchEntitlement(ID_A, { fetchImpl: async () => json({ error: 'x' }, 503) })), 'http_503');
  assert.equal(await codeOf(fetchEntitlement(ID_A, { fetchImpl: async () => json({ error: 'x' }, 500) })), 'http_500');
  assert.equal(await codeOf(fetchEntitlement(ID_A, { fetchImpl: async () => json({ error: 'rate_limited' }, 429) })), 'rate_limited');
  assert.equal(await codeOf(fetchEntitlement(ID_A, { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } })), 'network');
  // The SPA rewrite answers unknown paths with index.html — that must not be trusted.
  assert.equal(await codeOf(fetchEntitlement(ID_A, { fetchImpl: async () => new Response('<!doctype html><html></html>', { status: 200 }) })), 'bad_response');
  assert.equal(await codeOf(fetchEntitlement(ID_A, { fetchImpl: async () => json({ isPro: true }) })), 'bad_response');
});

test('a hung request times out', async () => {
  const hang = (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  assert.equal(await codeOf(fetchEntitlement(ID_A, { fetchImpl: hang, timeoutMs: 30 })), 'timeout');
});

test('resolveClientAccess: nothing verified means free; monthly is re-checked against the clock', () => {
  assert.equal(resolveClientAccess(null, NOW).isPro, false);
  assert.equal(resolveClientAccess(undefined, NOW).isPro, false);
  assert.equal(resolveClientAccess(LIFETIME, NOW + 5000 * DAY).isPro, true);

  const monthly = { isPro: true, plan: 'monthly', status: 'active', expiresAt: new Date(NOW + DAY).toISOString() };
  assert.equal(resolveClientAccess(monthly, NOW).isPro, true);
  const later = resolveClientAccess(monthly, NOW + 2 * DAY); // e.g. a stale result during an outage
  assert.equal(later.isPro, false);
  assert.equal(later.status, 'expired');
});

test('restore: adopts the id only when it has active PRO', async () => {
  const adopted = [];
  const adopt = (id) => adopted.push(id);
  const ok = await attemptRestore(' prp-testcust-aaaaaa', { fetchImpl: async () => json(LIFETIME), adopt, now: NOW });
  assert.deepEqual(ok, { ok: true, customerId: ID_A, result: LIFETIME });
  assert.deepEqual(adopted, [ID_A]);
});

test('restore: every non-PRO or failed lookup leaves the stored id untouched', async () => {
  const adopted = [];
  const adopt = (id) => adopted.push(id);
  const run = (fetchImpl, raw = ID_A) => attemptRestore(raw, { fetchImpl, adopt, now: NOW });

  assert.deepEqual(await run(async () => json({ isPro: false, plan: null, status: 'none', expiresAt: null })), { ok: false, reason: 'not_found' });
  assert.deepEqual(await run(async () => json({ isPro: false, plan: 'monthly', status: 'expired', expiresAt: '2026-09-01T00:00:00Z' })), { ok: false, reason: 'expired' });
  assert.deepEqual(await run(async () => json({ isPro: false, plan: null, status: 'revoked', expiresAt: null })), { ok: false, reason: 'revoked' });
  assert.deepEqual(await run(async () => json({}, 503)), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await run(async () => json({}, 429)), { ok: false, reason: 'rate_limited' });
  assert.deepEqual(await run(async () => { throw new Error('offline'); }), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await run(async () => json(LIFETIME), 'not-an-id'), { ok: false, reason: 'invalid_id' });
  assert.deepEqual(adopted, [], 'adopt was never called');
});
