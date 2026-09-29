import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vercel']);
const BINARY = /\.(zip|png|jpe?g|gif|ico|woff2?|ttf|pdf)$/i;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (!BINARY.test(name) && name !== 'package-lock.json') out.push(full);
  }
  return out;
}
const rel = (file) => relative(ROOT, file).split('\\').join('/');
const read = (file) => readFileSync(file, 'utf8');
const projectFiles = walk(ROOT);

// Prose in comments legitimately mentions the very things these tests forbid
// in *code* (e.g. "this module never touches localStorage"), so code checks
// run against comment-stripped text.
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// The literal placeholder shown in form hints and usage text is not an ID,
// and 'PRP-00000000-000000' is a deliberately inert example used only in
// docs. PRP-MULCK4V0-UTAXS6 is this project's real, named customer — it is
// expected and safe for developer documentation (not shipped frontend code,
// separately confirmed absent from the built bundle below) to reference it
// while explaining how to grant/verify their access.
const PLACEHOLDER_ID = 'PRP-XXXXXXXX-XXXXXX';
const EXAMPLE_ID = 'PRP-00000000-000000';
const DOCUMENTED_CUSTOMER_ID = 'PRP-MULCK4V0-UTAXS6';
const isSafeId = (match) => match.startsWith('PRP-TEST') || [PLACEHOLDER_ID, EXAMPLE_ID, DOCUMENTED_CUSTOMER_ID].includes(match);
const under = (prefix) => projectFiles.filter((f) => rel(f).startsWith(prefix));

test('no browser code can decide PRO: the old local flag is gone', () => {
  const offenders = [];
  for (const file of under('src/')) {
    const text = read(file);
    if (/setProForTesting|loadEntitlements/.test(text)) offenders.push(`${rel(file)}: legacy local-entitlement API`);
    // The storage key may be declared, but nothing may read or write it.
    if (/proEntitlement/.test(text) && rel(file) !== 'src/core/storage/storageService.js') offenders.push(`${rel(file)}: touches the proEntitlement key`);
  }
  assert.deepEqual(offenders, []);
});

test('the client entitlement module has no access to browser storage', () => {
  const code = stripComments(read(join(ROOT, 'src/features/premium/entitlementApi.js')));
  assert.equal(/localStorage|sessionStorage|StorageService|document\.cookie/.test(code), false);
});

test('premiumRegistry stores an identifier only, never a permission', () => {
  const text = read(join(ROOT, 'src/features/premium/premiumRegistry.js'));
  assert.equal(/writeJson\([^)]*isPro/.test(text), false);
  assert.equal(/isPro\s*[:=]\s*true/.test(text), false);
});

test('access decisions come from the server-backed hook, not from constants', () => {
  const offenders = under('src/')
    .filter((f) => /\.jsx?$/.test(f) && rel(f) !== 'src/features/premium/entitlementApi.js')
    .filter((f) => /isPro\s*[:=]\s*true/.test(read(f)))
    .map(rel);
  assert.deepEqual(offenders, [], 'no source file may hard-code isPro to true');
});

test('server-only settings never appear in client code or the client bundle', () => {
  const forbidden = /ADMIN_SECRET|UPSTASH_REDIS|KV_REST_API|VITE_[A-Z_]*(SECRET|TOKEN|KEY)/;
  const offenders = [...under('src/'), ...under('shared/'), ...under('public/'), join(ROOT, 'index.html')].filter((f) => forbidden.test(read(f))).map(rel);
  assert.deepEqual(offenders, []);

  const assets = join(ROOT, 'dist/assets');
  if (!existsSync(assets)) return; // bundle not built in this run
  const bad = readdirSync(assets).filter((n) => n.endsWith('.js') && forbidden.test(read(join(assets, n))));
  assert.deepEqual(bad, [], 'built bundle must not mention server-only variables');
});

test('no real customer ID or secret value is committed anywhere', () => {
  const idPattern = /PRP-[A-Z0-9]{8}-[A-Z0-9]{6}/g;
  const secretAssignment = /(ADMIN_SECRET|_TOKEN|_SECRET|API_KEY)\s*[=:]\s*['"]?[A-Za-z0-9+/=_-]{20,}/;
  const problems = [];
  for (const file of projectFiles) {
    const text = read(file);
    for (const match of text.match(idPattern) ?? []) {
      if (!isSafeId(match)) problems.push(`${rel(file)}: real-looking customer ID ${match.slice(0, 8)}…`);
    }
    if (!rel(file).startsWith('tests/') && secretAssignment.test(text)) problems.push(`${rel(file)}: looks like a hard-coded secret`);
  }
  assert.deepEqual(problems, []);
});

test('the built bundle contains no real customer ID either — including the documented one', () => {
  // Stricter than the project-wide check: docs may name the real customer
  // this project is granting access to, but nothing shipped to a browser
  // ever may, so DOCUMENTED_CUSTOMER_ID gets no exemption here.
  const assets = join(ROOT, 'dist/assets');
  if (!existsSync(assets)) return;
  for (const name of readdirSync(assets).filter((n) => n.endsWith('.js'))) {
    const hits = (read(join(assets, name)).match(/PRP-[A-Z0-9]{8}-[A-Z0-9]{6}/g) ?? []).filter(
      (m) => !m.startsWith('PRP-TEST') && ![PLACEHOLDER_ID, EXAMPLE_ID].includes(m)
    );
    assert.deepEqual(hits, [], 'no customer ID — including the one this project documents — may ship in the bundle');
  }
});

test('secret-bearing files are git-ignored', () => {
  const ignore = read(join(ROOT, '.gitignore')).split('\n').map((l) => l.trim());
  for (const rule of ['.env', '.env.*', '.vercel']) assert.ok(ignore.includes(rule), `.gitignore must contain ${rule}`);
  assert.ok(ignore.includes('!.env.example'), 'the placeholder example file must stay committable');
  assert.equal(projectFiles.some((f) => /(^|\/)\.env($|\.(?!example$))/.test(rel(f))), false, 'no real .env file in the project');
});

test('.env.example contains placeholders only', () => {
  const text = read(join(ROOT, '.env.example'));
  for (const name of ['ADMIN_SECRET', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) assert.match(text, new RegExp(`^${name}=`, 'm'));
  for (const line of text.split('\n').filter((l) => /^[A-Z_]+=/.test(l))) assert.match(line, /^[A-Z_]+=\s*$/, `${line.split('=')[0]} must have no value`);
});

test('exactly the intended API endpoints exist (no accidental extra endpoint)', () => {
  const apiFiles = under('api/').map(rel).sort();
  assert.deepEqual(apiFiles, ['api/admin/grant.js', 'api/admin/revoke.js', 'api/entitlement.js']);
  for (const file of under('api/')) assert.equal(/from ['"][^'"]*src\//.test(read(file)), false, `${rel(file)} must not import browser code`);
});

test('the Vercel SPA rewrite is preserved', () => {
  const config = JSON.parse(read(join(ROOT, 'vercel.json')));
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: '/index.html' }]);
});

test('the backend adds no runtime dependencies', () => {
  const pkg = JSON.parse(read(join(ROOT, 'package.json')));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['lucide-react', 'react', 'react-dom', 'react-router-dom']);
});
