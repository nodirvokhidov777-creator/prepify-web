import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandlers } from '../server/handlers.js';
import { ADMIN_SECRET, DAY, ID_A, ID_B, invoke, makeApp } from './helpers/app.js';
import { createMemoryStore } from './helpers/memoryStore.js';

const quiet = (t) => t.mock.method(console, 'error', () => {});
const entitlementKeys = (store) => [...store.data.keys()].filter((k) => k.startsWith('prepify:entitlement:'));

test('unauthorized admin requests are rejected and write nothing', async () => {
  const app = makeApp();
  const attempts = [
    { token: null }, // no header at all
    { token: 'wrong-secret-of-the-wrong-value-000000000' },
    { token: 'x' }, // different length
    { token: '', headers: { authorization: 'Bearer ' } },
    { token: null, headers: { authorization: `Basic ${ADMIN_SECRET}` } }, // wrong scheme
    { token: null, headers: { authorization: ADMIN_SECRET } }, // no scheme
    { token: `${ADMIN_SECRET.slice(0, -1)}X` }, // near miss: one character different
  ];
  for (const [i, options] of attempts.entries()) {
    for (const call of [app.grant, app.revoke]) {
      const res = await call({ customerId: ID_A, plan: 'lifetime' }, { ...options, headers: { ...options.headers, 'x-real-ip': `198.51.100.${i}` } });
      assert.equal(res.statusCode, 401, `attempt ${i}`);
      assert.deepEqual(res.json, { error: 'unauthorized' });
      assert.equal(res.headers['www-authenticate'], 'Bearer');
      assert.equal(res.payload.includes(ADMIN_SECRET), false);
    }
  }
  assert.deepEqual(entitlementKeys(app.store), [], 'nothing was written');
  assert.equal((await app.lookup(ID_A)).json.isPro, false);
});

test('the server refuses to run admin endpoints with a missing or weak secret', async () => {
  for (const secret of [undefined, '', 'short']) {
    const app = makeApp({ secret });
    const res = await app.grant({ customerId: ID_A, plan: 'lifetime' }, { token: secret ?? 'anything' });
    assert.equal(res.statusCode, 503, `secret=${JSON.stringify(secret)}`);
    assert.deepEqual(res.json, { error: 'admin_not_configured' });
  }
});

test('without configured storage: bad auth is still 401, good auth is a clear 503', async () => {
  const app = makeApp({ getStore: () => null });
  assert.equal((await app.grant({ customerId: ID_A, plan: 'lifetime' }, { token: 'nope' })).statusCode, 401);
  const res = await app.grant({ customerId: ID_A, plan: 'lifetime' });
  assert.equal(res.statusCode, 503);
  assert.equal(res.json.error, 'storage_not_configured');
});

test('only POST is accepted on admin endpoints', async () => {
  const app = makeApp();
  const res = await invoke(app.handlers.grant, { method: 'GET', headers: { authorization: `Bearer ${ADMIN_SECRET}` } });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
});

test('malformed bodies get safe 4xx responses (after authentication)', async () => {
  const app = makeApp();
  const wrongType = await app.grant('x', { headers: { 'content-type': 'text/plain' } });
  assert.equal(wrongType.statusCode, 415);
  assert.equal((await app.grant('{not json')).statusCode, 400);
  assert.equal((await app.grant([1, 2])).statusCode, 400);
  assert.equal((await app.grant('x'.repeat(9000))).statusCode, 413);
  assert.equal((await app.grant({ customerId: 'nope', plan: 'lifetime' })).statusCode, 400);
  assert.equal((await app.grant({ customerId: ID_A, plan: 'lifetime', surprise: 1 })).statusCode, 400);
  assert.equal((await app.grant({ customerId: ID_A, plan: 'lifetime', expiresAt: '2030-01-01T00:00:00Z' })).statusCode, 400);
  assert.deepEqual(entitlementKeys(app.store), []);
});

