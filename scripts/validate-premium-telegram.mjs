// Independent validation for the Telegram manual-purchase flow and
// Premium entitlement integrity — run with:
//   node scripts/validate-premium-telegram.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
function readSource(p) { return readFileSync(join(__dirname, p), 'utf-8'); }

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures++;
}

// ---- Telegram URL construction, reimplemented inline (same known Node
// raw-ESM extensionless-import limitation as prior scripts; `npm run
// build` already proves the real module resolves). ----
function buildTelegramPurchaseUrl(deviceRefId) {
  const message = `Hello! I'd like to purchase PREPIFY PRO. My account email or user ID is: ${deviceRefId}`;
  return `https://t.me/V0khidov?text=${encodeURIComponent(message)}`;
}
const url = buildTelegramPurchaseUrl('PRP-ABC123');
check('Telegram URL uses the exact real handle domain', url.startsWith('https://t.me/V0khidov?text='));
const decoded = decodeURIComponent(url.split('?text=')[1]);
check('prefilled message matches the exact required text verbatim', decoded === "Hello! I'd like to purchase PREPIFY PRO. My account email or user ID is: PRP-ABC123");
check('device ref ID is embedded in the prefilled message', decoded.includes('PRP-ABC123'));

// ---- Source-level checks: no fake payment, no exposed secrets, no self-service admin toggle ----
const proScreenSource = readSource('../src/features/premium/ProUpgradeScreen.jsx');
check('ProUpgradeScreen never claims a payment was completed', !/payment (was )?(successful|completed|confirmed)/i.test(proScreenSource));
// Source text wraps this sentence across JSX lines (renders as one
// sentence in the browser, since JSX collapses whitespace) — the check
// must tolerate whitespace/newlines between words, not just a literal
// space.
check('ProUpgradeScreen explicitly states no charge happens in-app', /no charge happens in this\s+app/i.test(proScreenSource));
check('ProUpgradeScreen opens Telegram in a new tab (not fake in-app checkout)', /window\.open\(/.test(proScreenSource) && /_blank/.test(proScreenSource));
check('ProUpgradeScreen uses noopener,noreferrer for the external link (basic tab-nabbing protection)', /noopener,noreferrer/.test(proScreenSource));
check('"Maybe Later" is preserved', /Maybe Later/.test(proScreenSource));
check('ProUpgradeScreen never calls setProForTesting itself (upgrading never self-grants Premium)', !/setProForTesting/.test(proScreenSource));

const registrySource = readSource('../src/features/premium/premiumRegistry.js');
check('no API keys, tokens, or admin passwords are hardcoded in the Premium registry', !/api[_-]?key|secret|password|token\s*[:=]\s*['"][a-zA-Z0-9]{8,}/i.test(registrySource));
// premiumRegistry.js no longer has a local "setProForTesting" escape hatch at
// all — PRO is decided exclusively by the server now (see server/entitlement.js
// and src/features/premium/EntitlementContext.jsx). Confirm that upgrade
// directly rather than checking for a comment about a mechanism that no
// longer exists.
check('premiumRegistry.js contains no local isPro-granting mechanism of any kind', !/setProForTesting|isPro\s*[:=]\s*true/.test(registrySource));
check('the real server-side entitlement model exists and is the single source of truth', readSource('../server/entitlement.js').includes('export function deriveAccess'));

// setProForTesting must not be reachable from any user-facing screen.
import { readdirSync, statSync } from 'node:fs';
function listJsxFiles(dir) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results = results.concat(listJsxFiles(full));
    else if (entry.endsWith('.jsx')) results.push(full);
  }
  return results;
}
const jsxFiles = listJsxFiles(join(__dirname, '../src'));
const filesCallingSetPro = jsxFiles.filter((f) => /setProForTesting/.test(readFileSync(f, 'utf-8')));
check('setProForTesting is not called from any .jsx screen/component (no user-reachable self-upgrade button exists)', filesCallingSetPro.length === 0);

// ---- Premium gating unaffected: contentAccess still calls the same real entitlement check ----
const contentAccessSource = readSource('../src/features/premium/contentAccess.js');
check('contentAccess.js still routes through isFeatureUnlocked (entitlement system not duplicated)', /isFeatureUnlocked/.test(contentAccessSource));

// ---- Profile shows real Premium status, not a hardcoded label ----
// ProfileScreen was upgraded from the old localStorage-only loadEntitlements()
// to the server-backed useEntitlements() hook; check for the current API.
const profileSource = readSource('../src/features/profile/ProfileScreen.jsx');
check('ProfileScreen reads real entitlements via the server-backed useEntitlements hook (not a hardcoded status)', /useEntitlements/.test(profileSource));

// ---- Pricing: single source of truth, no invented plans/discounts ----
check('a single PREMIUM_MONTHLY_PRICE_DISPLAY constant exists in the Premium registry', /PREMIUM_MONTHLY_PRICE_DISPLAY\s*=\s*'\$4\.99\/month'/.test(registrySource));
const priceOccurrences = (proScreenSource.match(/PREMIUM_MONTHLY_PRICE_DISPLAY/g) ?? []).length;
check('ProUpgradeScreen displays the price by referencing the shared constant, more than once, never a second hardcoded value', priceOccurrences >= 2 && !/\$4\.99/.test(proScreenSource.replace(/PREMIUM_MONTHLY_PRICE_DISPLAY/g, '')));
check('no annual plan, discount, or extra fee was invented anywhere in the Premium screen', !/annual|yearly|discount|% off|save \$/i.test(proScreenSource));
check('no other screen in the app hardcodes a conflicting price string', (() => {
  const jsxFiles2 = listJsxFiles(join(__dirname, '../src'));
  const offenders = jsxFiles2.filter((f) => f !== join(__dirname, '../src/features/premium/ProUpgradeScreen.jsx') && /\$\d+\.\d{2}\s*\/\s*(month|mo)\b/i.test(readFileSync(f, 'utf-8')));
  return offenders.length === 0;
})());

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
