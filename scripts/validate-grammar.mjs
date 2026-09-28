// Independent Grammar content validation — run with:
//   node scripts/validate-grammar.mjs
import { grammarTopicsCatalog, grammarQuestionsCatalog } from '../src/features/language/data/grammarCatalog.js';

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures++;
}

check('exactly 12 topics', grammarTopicsCatalog.length === 12);
check('exactly 48 questions', grammarQuestionsCatalog.length === 48);

const topicIds = grammarTopicsCatalog.map((t) => t.id);
check('zero duplicate topic IDs', new Set(topicIds).size === topicIds.length);

const questionIds = grammarQuestionsCatalog.map((q) => q.id);
check('zero duplicate question IDs', new Set(questionIds).size === questionIds.length);

check('every question references a real topic', grammarQuestionsCatalog.every((q) => topicIds.includes(q.topicId)));

check('every correctAnswer is a listed option', grammarQuestionsCatalog.every((q) => q.options.includes(q.correctAnswer)));

check('every question has a non-empty explanation', grammarQuestionsCatalog.every((q) => q.explanation && q.explanation.length > 0));

const types = new Set(grammarQuestionsCatalog.map((q) => q.type));
check('all 3 real question types present (multipleChoice, fillGap, errorDetection)', ['multipleChoice', 'fillGap', 'errorDetection'].every((t) => types.has(t)));
check('no invented question types', [...types].every((t) => ['multipleChoice', 'fillGap', 'errorDetection'].includes(t)));

check(
  'all required topic fields present',
  grammarTopicsCatalog.every((t) => t.id && t.title && t.description && t.category && t.difficulty && t.keyRule)
);

check('no invented IDs — topics/questions match the real Flutter naming pattern', topicIds.every((id) => !id.includes('undefined')) && questionIds.every((id) => !id.includes('undefined')));

// Every topic has at least one real question (no orphan topic with zero content)
check('every topic has at least one question', grammarTopicsCatalog.every((t) => grammarQuestionsCatalog.some((q) => q.topicId === t.id)));

console.log('');
console.log(failures === 0 ? `ALL CHECKS PASSED (${topicIds.length} topics, ${questionIds.length} questions)` : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
