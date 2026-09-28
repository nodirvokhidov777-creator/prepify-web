// Independent Mock Exam validation — run with:
//   node scripts/validate-mockexam.mjs
import { prepifyFullMockExam } from '../src/features/mockExam/data/mockExamContent.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
function readSource(relPath) {
  return readFileSync(join(__dirname, relPath), 'utf-8');
}

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures++;
}

check('exactly 4 sections', prepifyFullMockExam.sections.length === 4);
check('has one of each section type', ['reading', 'listening', 'writing', 'speaking'].every((t) => prepifyFullMockExam.sections.some((s) => s.type === t)));

// Reference resolution — extract catalog IDs by reading source as text
// (avoids Node's raw-ESM extensionless-import limitation on deeper
// chains; the app's own successful `npm run build` already proves the
// real import graph resolves).
const readingSource = readSource('../src/features/reading/data/readingPassagesCatalog.js');
const listeningSource = readSource('../src/features/listening/data/listeningSessionsCatalog.js');
const writingSource = readSource('../src/features/writing/data/writingTaskCatalog.js');
const speakingSource = readSource('../src/features/speaking/data/speakingSessionCatalog.js');

const refs = {
  reading: prepifyFullMockExam.sections.find((s) => s.type === 'reading').contentId,
  listening: prepifyFullMockExam.sections.find((s) => s.type === 'listening').contentId,
  writing: prepifyFullMockExam.sections.find((s) => s.type === 'writing').contentId,
  speaking: prepifyFullMockExam.sections.find((s) => s.type === 'speaking').contentId,
};

check(`Reading reference (${refs.reading}) resolves`, readingSource.includes(`"${refs.reading}"`));
check(`Listening reference (${refs.listening}) resolves`, listeningSource.includes(`"${refs.listening}"`));
check(`Writing reference (${refs.writing}) resolves`, writingSource.includes(`"${refs.writing}"`));
check(`Speaking reference (${refs.speaking}) resolves`, speakingSource.includes(`"${refs.speaking}"`));

check('exact preserved reference IDs match the required set', JSON.stringify(refs) === JSON.stringify({
  reading: 'reading_urban_beekeeping',
  listening: 'listening_university_enquiry',
  writing: 'writing_essay_task2_v1',
  speaking: 'speaking_part1_v1',
}));

// No duplicate content — Mock Exam must not define its own copies of practice content.
const mockExamContentSource = readSource('../src/features/mockExam/data/mockExamContent.js');
check('Mock Exam content file defines no question/prompt arrays of its own', !/questions:\s*\[/.test(mockExamContentSource) && !/prompt:/.test(mockExamContentSource));

// Circular dependency check — Mock Exam must not IMPORT Intelligence (not
// migrated). Checking only actual import statements, not prose comments
// (which legitimately mention "Intelligence" while explaining why it's
// deliberately not imported).
const mockExamServiceSource = readSource('../src/features/mockExam/data/mockExamService.js');
const importLines = mockExamServiceSource.split('\n').filter((line) => line.trim().startsWith('import'));
check('Mock Exam service has zero imports of an Intelligence module', importLines.every((line) => !/intelligence/i.test(line)));

// Route existence check against App.jsx
const appSource = readSource('../src/App.jsx');
const requiredRoutes = ['/mock-exam', '/mock-exam/intro', '/mock-exam/checklist/:attemptId', '/mock-exam/results/:attemptId', '/mock-exam/review/:attemptId'];
check('every Mock Exam route exists in App.jsx', requiredRoutes.every((r) => appSource.includes(`path="${r}"`)));

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
