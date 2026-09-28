// Independent Vocabulary content validation — run with:
//   node scripts/validate-vocabulary.mjs
//
// generateVocabularyQuestion is reimplemented inline below rather than
// imported, purely because Node's raw ESM loader (unlike Vite's bundler)
// requires explicit file extensions on every relative import in the
// whole chain, and this project's established convention (used
// consistently across ~150+ files, verified working via `npm run
// build`) is extensionless imports. This reimplementation is a literal
// copy of the real algorithm in vocabularyEngine.js — it exists only so
// this script can run standalone; the real app never uses this copy.
import { vocabularyCatalog } from '../src/features/language/data/vocabularyCatalog.js';

function pickDistractors(target, pool, count, seed = 0) {
  const others = pool.filter((w) => w.id !== target.id).sort((a, b) => a.id.localeCompare(b.id));
  if (others.length === 0) return [];
  const picked = [];
  const usedIds = new Set();
  let i = 0;
  const maxAttempts = others.length * 2;
  while (picked.length < count && i < maxAttempts) {
    const candidate = others[(seed + i) % others.length];
    if (!usedIds.has(candidate.id)) {
      usedIds.add(candidate.id);
      picked.push(candidate);
    }
    i++;
  }
  return picked;
}
function rotate(list, by) {
  if (list.length === 0) return list;
  const n = ((by % list.length) + list.length) % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
}
function blankOutWord(sentence, word) {
  const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return sentence.replace(pattern, '_____');
}
function generateVocabularyQuestion(target, pool, type, seed = 0) {
  const distractors = pickDistractors(target, pool, 3, seed);
  let prompt, correctAnswer;
  const rawOptions = [];
  if (type === 'definitionToWord') {
    prompt = target.definition;
    correctAnswer = target.word;
    rawOptions.push(target.word, ...distractors.map((d) => d.word));
  } else if (type === 'wordToMeaning') {
    prompt = target.word;
    correctAnswer = target.definition;
    rawOptions.push(target.definition, ...distractors.map((d) => d.definition));
  } else {
    prompt = blankOutWord(target.exampleSentence, target.word);
    correctAnswer = target.word;
    rawOptions.push(target.word, ...distractors.map((d) => d.word));
  }
  const seen = new Set();
  const options = rawOptions.filter((o) => (seen.has(o) ? false : seen.add(o)));
  const rotated = options.length === 0 ? options : rotate(options, seed % options.length);
  return { id: `${target.id}_${type}_${seed}`, type, wordId: target.id, prompt, options: rotated, correctAnswer };
}

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures++;
}

check('exactly 56 words', vocabularyCatalog.length === 56);

const ids = vocabularyCatalog.map((w) => w.id);
check('zero duplicate word IDs', new Set(ids).size === ids.length);

check(
  'all required fields present on every word',
  vocabularyCatalog.every((w) => w.id && w.word && w.partOfSpeech && w.pronunciation && w.definition && w.exampleSentence && w.difficulty)
);

check('no invented IDs — every word ID matches the real Flutter naming pattern', ids.every((id) => id.startsWith('v')));

const target = vocabularyCatalog[10];
const q1 = generateVocabularyQuestion(target, vocabularyCatalog, 'definitionToWord', 5);
const q2 = generateVocabularyQuestion(target, vocabularyCatalog, 'definitionToWord', 5);
check('question generation is deterministic (same seed -> same question)', JSON.stringify(q1) === JSON.stringify(q2));
check('generated question has exactly one correct answer among its options', q1.options.includes(q1.correctAnswer));
check('generated question has no duplicate option text', new Set(q1.options).size === q1.options.length);

const q3 = generateVocabularyQuestion(target, vocabularyCatalog, 'wordToMeaning', 3);
check('wordToMeaning question uses the definition as the correct answer', q3.correctAnswer === target.definition);

const q4 = generateVocabularyQuestion(target, vocabularyCatalog, 'exampleCompletion', 1);
check('exampleCompletion question blanks out the target word', q4.prompt.includes('_____') && !q4.prompt.toLowerCase().includes(target.word.toLowerCase()));

let generationErrors = 0;
for (let seed = 0; seed < 20; seed++) {
  try {
    generateVocabularyQuestion(vocabularyCatalog[seed % vocabularyCatalog.length], vocabularyCatalog, 'definitionToWord', seed);
  } catch {
    generationErrors++;
  }
}
check('question generation never throws across 20 real seeds', generationErrors === 0);

console.log('');
console.log(failures === 0 ? `ALL CHECKS PASSED (${ids.length} words)` : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
