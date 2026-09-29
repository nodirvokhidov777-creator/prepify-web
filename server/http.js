import crypto from 'node:crypto';

/** Uses only core Node response methods, so it behaves identically under
 * Vercel's runtime, a plain http.Server, and the test doubles. */
export function sendJson(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify(body));
}

/** Constant-time comparison. Both sides are hashed first so the check
 * neither leaks the secret's length nor throws on unequal lengths. */
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function getBearerToken(req) {
  const header = req.headers?.authorization;
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/** A short hash of the caller's IP — used only as a rate-limit bucket key
 * (with a TTL), so raw IP addresses are never stored. */
export function clientBucket(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim();
  const ip = String(req.headers?.['x-real-ip'] ?? '').trim() || forwarded || req.socket?.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export function getQueryParam(req, name) {
  if (req.query && typeof req.query === 'object') {
    const value = req.query[name];
    return Array.isArray(value) ? undefined : value; // duplicate params are rejected
  }
  try {
    const url = new URL(req.url ?? '', 'http://localhost');
    const all = url.searchParams.getAll(name);
    return all.length === 1 ? all[0] : undefined;
  } catch {
    return undefined;
  }
}

/** Reads a JSON object body. Works whether the platform pre-parsed it
 * (Vercel) or left the raw stream (plain Node). Bounded to 8 KB. */
export async function readJsonBody(req, limitBytes = 8192) {
  const contentType = String(req.headers?.['content-type'] ?? '').toLowerCase();
  if (!contentType.startsWith('application/json')) return { ok: false, error: 'unsupported_media_type' };

  let body;
  try {
    body = req.body;
  } catch {
    return { ok: false, error: 'invalid_json' }; // platform failed to parse it
  }
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > limitBytes) return { ok: false, error: 'payload_too_large' };
        chunks.push(chunk);
      }
    } catch {
      return { ok: false, error: 'invalid_json' };
    }
    body = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    if (body.length > limitBytes) return { ok: false, error: 'payload_too_large' };
    try {
      body = JSON.parse(body);
    } catch {
      return { ok: false, error: 'invalid_json' };
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'invalid_json' };
  return { ok: true, value: body };
}

/**
 * Fixed-window counter; returns the count after this hit.
 *
 * The key is created with its TTL in ONE atomic command (SET NX EX), so a
 * crash or failed call can never leave a counter without an expiry — which
 * would throttle that client forever. INCR keeps the existing TTL. The only
 * gap left is the key expiring between the two commands; in that case INCR
 * re-creates it at 1 and the TTL is re-armed below.
 */
export async function bump(store, key, windowSeconds) {
  if ((await store.set(key, '1', { nx: true, exSeconds: windowSeconds })) === 'OK') return 1;
  const count = Number(await store.incr(key));
  if (count === 1) await store.expire(key, windowSeconds);
  return count;
}
