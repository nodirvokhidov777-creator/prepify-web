import { StoreError } from '../../server/redisStore.js';

/** In-memory stand-in for the Redis store, with switches to simulate outages. */
export function createMemoryStore() {
  const data = new Map();
  const state = { down: false, failOn: new Set(), crashOn: new Set(), entitlementWrites: 0 };
  const guard = (command) => {
    if (state.crashOn.has(command)) throw new Error('boom: internal detail that must never reach a client');
    if (state.down || state.failOn.has(command)) throw new StoreError('simulated storage outage');
  };
  return {
    data, state,
    async get(key) { guard('get'); return data.has(key) ? data.get(key) : null; },
    async set(key, value, { nx = false } = {}) {
      guard('set');
      if (nx && data.has(key)) return null;
      data.set(key, value);
      if (key.startsWith('prepify:entitlement:')) state.entitlementWrites++;
      return 'OK';
    },
    async del(key) { guard('del'); return data.delete(key) ? 1 : 0; },
    async incr(key) { guard('incr'); const n = Number(data.get(key) ?? 0) + 1; data.set(key, String(n)); return n; },
    async expire() { guard('expire'); return 1; },
  };
}
