import http from 'node:http';
import { createHandlers } from '../../server/handlers.js';
import { createStoreFromEnv } from '../../server/redisStore.js';
import { ADMIN_SECRET } from './app.js';

/** Serves the three real handlers over HTTP with the real Upstash client
 * pointed at a fake Upstash — a faithful stand-in for the Vercel deployment. */
export async function startApiServer({ upstash, clock, secret = ADMIN_SECRET, storeOptions } = {}) {
  const store = createStoreFromEnv({ UPSTASH_REDIS_REST_URL: upstash.url, UPSTASH_REDIS_REST_TOKEN: upstash.token }, storeOptions);
  const handlers = createHandlers({
    getEnv: () => ({ ADMIN_SECRET: secret }),
    getStore: () => store,
    now: () => new Date(clock?.now ?? Date.now()),
  });
  const routes = { '/api/entitlement': handlers.entitlement, '/api/admin/grant': handlers.grant, '/api/admin/revoke': handlers.revoke };
  const server = http.createServer((req, res) => {
    const handler = routes[new URL(req.url, 'http://x').pathname];
    if (!handler) { res.statusCode = 404; return res.end('not found'); }
    return handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }) };
}
