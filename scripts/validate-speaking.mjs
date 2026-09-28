// Independent Speaking content validation — run with:
//   node scripts/validate-speaking.mjs
import { speakingSessionCatalog } from '../src/features/speaking/data/speakingSessionCatalog.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentAccessSource = readFileSync(join(__dirname, '../src/features/premium/contentAccess.js'), 'utf-8');
const appSource = readFileSync(join(__dirname, '../src/App.jsx'), 'utf-8');

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures++;
}

check('exactly 60 sessions', speakingSessionCatalog.length === 60);

const part1 = speakingSessionCatalog.filter((s) => s.part === 'part1');
const part2 = speakingSessionCatalog.filter((s) => s.part === 'part2');
const part3 = speakingSessionCatalog.filter((s) => s.part === 'part3');
check('exactly 20 Part 1', part1.length === 20);
check('exactly 20 Part 2', part2.length === 20);
check('exactly 20 Part 3', part3.length === 20);

const ids = speakingSessionCatalog.map((s) => s.id);
check('zero duplicate session IDs', new Set(ids).size === ids.length);

check(
  'no missing required fields',
  speakingSessionCatalog.every((s) => s.id && s.title && s.subtitle && s.part && s.difficulty && s.questions.length > 0)
);

const speakingPremiumRefs = [...(contentAccessSource.match(/'speaking_[^']*'/g) ?? [])].map((s) => s.slice(1, -1));
check('exactly 20 Premium sessions registered', speakingPremiumRefs.length === 20);
check('every Premium ID resolves to a real session', speakingPremiumRefs.every((id) => ids.includes(id)));

check('no invented IDs — every session ID matches the real Flutter naming pattern', ids.every((id) => id.startsWith('speaking_')));

const allQuestionIds = speakingSessionCatalog.flatMap((s) => s.questions.map((q) => q.id));
check('zero duplicate question IDs', new Set(allQuestionIds).size === allQuestionIds.length);

// Route resolution checks — every route this module needs actually exists in App.jsx
const requiredRoutes = [
  '/practice/speaking',
  '/practice/speaking/preview/:sessionId',
  '/practice/speaking/session/:sessionId',
  '/practice/speaking/results/:sessionId',
  '/practice/speaking/review/:sessionId',
];
check('every Speaking route exists in App.jsx', requiredRoutes.every((r) => appSource.includes(`path="${r}"`)));

check('Mock Exam Speaking reference (speaking_part1_v1) resolves', ids.includes('speaking_part1_v1'));

console.log('');
console.log(failures === 0 ? `ALL CHECKS PASSED (${ids.length} sessions, ${allQuestionIds.length} questions)` : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
