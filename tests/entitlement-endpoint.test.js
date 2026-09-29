import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ID_A, ID_B, invoke, makeApp } from './helpers/app.js';

const quiet = (t) => t.mock.method(console, 'error', () => {});

test('rejects missing, malformed and duplicated ids', async () => {
  const app = makeApp();
  for (const id of [undefined, '', 'abc', 'PRP-1-2', "PRP-TESTCUST-AAAAAA' OR 1=1", ['PRP-TESTCUST-AAAAAA', 'PRP-TESTCUST-BBBBBB']]) {
    const res = await app.lookup(id);
    assert.equal(res.statusCode, 400, JSON.stringify(id));
    assert.deepEqual(res.json, { error: 'invalid_customer_id' });
  }
});

test('an unknown customer is simply not PRO', async () => {
  const app = makeApp();
  const res = await app.lookup(ID_B);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json, { isPro: false, plan: null, status: 'none', expiresAt: null });
});

test('ids are matched case-insensitively', async () => {
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'lifetime' });
  assert.equal((await app.lookup(ID_A.toLowerCase())).json.isPro, true);
});

test('the public response exposes only what the app needs', async () => {
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'monthly', note: 'internal note' });
  const res = await app.lookup(ID_A);
  assert.deepEqual(Object.keys(res.json).sort(), ['expiresAt', 'isPro', 'plan', 'status']);
  for (const leaked of ['customerId', 'grantedAt', 'history', 'note', 'internal note', 'updatedAt']) {
    assert.equal(res.payload.includes(leaked), false, `must not leak ${leaked}`);
  }
});

test('responses are never cacheable and are marked nosniff', async () => {
  const app = makeApp();
  const res = await app.lookup(ID_A);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.match(res.headers['content-type'], /application\/json/);
  assert.equal(res.headers['access-control-allow-origin'], undefined, 'no CORS: same-origin only');
});

test('only GET is accepted', async () => {
  const app = makeApp();
  const res = await invoke(app.handlers.entitlement, { method: 'POST', query: { id: ID_A } });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'GET');
});

test('a corrupt stored record fails closed', async () => {
  const app = makeApp();
  app.store.data.set(`prepify:entitlement:${ID_A}`, '{{{ not json');
  assert.equal((await app.lookup(ID_A)).json.isPro, false);
  app.store.data.set(`prepify:entitlement:${ID_A}`, JSON.stringify({ plan: 'platinum' }));
  assert.equal((await app.lookup(ID_A)).json.isPro, false);
});

test('lookups are rate limited per address; the limiter itself failing does not block', async () => {
  const app = makeApp();
  const from = (ip) => ({ 'x-real-ip': ip });
  for (let i = 0; i < 60; i++) assert.equal((await app.lookup(ID_A, from('198.51.100.20'))).statusCode, 200);
  const blocked = await app.lookup(ID_A, from('198.51.100.20'));
  assert.equal(blocked.statusCode, 429);
  assert.ok(blocked.headers['retry-after']);
  assert.equal((await app.lookup(ID_A, from('198.51.100.21'))).statusCode, 200, 'other addresses unaffected');

  const app2 = makeApp();
  app2.store.state.failOn.add('set'); // limiter cannot write, but lookups (reads) still work
  assert.equal((await app2.lookup(ID_A)).statusCode, 200, 'fails open on a limiter error');
});

test('backend failure returns a safe 503 (never a PRO answer)', async (t) => {
  quiet(t);
  const app = makeApp();
  await app.grant({ customerId: ID_A, plan: 'lifetime' });
  app.store.state.down = true;
  const res = await app.lookup(ID_A);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.json, { error: 'storage_unavailable' });
  assert.equal('isPro' in res.json, false);
});

test('missing storage configuration returns 503, not PRO', async () => {
  const app = makeApp({ getStore: () => null });
  const res = await app.lookup(ID_A);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.json, { error: 'service_unavailable' });
});

test('an unexpected crash returns a generic 500', async (t) => {
  quiet(t);
  const app = makeApp();
  app.store.state.crashOn.add('get');
  const res = await app.lookup(ID_A);
  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.includes('boom'), false);
});
