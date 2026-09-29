import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCustomerId } from '../shared/customerId.js';
import {
  applyGrant, applyRevoke, deriveAccess, parseStoredRecord, validateGrantBody, validateRevokeBody,
} from '../server/entitlement.js';
import { DAY, ID_A } from './helpers/app.js';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const iso = (ms) => new Date(ms).toISOString();

test('customer IDs: canonicalised and strictly validated', () => {
  assert.equal(normalizeCustomerId('PRP-TESTCUST-AAAAAA'), 'PRP-TESTCUST-AAAAAA');
  assert.equal(normalizeCustomerId('  prp-testcust-aaaaaa \n'), 'PRP-TESTCUST-AAAAAA');
  for (const bad of ['', 'PRP-1-2', 'XXX-TESTCUST-AAAAAA', 'PRP-TESTCUST-AAAAAA-', 'PRP-TESTCUST-AAAA*A', "PRP-TESTCUST-AAAAAA'; DROP", null, undefined, 42, {}, ['PRP-TESTCUST-AAAAAA']]) {
    assert.equal(normalizeCustomerId(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
});

test('parseStoredRecord fails closed on corrupt data', () => {
  for (const raw of [null, undefined, '', 'not json', '[]', '"str"', '42']) assert.equal(parseStoredRecord(raw), null);
  assert.deepEqual(parseStoredRecord('{"plan":"lifetime"}'), { plan: 'lifetime' });
});

test('deriveAccess: no record, unknown plan and revoked are never PRO', () => {
  assert.deepEqual(deriveAccess(null, NOW), { isPro: false, plan: null, status: 'none', expiresAt: null });
  assert.equal(deriveAccess({ plan: 'platinum' }, NOW).isPro, false);
  assert.deepEqual(deriveAccess({ plan: 'revoked', expiresAt: iso(NOW.getTime() + DAY) }, NOW), { isPro: false, plan: null, status: 'revoked', expiresAt: null });
});

test('deriveAccess: lifetime has no expiration, ever', () => {
  const record = { plan: 'lifetime', expiresAt: null };
  assert.deepEqual(deriveAccess(record, NOW), { isPro: true, plan: 'lifetime', status: 'active', expiresAt: null });
  assert.equal(deriveAccess(record, new Date('2100-01-01T00:00:00Z')).isPro, true, 'still PRO in 2100');
  // A stray past expiresAt on a lifetime record must not switch access off.
  assert.equal(deriveAccess({ plan: 'lifetime', expiresAt: '2001-01-01T00:00:00Z' }, NOW).isPro, true);
});

test('deriveAccess: monthly is active before expiry and expired at/after it', () => {
  const expiry = NOW.getTime() + 5 * DAY;
  const record = { plan: 'monthly', expiresAt: iso(expiry) };
  assert.deepEqual(deriveAccess(record, NOW), { isPro: true, plan: 'monthly', status: 'active', expiresAt: iso(expiry) });
  assert.equal(deriveAccess(record, new Date(expiry - 1)).isPro, true);
  assert.equal(deriveAccess(record, new Date(expiry)).isPro, false, 'expires exactly at expiresAt');
  assert.deepEqual(deriveAccess(record, new Date(expiry + DAY)), { isPro: false, plan: 'monthly', status: 'expired', expiresAt: iso(expiry) });
});

test('deriveAccess: a monthly record with a missing/invalid expiry fails closed', () => {
  for (const expiresAt of [undefined, null, 'garbage']) {
    const access = deriveAccess({ plan: 'monthly', expiresAt }, NOW);
    assert.equal(access.isPro, false);
    assert.equal(access.status, 'expired');
  }
});

test('validateGrantBody: accepts valid requests and rejects malformed ones', () => {
  const ok = validateGrantBody({ customerId: ' prp-testcust-aaaaaa', plan: 'lifetime' }, NOW);
  assert.equal(ok.ok, true);
  assert.equal(ok.value.customerId, ID_A);

  const cases = [
    [null, 'null body'], [[], 'array body'], ['x', 'string body'],
    [{ plan: 'lifetime' }, 'missing id'],
    [{ customerId: 'nope', plan: 'lifetime' }, 'bad id'],
    [{ customerId: ID_A }, 'missing plan'],
    [{ customerId: ID_A, plan: 'platinum' }, 'unknown plan'],
    [{ customerId: ID_A, plan: 'revoked' }, 'revoked is not grantable'],
    [{ customerId: ID_A, plan: 'lifetime', expires_at: '2030-01-01' }, 'unknown field (typo)'],
    [{ customerId: ID_A, plan: 'lifetime', expiresAt: iso(NOW.getTime() + DAY) }, 'lifetime with expiry'],
    [{ customerId: ID_A, plan: 'lifetime', extend: true }, 'extend on lifetime'],
    [{ customerId: ID_A, plan: 'monthly', expiresAt: 'not a date' }, 'unparseable expiry'],
    [{ customerId: ID_A, plan: 'monthly', expiresAt: 12345 }, 'non-string expiry'],
    [{ customerId: ID_A, plan: 'monthly', expiresAt: iso(NOW.getTime() - DAY) }, 'expiry in the past'],
    [{ customerId: ID_A, plan: 'monthly', expiresAt: iso(NOW.getTime() + 401 * DAY) }, 'expiry too far ahead'],
    [{ customerId: ID_A, plan: 'monthly', extend: 'yes' }, 'non-boolean extend'],
    [{ customerId: ID_A, plan: 'monthly', note: 'x'.repeat(201) }, 'note too long'],
    [{ customerId: ID_A, plan: 'monthly', note: 5 }, 'non-string note'],
  ];
  for (const [body, label] of cases) {
    const result = validateGrantBody(body, NOW);
    assert.equal(result.ok, false, `should reject: ${label}`);
    assert.equal(result.error, 'invalid_request');
  }
});

test('validateGrantBody: notes are stripped of control characters', () => {
  const result = validateGrantBody({ customerId: ID_A, plan: 'monthly', note: 'paid\u0000\u001b[31m via tg\n' }, NOW);
  assert.equal(result.ok, true);
  assert.equal([...result.value.note].some((ch) => ch.codePointAt(0) < 32 || ch.codePointAt(0) === 127), false);
});

test('validateRevokeBody: strict too', () => {
  assert.equal(validateRevokeBody({ customerId: ID_A }).ok, true);
  assert.equal(validateRevokeBody({ customerId: ID_A, plan: 'x' }).ok, false);
  assert.equal(validateRevokeBody({}).ok, false);
});

const req = (over) => ({ customerId: ID_A, plan: 'monthly', expiresAtMs: null, extend: false, note: undefined, ...over });

test('applyGrant: new lifetime grant has no expiry; repeating it is a no-op', () => {
  const first = applyGrant(null, req({ plan: 'lifetime' }), NOW);
  assert.equal(first.ok && first.changed, true);
  assert.equal(first.record.plan, 'lifetime');
  assert.equal(first.record.expiresAt, null);
  assert.equal(first.record.grantedAt, NOW.toISOString());

  const later = new Date(NOW.getTime() + 30 * DAY);
  const second = applyGrant(first.record, req({ plan: 'lifetime' }), later);
  assert.equal(second.ok, true);
  assert.equal(second.changed, false);
  assert.equal(second.record.grantedAt, NOW.toISOString(), 'grantedAt is not overwritten');
});

test('applyGrant: monthly defaults to 30 days and never downgrades lifetime', () => {
  const monthly = applyGrant(null, req(), NOW);
  assert.equal(monthly.record.expiresAt, new Date(NOW.getTime() + 30 * DAY).toISOString());

  const lifetime = applyGrant(null, req({ plan: 'lifetime' }), NOW).record;
  const refused = applyGrant(lifetime, req(), NOW);
  assert.equal(refused.ok, false);
  assert.equal(refused.error, 'already_lifetime');
});

test('applyGrant: monthly on an active monthly needs extend:true, and extends from the current expiry', () => {
  const active = applyGrant(null, req(), NOW).record;
  assert.equal(applyGrant(active, req(), NOW).error, 'already_active');

  const extended = applyGrant(active, req({ extend: true }), NOW);
  assert.equal(extended.changed, true);
  assert.equal(extended.record.expiresAt, new Date(Date.parse(active.expiresAt) + 30 * DAY).toISOString());
  assert.equal(extended.record.grantedAt, active.grantedAt);

  const same = applyGrant(active, req({ extend: true, expiresAtMs: Date.parse(active.expiresAt) }), NOW);
  assert.equal(same.changed, false, 'same absolute date is idempotent');
  const earlier = applyGrant(active, req({ extend: true, expiresAtMs: Date.parse(active.expiresAt) - DAY }), NOW);
  assert.equal(earlier.error, 'not_an_extension');
});

test('applyGrant: expired, revoked and monthly customers can be (re)granted or upgraded', () => {
  const monthly = applyGrant(null, req(), NOW).record;
  const afterExpiry = new Date(NOW.getTime() + 40 * DAY);
  assert.equal(applyGrant(monthly, req(), afterExpiry).changed, true, 'expired -> new monthly');
  assert.equal(applyGrant(monthly, req({ plan: 'lifetime' }), NOW).changed, true, 'monthly -> lifetime upgrade');
  const revoked = applyRevoke(monthly, {}, NOW).record;
  assert.equal(applyGrant(revoked, req({ plan: 'lifetime' }), NOW).changed, true, 'revoked -> lifetime');
});

test('applyRevoke: keeps an audit trail, refuses unknown customers, is idempotent', () => {
  assert.deepEqual(applyRevoke(null, {}, NOW), { ok: false, error: 'not_found' });
  const lifetime = applyGrant(null, req({ plan: 'lifetime' }), NOW).record;
  const revoked = applyRevoke(lifetime, {}, NOW);
  assert.equal(revoked.changed, true);
  assert.equal(revoked.record.plan, 'revoked');
  assert.equal(revoked.record.previousPlan, 'lifetime');
  assert.equal(revoked.record.history.at(-1).action, 'revoke');
  assert.equal(deriveAccess(revoked.record, NOW).isPro, false);
  assert.equal(applyRevoke(revoked.record, {}, NOW).changed, false);
});

test('history is bounded', () => {
  let record = null;
  for (let i = 0; i < 40; i++) {
    record = applyGrant(record, req({ plan: 'lifetime' }), NOW).record;
    record = applyRevoke(record, {}, NOW).record;
  }
  assert.ok(record.history.length <= 20);
});
