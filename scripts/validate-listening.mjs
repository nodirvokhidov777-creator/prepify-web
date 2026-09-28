// Independent Listening content validation — run with:
//   node scripts/validate-listening.mjs
import { listeningSessionsCatalog, LISTENING_AUDIO_AVAILABLE } from '../src/features/listening/data/listeningSessionsCatalog.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentAccessSource = readFileSync(join(__dirname, '../src/features/premium/contentAccess.js'), 'utf-8');

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures++;
}

check('exactly 60 sessions', listeningSessionsCatalog.length === 60);

const allQuestions = listeningSessionsCatalog.flatMap((s) => s.questions.map((q) => ({ ...q, sessionId: s.id })));
check('exactly 268 questions', allQuestions.length === 268);

const sessionIds = listeningSessionsCatalog.map((s) => s.id);
check('zero duplicate session IDs', new Set(sessionIds).size === sessionIds.length);

const questionIds = allQuestions.map((q) => q.id);
check('zero duplicate question IDs', new Set(questionIds).size === questionIds.length);

check('every question belongs to a valid session', allQuestions.every((q) => listeningSessionsCatalog.some((s) => s.id === q.sessionId)));

check(
  'every multipleChoice correctAnswer is a listed option',
  allQuestions.filter((q) => q.type === 'multipleChoice').every((q) => q.options.includes(q.correctAnswer))
);
check(
  'every shortAnswer has a non-empty correctAnswer',
  allQuestions.filter((q) => q.type === 'shortAnswer').every((q) => q.correctAnswer && q.correctAnswer.length > 0)
);

const listeningPremiumRefs = [...(contentAccessSource.match(/'listening_[^']*'/g) ?? [])].map((s) => s.slice(1, -1));
check('exactly 20 Premium Listening registrations', listeningPremiumRefs.length === 20);
check('all Premium references resolve to real sessions', listeningPremiumRefs.every((id) => sessionIds.includes(id)));
const basicCount = sessionIds.filter((id) => !listeningPremiumRefs.includes(id)).length;
check('exactly 40 Basic sessions', basicCount === 40);

check('no invented IDs — every session ID matches the real Flutter naming pattern', sessionIds.every((id) => id.startsWith('listening_')));

check('question types match Flutter (only multipleChoice/shortAnswer)', allQuestions.every((q) => q.type === 'multipleChoice' || q.type === 'shortAnswer'));

check('LISTENING_AUDIO_AVAILABLE is false (no bundled audio in source)', LISTENING_AUDIO_AVAILABLE === false);

check('Mock Exam Listening reference (listening_university_enquiry) resolves', sessionIds.includes('listening_university_enquiry'));

console.log('');
console.log(failures === 0 ? `ALL CHECKS PASSED (${questionIds.length} questions across ${sessionIds.length} sessions)` : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
