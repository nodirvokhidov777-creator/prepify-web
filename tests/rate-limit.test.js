import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bump } from '../server/http.js';
import { createUpstashStore } from '../server/redisStore.js';
import { startFakeUpstash } from './helpers/fakeUpstash.js';
import { createMemoryStore } from './helpers/memoryStore.js';

test('bump counts hits within a window', async () => {
  const store = createMemoryStore();
  assert.deepEqual([await bump(store, 'k', 60), await bump(store, 'k', 60), await bump(store, 'k', 60)], [1, 2, 3]);
});

test('the counter is created WITH its expiry in a single atomic command', async (t) => {
  const fake = await startFakeUpstash();
  t.after(() => fake.close());
  const store = createUpstashStore({ url: fake.url, token: fake.token });
  await bump(store, 'rl:x', 60);
  assert.deepEqual(fake.log, [['SET', 'rl:x', '1', 'NX', 'EX', '60']], 'first hit: one command, TTL included, no separate EXPIRE');
  await bump(store, 'rl:x', 60);
  assert.deepEqual(fake.log.slice(1).map((c) => c[0]), ['SET', 'INCR'], 'later hits increment the existing (already-expiring) key');
});

test('a failure after creation can never leave a counter without an expiry', async () => {
  // The old INCR-then-EXPIRE design would strand a TTL-less key if EXPIRE failed.
  const ttls = new Map();
  const store = {
    async set(key, _v, { exSeconds } = {}) { if (ttls.has(key)) return null; ttls.set(key, exSeconds ?? null); return 'OK'; },
    async incr() { return 2; },
    async expire() { throw new Error('EXPIRE failed'); },
  };
  assert.equal(await bump(store, 'k', 60), 1);
  assert.equal(ttls.get('k'), 60, 'the key was created with its TTL, so nothing is stranded');
});

test('if the key expires between SET and INCR, the TTL is re-armed', async () => {
  const calls = [];
  const store = {
    async set() { calls.push('set'); return null; }, // "exists"...
    async incr() { calls.push('incr'); return 1; },   // ...but expired before INCR: re-created at 1
    async expire(_k, s) { calls.push(`expire:${s}`); return 1; },
  };
  assert.equal(await bump(store, 'k', 900), 1);
  assert.deepEqual(calls, ['set', 'incr', 'expire:900']);
});
