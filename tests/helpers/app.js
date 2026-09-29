import { createHandlers } from '../../server/handlers.js';
import { createMemoryStore } from './memoryStore.js';

export const ADMIN_SECRET = 'test-only-admin-secret-0123456789abcdef'; // fake, 39 chars
export const ID_A = 'PRP-TESTCUST-AAAAAA';
export const ID_B = 'PRP-TESTCUST-BBBBBB';
export const DAY = 86_400_000;

export function makeReq({ method = 'POST', headers = {}, body, query, url } = {}) {
  const lowered = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return { method, headers: lowered, body, query, url, socket: { remoteAddress: '203.0.113.9' } };
}

export function makeRes() {
  const res = {
    statusCode: 200, headers: {}, payload: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(payload) { this.payload = payload ?? ''; },
  };
  Object.defineProperty(res, 'json', { get() { return JSON.parse(this.payload); } });
  return res;
}

export async function invoke(handler, options) {
  const res = makeRes();
  await handler(makeReq(options), res);
  return res;
}

/** A handler set wired to an in-memory store and a controllable clock. */
export function makeApp(options = {}) {
  // `'secret' in options` (not a default parameter) so tests can pass an
  // explicit `undefined` to simulate a missing ADMIN_SECRET.
  const secret = 'secret' in options ? options.secret : ADMIN_SECRET;
  const { store = createMemoryStore(), start = '2026-10-01T12:00:00.000Z', getStore } = options;
  const clock = { now: new Date(start) };
  const handlers = createHandlers({
    getEnv: () => ({ ADMIN_SECRET: secret }),
    getStore: getStore ?? (() => store),
    now: () => new Date(clock.now),
  });
  const admin = (handler, body, { token = ADMIN_SECRET, headers = {} } = {}) =>
    invoke(handler, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token === null ? {} : { authorization: `Bearer ${token}` }), ...headers },
      body,
    });
  return {
    handlers, store, clock,
    grant: (body, options) => admin(handlers.grant, body, options),
    revoke: (body, options) => admin(handlers.revoke, body, options),
    lookup: (id, headers = {}) => invoke(handlers.entitlement, { method: 'GET', query: { id }, headers }),
    advance: (ms) => { clock.now = new Date(clock.now.getTime() + ms); },
    record: (id) => JSON.parse(store.data.get(`prepify:entitlement:${id}`) ?? 'null'),
  };
}
