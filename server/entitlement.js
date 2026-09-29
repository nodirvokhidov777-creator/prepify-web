/**
 * Entitlement data model and rules. Pure functions only — no I/O, no clock
 * reads (callers pass `now`) — so every rule is unit-testable.
 *
 * Stored record (JSON, one per customer, key prepify:entitlement:<id>):
 *   { customerId, plan: 'monthly'|'lifetime'|'revoked',
 *     grantedAt, expiresAt|null, updatedAt, revokedAt?, previousPlan?,
 *     note?, history: [{action, plan, at, expiresAt}] }
 */
import { normalizeCustomerId } from '../shared/customerId.js';

export const DEFAULT_MONTHLY_DAYS = 30;
export const MAX_FUTURE_DAYS = 400;
const DAY_MS = 86_400_000;
const MAX_HISTORY = 20;
const MAX_NOTE_LENGTH = 200;
const GRANT_KEYS = new Set(['customerId', 'plan', 'expiresAt', 'extend', 'note']);
const REVOKE_KEYS = new Set(['customerId', 'note']);

export const entitlementKey = (customerId) => `prepify:entitlement:${customerId}`;
export const lockKey = (customerId) => `prepify:lock:${customerId}`;

/** Parses a stored value. Anything unparseable is treated as "no record"
 * (fails closed for reads: a corrupt record never grants access). */
export function parseStoredRecord(raw) {
  if (typeof raw !== 'string' || raw === '') return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * The ONLY place access is decided on the server. Expiry is evaluated here
 * on every read, so an expired monthly plan stops working with no cleanup job.
 * Unknown/corrupt plan values fail closed.
 */
export function deriveAccess(record, now = new Date()) {
  const none = { isPro: false, plan: null, status: 'none', expiresAt: null };
  if (!record || typeof record !== 'object') return none;
  if (record.plan === 'revoked') return { isPro: false, plan: null, status: 'revoked', expiresAt: null };
  if (record.plan === 'lifetime') return { isPro: true, plan: 'lifetime', status: 'active', expiresAt: null };
  if (record.plan === 'monthly') {
    const expiry = Date.parse(record.expiresAt);
    if (!Number.isFinite(expiry)) return { isPro: false, plan: 'monthly', status: 'expired', expiresAt: null };
    const expiresAt = new Date(expiry).toISOString();
    return now.getTime() < expiry
      ? { isPro: true, plan: 'monthly', status: 'active', expiresAt }
      : { isPro: false, plan: 'monthly', status: 'expired', expiresAt };
  }
  return none;
}

/** Admin-facing view: the stored facts plus the derived access. */
export function adminView(record, now = new Date()) {
  if (!record) return null;
  return {
    customerId: record.customerId,
    plan: record.plan,
    grantedAt: record.grantedAt ?? null,
    expiresAt: record.expiresAt ?? null,
    revokedAt: record.revokedAt ?? null,
    updatedAt: record.updatedAt ?? null,
    ...deriveAccess(record, now),
    // deriveAccess reports the *effective* plan; keep the stored one visible.
    storedPlan: record.plan,
  };
}

/** Replaces control characters with spaces so a note can never inject
 * escape sequences or line breaks into logs or an admin's terminal. */
function stripControlCharacters(text) {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0);
    out += code < 32 || code === 127 ? ' ' : ch;
  }
  return out;
}

function cleanNote(note) {
  if (note === undefined) return { ok: true, value: undefined };
  if (typeof note !== 'string') return { ok: false };
  const cleaned = stripControlCharacters(note).trim();
  if (cleaned.length > MAX_NOTE_LENGTH) return { ok: false };
  return { ok: true, value: cleaned || undefined };
}

const bad = (message) => ({ ok: false, error: 'invalid_request', message });

/** Validates a grant request body. Rejects unknown keys so a typo such as
 * `expires_at` can never silently grant the wrong thing. */
export function validateGrantBody(body, now = new Date()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return bad('Body must be a JSON object.');
  if (Object.keys(body).some((k) => !GRANT_KEYS.has(k))) return bad('Body contains an unsupported field.');
  const customerId = normalizeCustomerId(body.customerId);
  if (!customerId) return bad('customerId is missing or invalid.');
  if (body.plan !== 'monthly' && body.plan !== 'lifetime') return bad("plan must be 'monthly' or 'lifetime'.");
  if (body.extend !== undefined && typeof body.extend !== 'boolean') return bad('extend must be a boolean.');
  const note = cleanNote(body.note);
  if (!note.ok) return bad(`note must be a string of at most ${MAX_NOTE_LENGTH} characters.`);

  let expiresAtMs = null;
  if (body.plan === 'lifetime') {
    if (body.expiresAt !== undefined) return bad('Lifetime access cannot have an expiration date.');
    if (body.extend === true) return bad('extend only applies to monthly plans.');
  } else if (body.expiresAt !== undefined) {
    if (typeof body.expiresAt !== 'string') return bad('expiresAt must be an ISO 8601 date string.');
    expiresAtMs = Date.parse(body.expiresAt);
    if (!Number.isFinite(expiresAtMs)) return bad('expiresAt must be an ISO 8601 date string.');
    if (expiresAtMs <= now.getTime()) return bad('expiresAt must be in the future.');
    if (expiresAtMs > now.getTime() + MAX_FUTURE_DAYS * DAY_MS) return bad(`expiresAt cannot be more than ${MAX_FUTURE_DAYS} days ahead.`);
  }
  return { ok: true, value: { customerId, plan: body.plan, expiresAtMs, extend: body.extend === true, note: note.value } };
}

