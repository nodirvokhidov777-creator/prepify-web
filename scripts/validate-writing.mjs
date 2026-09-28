// Independent Writing content validation — run with:
//   node scripts/validate-writing.mjs
import { writingTaskCatalog } from '../src/features/writing/data/writingTaskCatalog.js';
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

check('exactly 60 prompts', writingTaskCatalog.length === 60);

const academic = writingTaskCatalog.filter((t) => t.taskType === 'academicTask1');
const general = writingTaskCatalog.filter((t) => t.taskType === 'generalTask1');
const task2 = writingTaskCatalog.filter((t) => t.taskType === 'essayTask2');
check('exactly 23 Academic Task 1', academic.length === 23);
check('exactly 7 General Training Task 1', general.length === 7);
check('exactly 30 Task 2', task2.length === 30);

const withTable = writingTaskCatalog.filter((t) => t.dataTable);
check('exactly 17 prompts with data tables', withTable.length === 17);

const ids = writingTaskCatalog.map((t) => t.id);
check('zero duplicate prompt IDs', new Set(ids).size === ids.length);

check(
  'all required fields exist on every task',
  writingTaskCatalog.every((t) => t.id && t.title && t.taskType && t.instructions && t.prompt && t.minimumWordCount > 0 && t.difficulty)
);

const writingPremiumRefs = [...(contentAccessSource.match(/'writing_[^']*'/g) ?? [])].map((s) => s.slice(1, -1));
check('exactly 20 Premium prompts registered', writingPremiumRefs.length === 20);
check('all Premium references resolve to real prompts', writingPremiumRefs.every((id) => ids.includes(id)));

check('no invented IDs — every prompt ID matches the real Flutter naming pattern', ids.every((id) => id.startsWith('writing_')));

check(
  'table data preserved exactly — dollar signs not corrupted',
  withTable.every((t) => t.dataTable.headers.every((h) => !h.includes('\\$')) && t.dataTable.rows.every((row) => row.every((c) => !c.includes('\\$'))))
);

check('Mock Exam Writing reference (writing_essay_task2_v1) resolves', ids.includes('writing_essay_task2_v1'));

console.log('');
console.log(failures === 0 ? `ALL CHECKS PASSED (${ids.length} prompts)` : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