test('lifetime grant: persisted, no expiration, and PRO far into the future', async () => {
  const app = makeApp();
  const res = await app.grant({ customerId: ID_A, plan: 'lifetime', note: 'paid via Telegram' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.ok, true);
  assert.equal(res.json.changed, true);
  assert.equal(res.json.entitlement.plan, 'lifetime');
  assert.equal(res.json.entitlement.expiresAt, null);

  const stored = app.record(ID_A);
  assert.equal(stored.plan, 'lifetime');
  assert.equal(stored.expiresAt, null);
  assert.equal(stored.grantedAt, '2026-10-01T12:00:00.000Z');

  assert.deepEqual((await app.lookup(ID_A)).json, { isPro: true, plan: 'lifetime', status: 'active', expiresAt: null });
  app.advance(3650 * DAY); // ten years
  assert.equal((await app.lookup(ID_A)).json.isPro, true, 'lifetime never expires');
  assert.equal((await app.lookup(ID_B)).json.isPro, false, 'other customers are unaffected');
});

test('duplicate grants are idempotent and never overwrite the original record', async () => {
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'lifetime' });
  const writesAfterFirst = app.store.state.entitlementWrites;
  app.advance(DAY);
  const again = await app.grant({ customerId: ID_A, plan: 'lifetime' });
  assert.equal(again.statusCode, 200);
  assert.equal(again.json.changed, false);
  assert.equal(app.store.state.entitlementWrites, writesAfterFirst, 'no second write');
  assert.equal(app.record(ID_A).grantedAt, '2026-10-01T12:00:00.000Z');
});

test('a monthly grant can never silently downgrade lifetime access', async () => {
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'lifetime' });
  const res = await app.grant({ customerId: ID_A, plan: 'monthly' });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json.error, 'already_lifetime');
  assert.equal(app.record(ID_A).plan, 'lifetime');
});

test('monthly grant: 30-day default, expires, and needs extend:true to renew', async () => {
  const app = makeApp();
  const res = await app.grant({ customerId: ID_A, plan: 'monthly' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.entitlement.expiresAt, '2026-10-31T12:00:00.000Z');
  assert.equal((await app.lookup(ID_A)).json.isPro, true);

  const dup = await app.grant({ customerId: ID_A, plan: 'monthly' });
  assert.equal(dup.statusCode, 409);
  assert.equal(dup.json.error, 'already_active');

  const renewed = await app.grant({ customerId: ID_A, plan: 'monthly', extend: true });
  assert.equal(renewed.statusCode, 200);
  assert.equal(renewed.json.entitlement.expiresAt, '2026-11-30T12:00:00.000Z');

  app.advance(60 * DAY); // past the renewed expiry
  assert.deepEqual((await app.lookup(ID_A)).json, { isPro: false, plan: 'monthly', status: 'expired', expiresAt: '2026-11-30T12:00:00.000Z' });
});

test('expired monthly access is not PRO, and the customer can be granted again', async () => {
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'monthly' });
  app.advance(31 * DAY);
  assert.equal((await app.lookup(ID_A)).json.isPro, false);
  assert.equal((await app.lookup(ID_A)).json.status, 'expired');
  const regrant = await app.grant({ customerId: ID_A, plan: 'monthly' });
  assert.equal(regrant.statusCode, 200);
  assert.equal(regrant.json.changed, true);
  assert.equal((await app.lookup(ID_A)).json.isPro, true);
});

test('monthly upgrade to lifetime is allowed', async () => {
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'monthly' });
  const res = await app.grant({ customerId: ID_A, plan: 'lifetime' });
  assert.equal(res.json.changed, true);
  assert.equal(app.record(ID_A).plan, 'lifetime');
});

test('revoke: removes access, keeps the record, and requires authorization', async () => {
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'lifetime' });

  const denied = await app.revoke({ customerId: ID_A }, { token: 'wrong-secret-of-the-wrong-value-000000000' });
  assert.equal(denied.statusCode, 401);
  assert.equal((await app.lookup(ID_A)).json.isPro, true, 'unauthorized revoke changed nothing');

  const res = await app.revoke({ customerId: ID_A });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.changed, true);
  assert.deepEqual((await app.lookup(ID_A)).json, { isPro: false, plan: null, status: 'revoked', expiresAt: null });
  assert.equal(app.record(ID_A).previousPlan, 'lifetime');

  assert.equal((await app.revoke({ customerId: ID_A })).json.changed, false, 'revoking twice is harmless');
  const regrant = await app.grant({ customerId: ID_A, plan: 'lifetime' });
  assert.equal(regrant.json.changed, true, 'a revoked customer can be granted again');
  assert.equal((await app.lookup(ID_A)).json.isPro, true);
});

