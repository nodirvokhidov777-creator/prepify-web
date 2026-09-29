#!/usr/bin/env node
/**
 * Admin CLI for PREPIFY PRO entitlements. Talks to the deployed API — it
 * has no database access of its own.
 *
 *   ADMIN_SECRET=...  PREPIFY_URL=https://your-domain  \
 *     node scripts/pro-admin.mjs grant  --customer PRP-XXXXXXXX-XXXXXX --plan lifetime
 *     node scripts/pro-admin.mjs grant  --customer PRP-... --plan monthly [--expires ISO] [--extend]
 *     node scripts/pro-admin.mjs revoke --customer PRP-...
 *     node scripts/pro-admin.mjs status --customer PRP-...      (no secret needed)
 *
 * The secret is read ONLY from the ADMIN_SECRET environment variable — never
 * from a flag (which would land in shell history) and never printed.
 */
import { parseArgs } from 'node:util';
import { normalizeCustomerId } from '../shared/customerId.js';

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

const [command, ...rest] = process.argv.slice(2);
if (!['grant', 'revoke', 'status'].includes(command)) {
  die('Usage: node scripts/pro-admin.mjs <grant|revoke|status> --customer <ID> [--plan lifetime|monthly] [--expires ISO] [--extend] [--note text]', 2);
}

let values;
try {
  ({ values } = parseArgs({
    args: rest, strict: true, allowPositionals: false,
    options: { customer: { type: 'string' }, plan: { type: 'string' }, expires: { type: 'string' }, extend: { type: 'boolean' }, note: { type: 'string' } },
  }));
} catch (err) {
  die(`Invalid arguments: ${err.message}`, 2);
}

const customerId = normalizeCustomerId(values.customer);
if (!customerId) die('--customer must be a valid PREPIFY ID (format PRP-XXXXXXXX-XXXXXX).', 2);

let base;
try {
  base = new URL(process.env.PREPIFY_URL ?? '');
} catch {
  die('Set PREPIFY_URL to your deployment, e.g. https://your-domain.vercel.app', 2);
}
const loopback = base.hostname === 'localhost' || base.hostname === '127.0.0.1';
if (base.protocol !== 'https:' && !(base.protocol === 'http:' && loopback)) {
  die('PREPIFY_URL must use https:// (plain http is only allowed for localhost) so the secret is never sent in clear text.', 2);
}

let response;
try {
  if (command === 'status') {
    response = await fetch(new URL(`/api/entitlement?id=${encodeURIComponent(customerId)}`, base), { signal: AbortSignal.timeout(10_000) });
  } else {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) die('Set the ADMIN_SECRET environment variable (it is never accepted as a flag).', 2);
    const body = command === 'grant'
      ? { customerId, plan: values.plan, expiresAt: values.expires, extend: values.extend, note: values.note }
      : { customerId, note: values.note };
    response = await fetch(new URL(`/api/admin/${command}`, base), {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  }
} catch {
  die('Request failed (network error or timeout). Nothing was changed on this machine.');
}

const text = await response.text();
let printable = text;
try { printable = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not JSON — print as-is */ }
console.log(`HTTP ${response.status}\n${printable}`);
process.exit(response.ok ? 0 : 1);
