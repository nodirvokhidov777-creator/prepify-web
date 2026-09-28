// Independent Reading content validation — run with:
//   node scripts/validate-reading.mjs
import { readingPassagesCatalog } from '../src/features/reading/data/readingPassagesCatalog.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Read the Premium registry as source text rather than importing it —
// its own import of premiumRegistry.js has no file extension, which
// Node's plain ESM loader (unlike Vite's bundler) refuses to resolve.
const contentAccessSource = readFileSync(join(__dirname, '../src/features/premium/contentAccess.js'), 'utf-8');

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures++;
}

check('exactly 7 passages', readingPassagesCatalog.length === 7);

const totalQuestions = readingPassagesCatalog.reduce((n, p) => n + p.questions.length, 0);
check('exactly 58 questions', totalQuestions === 58);

const passageIds = readingPassagesCatalog.map((p) => p.id);
check('no duplicate passage IDs', new Set(passageIds).size === passageIds.length);

const allQuestions = readingPassagesCatalog.flatMap((p) => p.questions.map((q) => ({ ...q, passageId: p.id })));
const questionIds = allQuestions.map((q) => q.id);
check('no duplicate question IDs', new Set(questionIds).size === questionIds.length);

check(
  'every question belongs to an existing passage',
  allQuestions.every((q) => readingPassagesCatalog.some((p) => p.id === q.passageId))
);

check(
  'every correct answer is a valid listed option',
  allQuestions.every((q) => q.options.includes(q.correctAnswer))
);

check(
  'every question has a non-empty explanation',
  allQuestions.every((q) => typeof q.explanation === 'string' && q.explanation.length > 0)
);

const readingPremiumRefs = (contentAccessSource.match(/'reading_[^']*'/g) ?? []);
check('no Premium Reading registrations exist (source has none)', readingPremiumRefs.length === 0);

check(
  'no invented IDs — every passage ID matches the real Flutter naming pattern',
  passageIds.every((id) => id.startsWith('reading_'))
);

check(
  'Mock Exam Reading reference (reading_urban_beekeeping) resolves',
  readingPassagesCatalog.some((p) => p.id === 'reading_urban_beekeeping')
);

console.log('');
console.log(failures === 0 ? `ALL CHECKS PASSED (${questionIds.length} questions across ${passageIds.length} passages)` : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