test('revoking an unknown customer is a 404 and creates no record', async () => {
  const app = makeApp();
  const res = await app.revoke({ customerId: ID_B });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(entitlementKeys(app.store), []);
});

test('concurrent update protection: a held lock returns 409 and changes nothing', async () => {
  const app = makeApp();
  app.store.data.set(`prepify:lock:${ID_A}`, '1');
  const res = await app.grant({ customerId: ID_A, plan: 'lifetime' });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json.error, 'busy');
  assert.deepEqual(entitlementKeys(app.store), []);
});

test('the lock is released after every operation', async () => {
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'lifetime' });
  await app.grant({ customerId: ID_A, plan: 'monthly' }); // refused (409) path
  await app.revoke({ customerId: ID_A });
  assert.equal([...app.store.data.keys()].some((k) => k.startsWith('prepify:lock:')), false);
});

test('storage outage: safe 503, no internals leaked, and the lock is released', async (t) => {
  quiet(t);
  const app = makeApp();
  app.store.state.failOn.add('get');
  const res = await app.grant({ customerId: ID_A, plan: 'lifetime' });
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.json, { error: 'storage_unavailable' });
  assert.equal([...app.store.data.keys()].some((k) => k.startsWith('prepify:lock:')), false);

  app.store.state.failOn.clear();
  app.store.state.down = true;
  const down = await app.revoke({ customerId: ID_A });
  assert.equal(down.statusCode, 503);
  assert.equal(down.payload.includes(ADMIN_SECRET), false);
});

test('unexpected errors return a generic 500 with no details', async (t) => {
  quiet(t);
  const app = makeApp();
  app.store.state.crashOn.add('get');
  // Only the entitlement read crashes; auth and locking succeed first.
  const res = await app.grant({ customerId: ID_A, plan: 'lifetime' });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.json, { error: 'internal_error' });
  assert.equal(res.payload.includes('boom'), false);
});

test('brute force is throttled: 10 failures lock the IP out, other IPs are unaffected', async () => {
  const app = makeApp();
  const wrong = { token: 'wrong-secret-of-the-wrong-value-000000000', headers: { 'x-real-ip': '198.51.100.7' } };
  for (let i = 0; i < 10; i++) assert.equal((await app.grant({ customerId: ID_A, plan: 'lifetime' }, wrong)).statusCode, 401);
  const blocked = await app.grant({ customerId: ID_A, plan: 'lifetime' }, wrong);
  assert.equal(blocked.statusCode, 429);
  assert.ok(blocked.headers['retry-after']);
  // Even the right secret is refused from a locked-out address...
  assert.equal((await app.grant({ customerId: ID_A, plan: 'lifetime' }, { headers: { 'x-real-ip': '198.51.100.7' } })).statusCode, 429);
  // ...while a different address still works.
  assert.equal((await app.grant({ customerId: ID_A, plan: 'lifetime' }, { headers: { 'x-real-ip': '198.51.100.8' } })).statusCode, 200);
});

test('the secret never appears in any response body', async () => {
  const app = makeApp();
  const responses = [
    await app.grant({ customerId: ID_A, plan: 'lifetime' }),
    await app.grant({ customerId: 'bad', plan: 'lifetime' }),
    await app.revoke({ customerId: ID_B }),
    await app.grant({ customerId: ID_A, plan: 'lifetime' }, { token: 'nope' }),
    await app.lookup(ID_A),
  ];
  for (const res of responses) assert.equal(res.payload.includes(ADMIN_SECRET), false);
});

test('handlers built without any environment fail closed', async () => {
  const handlers = createHandlers({ getEnv: () => ({}), getStore: () => createMemoryStore() });
  const res = await invoke(handlers.grant, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' }, body: {} });
  assert.equal(res.statusCode, 503);
});
