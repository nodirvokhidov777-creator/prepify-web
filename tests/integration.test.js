import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { EntitlementUnavailableError, fetchEntitlement, resolveClientAccess } from '../src/features/premium/entitlementApi.js';
import { ADMIN_SECRET, DAY, ID_A, ID_B } from './helpers/app.js';
import { startApiServer } from './helpers/apiServer.js';
import { startFakeUpstash } from './helpers/fakeUpstash.js';

const run = promisify(execFile);
const CLI = fileURLToPath(new URL('../scripts/pro-admin.mjs', import.meta.url));
const post = (api, path, body, token = ADMIN_SECRET) =>
  fetch(`${api.url}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
const quiet = (t) => t.mock.method(console, 'error', () => {});

test('persistence: a lifetime grant survives a full cold start and lives in the store, not in memory', async (t) => {
  const fake = await startFakeUpstash();
  t.after(() => fake.close());
  const clock = { now: new Date('2026-10-01T12:00:00Z') };

  let api = await startApiServer({ upstash: fake, clock });
  const granted = await post(api, '/api/admin/grant', { customerId: ID_A, plan: 'lifetime' });
  assert.equal(granted.status, 200);
  assert.equal((await granted.json()).entitlement.plan, 'lifetime');

  // "Reload": tear the whole API down and start a brand-new one (new handlers,
  // new Upstash client) against the same Redis — like a redeploy / cold start.
  await api.close();
  api = await startApiServer({ upstash: fake, clock });
  t.after(() => api.close());

  assert.deepEqual(await fetchEntitlement(ID_A, { baseUrl: api.url }),
    { isPro: true, plan: 'lifetime', status: 'active', expiresAt: null });
  assert.deepEqual(await fetchEntitlement(ID_A, { baseUrl: api.url }),
    { isPro: true, plan: 'lifetime', status: 'active', expiresAt: null }, 'a second "page load" agrees');

  const stored = JSON.parse(fake.data.get(`prepify:entitlement:${ID_A}`));
  assert.equal(stored.plan, 'lifetime');
  assert.equal(stored.expiresAt, null);
  assert.equal((await fetchEntitlement(ID_B, { baseUrl: api.url })).isPro, false, 'other customers unaffected');
  assert.equal(JSON.stringify([...fake.data]).includes(ADMIN_SECRET), false, 'the secret is never stored');

  clock.now = new Date(clock.now.getTime() + 3650 * DAY);
  assert.equal((await fetchEntitlement(ID_A, { baseUrl: api.url })).isPro, true, 'still PRO ten years later');
});

test('monthly access expires, and revocation takes effect, over real HTTP', async (t) => {
  const fake = await startFakeUpstash();
  const clock = { now: new Date('2026-10-01T12:00:00Z') };
  const api = await startApiServer({ upstash: fake, clock });
  t.after(async () => { await api.close(); await fake.close(); });

  assert.equal((await post(api, '/api/admin/grant', { customerId: ID_A, plan: 'monthly' })).status, 200);
  assert.equal((await fetchEntitlement(ID_A, { baseUrl: api.url })).isPro, true);

  clock.now = new Date(clock.now.getTime() + 31 * DAY);
  const expired = await fetchEntitlement(ID_A, { baseUrl: api.url });
  assert.equal(expired.isPro, false);
  assert.equal(expired.status, 'expired');

  assert.equal((await post(api, '/api/admin/grant', { customerId: ID_B, plan: 'lifetime' })).status, 200);
  assert.equal((await fetchEntitlement(ID_B, { baseUrl: api.url })).isPro, true);
  assert.equal((await post(api, '/api/admin/revoke', { customerId: ID_B })).status, 200);
  assert.deepEqual(await fetchEntitlement(ID_B, { baseUrl: api.url }), { isPro: false, plan: null, status: 'revoked', expiresAt: null });
  assert.equal((await post(api, '/api/admin/revoke', { customerId: ID_B }, 'bad-token-bad-token-bad-token-1234')).status, 401);
});

test('backend failure: the client never treats an outage as PRO, and recovers afterwards', async (t) => {
  quiet(t);
  const fake = await startFakeUpstash();
  const clock = { now: new Date('2026-10-01T12:00:00Z') };
  const api = await startApiServer({ upstash: fake, clock });
  t.after(async () => { await api.close(); await fake.close(); });

  await post(api, '/api/admin/grant', { customerId: ID_A, plan: 'lifetime' });
  assert.equal((await fetchEntitlement(ID_A, { baseUrl: api.url })).isPro, true);

  fake.state.mode = 'http500'; // Upstash goes down
  const res = await fetch(`${api.url}/api/entitlement?id=${ID_A}`);
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: 'storage_unavailable' });

  const failure = await fetchEntitlement(ID_A, { baseUrl: api.url }).catch((err) => err);
  assert.ok(failure instanceof EntitlementUnavailableError);
  assert.equal(failure.code, 'http_503');
  assert.equal(resolveClientAccess(null).isPro, false, 'no verified result => free tier, never PRO by default');

  const adminDuringOutage = await post(api, '/api/admin/grant', { customerId: ID_B, plan: 'lifetime' });
  assert.equal(adminDuringOutage.status, 503);

  fake.state.mode = 'ok'; // service returns
  assert.equal((await fetchEntitlement(ID_A, { baseUrl: api.url })).isPro, true, 'entitlement was never lost');
  assert.equal((await fetchEntitlement(ID_B, { baseUrl: api.url })).isPro, false, 'the failed grant left no partial record');
});

test('CLI: grants lifetime access, verifies it, and never prints the secret', async (t) => {
  const fake = await startFakeUpstash();
  const clock = { now: new Date('2026-10-01T12:00:00Z') };
  const api = await startApiServer({ upstash: fake, clock });
  t.after(async () => { await api.close(); await fake.close(); });
  const env = (extra = {}) => ({ PATH: process.env.PATH, PREPIFY_URL: api.url, ...extra });
  const cli = (args, environment) => run(process.execPath, [CLI, ...args], { env: environment });
  const failing = (args, environment) => cli(args, environment).then(() => assert.fail('expected a non-zero exit'), (err) => err);

  const grant = await cli(['grant', '--customer', ID_A, '--plan', 'lifetime', '--note', 'test grant'], env({ ADMIN_SECRET }));
  assert.match(grant.stdout, /HTTP 200/);
  assert.match(grant.stdout, /"plan": "lifetime"/);
  assert.equal((grant.stdout + grant.stderr).includes(ADMIN_SECRET), false);

  const status = await cli(['status', '--customer', ID_A], env()); // status needs no secret
  assert.match(status.stdout, /"isPro": true/);

  const denied = await failing(['grant', '--customer', ID_B, '--plan', 'lifetime'], env({ ADMIN_SECRET: 'wrong-secret-wrong-secret-wrong-secret-1' }));
  assert.equal(denied.code, 1);
  assert.match(denied.stdout, /HTTP 401/);
  assert.equal((denied.stdout + denied.stderr).includes('wrong-secret'), false);

  assert.equal((await failing(['grant', '--customer', ID_B, '--plan', 'lifetime'], env())).code, 2, 'missing ADMIN_SECRET');
  assert.equal((await failing(['grant', '--customer', 'nope', '--plan', 'lifetime'], env({ ADMIN_SECRET }))).code, 2, 'invalid customer');
  assert.equal((await failing(['grant', '--customer', ID_B, '--plan', 'lifetime', '--secret', 'x'], env({ ADMIN_SECRET }))).code, 2, 'the secret is never accepted as a flag');
  assert.equal((await failing(['grant', '--customer', ID_B, '--plan', 'lifetime'], { ...env({ ADMIN_SECRET }), PREPIFY_URL: 'http://example.com' })).code, 2, 'refuses cleartext to a remote host');

  const revoked = await cli(['revoke', '--customer', ID_A], env({ ADMIN_SECRET }));
  assert.match(revoked.stdout, /HTTP 200/);
  assert.match((await cli(['status', '--customer', ID_A], env())).stdout, /"isPro": false/);
});