export function validateRevokeBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return bad('Body must be a JSON object.');
  if (Object.keys(body).some((k) => !REVOKE_KEYS.has(k))) return bad('Body contains an unsupported field.');
  const customerId = normalizeCustomerId(body.customerId);
  if (!customerId) return bad('customerId is missing or invalid.');
  const note = cleanNote(body.note);
  if (!note.ok) return bad(`note must be a string of at most ${MAX_NOTE_LENGTH} characters.`);
  return { ok: true, value: { customerId, note: note.value } };
}

function withHistory(existing, event) {
  const history = Array.isArray(existing?.history) ? existing.history : [];
  return [...history, event].slice(-MAX_HISTORY);
}

/**
 * Decides what a grant does. Never mutates; returns
 *   { ok:true, changed, record } or { ok:false, error, current }.
 * Duplicate/accidental-grant rules:
 *   - lifetime on an active lifetime  -> no-op (idempotent, grantedAt kept)
 *   - monthly on an active lifetime   -> refused (never silently downgrade)
 *   - monthly on an active monthly    -> refused unless `extend: true`
 *   - an explicit absolute expiresAt equal to the current one -> no-op
 */
export function applyGrant(existing, request, now = new Date()) {
  const { customerId, plan, expiresAtMs, extend, note } = request;
  const access = deriveAccess(existing, now);
  const nowIso = now.toISOString();

  if (plan === 'lifetime') {
    if (access.status === 'active' && access.plan === 'lifetime') return { ok: true, changed: false, record: existing };
    return {
      ok: true, changed: true,
      record: {
        customerId, plan: 'lifetime', grantedAt: nowIso, expiresAt: null, updatedAt: nowIso,
        ...(note ? { note } : {}),
        history: withHistory(existing, { action: 'grant', plan: 'lifetime', at: nowIso, expiresAt: null }),
      },
    };
  }

  // monthly
  if (access.status === 'active' && access.plan === 'lifetime') return { ok: false, error: 'already_lifetime', current: existing };
  if (access.status === 'active' && access.plan === 'monthly') {
    if (!extend) return { ok: false, error: 'already_active', current: existing };
    const currentExpiry = Date.parse(access.expiresAt);
    const newExpiry = expiresAtMs ?? currentExpiry + DEFAULT_MONTHLY_DAYS * DAY_MS;
    if (newExpiry === currentExpiry) return { ok: true, changed: false, record: existing };
    if (newExpiry < currentExpiry) return { ok: false, error: 'not_an_extension', current: existing };
    const expiresAt = new Date(newExpiry).toISOString();
    return {
      ok: true, changed: true,
      record: {
        ...existing, expiresAt, updatedAt: nowIso, ...(note ? { note } : {}),
        history: withHistory(existing, { action: 'extend', plan: 'monthly', at: nowIso, expiresAt }),
      },
    };
  }
  const expiresAt = new Date(expiresAtMs ?? now.getTime() + DEFAULT_MONTHLY_DAYS * DAY_MS).toISOString();
  return {
    ok: true, changed: true,
    record: {
      customerId, plan: 'monthly', grantedAt: nowIso, expiresAt, updatedAt: nowIso,
      ...(note ? { note } : {}),
      history: withHistory(existing, { action: 'grant', plan: 'monthly', at: nowIso, expiresAt }),
    },
  };
}

/** Revoking keeps the record (audit trail) and never creates one for an
 * unknown customer. Revoking twice is a harmless no-op. */
export function applyRevoke(existing, request, now = new Date()) {
  if (!existing) return { ok: false, error: 'not_found' };
  if (existing.plan === 'revoked') return { ok: true, changed: false, record: existing };
  const nowIso = now.toISOString();
  return {
    ok: true, changed: true,
    record: {
      ...existing, plan: 'revoked', previousPlan: existing.plan, revokedAt: nowIso, updatedAt: nowIso,
      ...(request.note ? { note: request.note } : {}),
      history: withHistory(existing, { action: 'revoke', plan: existing.plan, at: nowIso, expiresAt: existing.expiresAt ?? null }),
    },
  };
}
