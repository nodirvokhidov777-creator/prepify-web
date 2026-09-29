import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StoreError, createStoreFromEnv, createUpstashStore, resolveUpstashConfig } from '../server/redisStore.js';
import { startFakeUpstash } from './helpers/fakeUpstash.js';

test('config: Upstash names win, Vercel KV_* names are accepted, anything else is unconfigured', () => {
  assert.deepEqual(resolveUpstashConfig({ UPSTASH_REDIS_REST_URL: 'https://a.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't1', KV_REST_API_URL: 'https://b.upstash.io', KV_REST_API_TOKEN: 't2' }),
    { url: 'https://a.upstash.io/', token: 't1' });
  assert.deepEqual(resolveUpstashConfig({ KV_REST_API_URL: 'https://b.upstash.io', KV_REST_API_TOKEN: 't2' }), { url: 'https://b.upstash.io/', token: 't2' });
  assert.equal(resolveUpstashConfig({}), null);
  assert.equal(resolveUpstashConfig({ UPSTASH_REDIS_REST_URL: 'https://a.upstash.io' }), null, 'token required');
  assert.equal(resolveUpstashConfig({ UPSTASH_REDIS_REST_URL: 'not a url', UPSTASH_REDIS_REST_TOKEN: 't' }), null);
  assert.equal(resolveUpstashConfig({ UPSTASH_REDIS_REST_URL: 'http://db.example.com', UPSTASH_REDIS_REST_TOKEN: 't' }), null, 'no cleartext to remote hosts');
  assert.notEqual(resolveUpstashConfig({ UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:9', UPSTASH_REDIS_REST_TOKEN: 't' }), null, 'loopback http is allowed for tests');
  assert.equal(createStoreFromEnv({}), null);
});

test('commands use the Upstash REST wire format and return real results', async (t) => {
  const fake = await startFakeUpstash();
  t.after(() => fake.close());
  const store = createUpstashStore({ url: fake.url, token: fake.token });

  assert.equal(await store.get('k'), null);
  assert.equal(await store.set('k', 'v'), 'OK');
  assert.equal(await store.get('k'), 'v');
  assert.equal(await store.set('lock', '1', { nx: true, exSeconds: 10 }), 'OK');
  assert.equal(await store.set('lock', '2', { nx: true, exSeconds: 10 }), null, 'NX refuses to overwrite');
  assert.equal(await store.get('lock'), '1');
  assert.equal(await store.incr('n'), 1);
  assert.equal(await store.incr('n'), 2);
  assert.equal(await store.expire('n', 60), 1);
  assert.equal(await store.del('k'), 1);
  assert.equal(await store.get('k'), null);

  assert.deepEqual(fake.log.find((c) => c[0] === 'SET' && c[1] === 'lock'), ['SET', 'lock', '1', 'NX', 'EX', '10']);
  assert.deepEqual(fake.log.find((c) => c[0] === 'EXPIRE'), ['EXPIRE', 'n', '60']);
});

test('the token is sent only as a Bearer header and never appears in errors', async (t) => {
  const fake = await startFakeUpstash();
  t.after(() => fake.close());
  const wrong = createUpstashStore({ url: fake.url, token: 'wrong-token-value' });
  await assert.rejects(() => wrong.get('k'), (err) => {
    assert.ok(err instanceof StoreError);
    assert.equal(err.message.includes('wrong-token-value'), false);
    assert.equal(err.message.includes(fake.token), false);
    return true;
  });
});

test('outages surface as StoreError: HTTP 500, garbage body, refused connection, then recovery', async (t) => {
  const fake = await startFakeUpstash();
  const store = createUpstashStore({ url: fake.url, token: fake.token, timeoutMs: 150 });

  fake.state.mode = 'http500';
  await assert.rejects(() => store.get('k'), StoreError);
  fake.state.mode = 'garbage';
  await assert.rejects(() => store.get('k'), StoreError);
  fake.state.mode = 'hang';
  await assert.rejects(() => store.get('k'), StoreError); // aborted by the timeout
  fake.state.mode = 'ok';
  assert.equal(await store.get('k'), null, 'recovers when the service does');

  const afterShutdown = createUpstashStore({ url: fake.url, token: fake.token });
  await fake.close();
  await assert.rejects(() => afterShutdown.get('k'), StoreError, 'connection refused');
  t.diagnostic('all outage modes produced StoreError');
});

test('an { error } payload is a StoreError and its text is never passed on', async (t) => {
  const fake = await startFakeUpstash();
  t.after(() => fake.close());
  const store = createUpstashStore({ url: fake.url, token: fake.token });
  fake.state.mode = 'error-payload';
  await assert.rejects(() => store.get('k'), (err) => {
    assert.ok(err instanceof StoreError);
    assert.equal(err.message.includes('hunter2'), false, 'upstream error text must not be echoed');
    return true;
  });
});

test('a hung request is aborted by the timeout rather than waiting forever', async (t) => {
  const fake = await startFakeUpstash();
  t.after(() => fake.close());
  fake.state.mode = 'hang';
  const store = createUpstashStore({ url: fake.url, token: fake.token, timeoutMs: 100 });
  const started = Date.now();
  await assert.rejects(() => store.get('k'), StoreError);
  assert.ok(Date.now() - started < 2000, 'returned promptly');
});
