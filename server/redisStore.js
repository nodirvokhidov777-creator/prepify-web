/**
 * Minimal Upstash Redis client over its REST API — no SDK dependency.
 * Protocol: POST the base URL with a JSON array command, Bearer token
 * auth, response {"result": ...} or {"error": "..."}.
 *
 * Errors thrown here deliberately contain NO credentials: the token only
 * ever travels in the Authorization header and is never put in a message.
 */
export class StoreError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StoreError';
  }
}

export function createUpstashStore({ url, token, fetchImpl = globalThis.fetch, timeoutMs = 4000 }) {
  async function command(args) {
    let response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new StoreError('Storage request failed (network or timeout).');
    }
    if (!response.ok) throw new StoreError(`Storage request failed (HTTP ${response.status}).`);
    let data;
    try {
      data = await response.json();
    } catch {
      throw new StoreError('Storage returned an unreadable response.');
    }
    if (!data || typeof data !== 'object' || data.error) throw new StoreError('Storage rejected the command.');
    return data.result;
  }

  return {
    get: (key) => command(['GET', key]),
    /** Resolves 'OK', or null when NX prevented the write. */
    set: (key, value, { nx = false, exSeconds } = {}) =>
      command(['SET', key, value, ...(nx ? ['NX'] : []), ...(exSeconds ? ['EX', String(exSeconds)] : [])]),
    del: (key) => command(['DEL', key]),
    incr: (key) => command(['INCR', key]),
    expire: (key, seconds) => command(['EXPIRE', key, String(seconds)]),
  };
}

/** Accepts Upstash's own variable names and the KV_* names Vercel's
 * Upstash integration injects. Returns null when not configured. */
export function resolveUpstashConfig(env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const loopback = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) return null;
  return { url: parsed.toString(), token };
}

export function createStoreFromEnv(env, options = {}) {
  const config = resolveUpstashConfig(env);
  return config ? createUpstashStore({ ...config, ...options }) : null;
}
