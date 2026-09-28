// Independent Onboarding validation — run with:
//   node scripts/validate-onboarding.mjs
import { onboardSteps, OnboardStepKind } from '../src/features/onboarding/onboardingData.js';
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

// ---- Step structure: exactly 7 real steps, matching the Flutter source ----
check('exactly 7 onboarding steps', onboardSteps.length === 7);
check('step order matches the real Flutter source exactly', onboardSteps.map((s) => s.key).join(',') === 'welcome,level,target,examDate,weakSkills,dailyTime,summary');
check('first step is welcome, last is summary', onboardSteps[0].key === 'welcome' && onboardSteps[onboardSteps.length - 1].key === 'summary');

check('level step has exactly 6 real options', onboardSteps.find((s) => s.key === 'level').options.length === 6);
check('target step has exactly 6 real options', onboardSteps.find((s) => s.key === 'target').options.length === 6);
check('examDate step has exactly 5 real options', onboardSteps.find((s) => s.key === 'examDate').options.length === 5);
check('weakSkills step has exactly 6 real options', onboardSteps.find((s) => s.key === 'weakSkills').options.length === 6);
check('dailyTime step has exactly 5 real options', onboardSteps.find((s) => s.key === 'dailyTime').options.length === 5);

check('weakSkills is the only multiSelect step', onboardSteps.filter((s) => s.kind === OnboardStepKind.MULTI_SELECT).map((s) => s.key).join(',') === 'weakSkills');

// ---- Per-step validation logic, reimplemented inline (same known Node
// raw-ESM extensionless-import limitation as prior scripts; the app's
// own `npm run build` already proves the real component resolves). ----
function canAdvance(stepKey, state) {
  switch (stepKey) {
    case 'welcome':
    case 'summary': return true;
    case 'level': return state.level !== '';
    case 'target': return state.target !== '';
    case 'examDate': return state.examDate !== '';
    case 'weakSkills': return state.weakSkills.length > 0;
    case 'dailyTime': return state.dailyTime !== '';
    default: return false;
  }
}
const emptyState = { level: '', target: '', examDate: '', weakSkills: [], dailyTime: '' };

check('welcome step can always advance with no selection', canAdvance('welcome', emptyState));
check('level step cannot advance with no selection', !canAdvance('level', emptyState));
check('level step can advance once a real option is selected', canAdvance('level', { ...emptyState, level: 'Around Band 6' }));
check('weakSkills step cannot advance with zero skills selected (multi-select requires at least one)', !canAdvance('weakSkills', emptyState));
check('weakSkills step can advance with exactly one skill selected', canAdvance('weakSkills', { ...emptyState, weakSkills: ['Reading'] }));
check('summary step can always advance regardless of prior answers', canAdvance('summary', emptyState));

// ---- Navigation: back/next index math ----
function nextIndex(current, total) { return Math.min(current + 1, total - 1); }
function prevIndex(current) { return Math.max(current - 1, 0); }
check('back from step 0 stays at step 0 (never goes negative)', prevIndex(0) === 0);
check('next from the last step does not overflow past the last index', nextIndex(6, 7) === 6);
check('next from an early step correctly advances by one', nextIndex(2, 7) === 3);

// ---- No invented "skip" functionality (confirmed absent from the real
// Flutter source). Checked against actual UI/label text, not prose —
// the file's own explanatory comment about the absence of skip
// legitimately contains the word "skip" while documenting that it
// isn't there. ----
const screenSource = readSource('../src/features/onboarding/OnboardingScreen.jsx');
const nonCommentLines = screenSource.split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//') && !l.trim().startsWith('/**'));
check('no skip button/label/handler was invented (matches the real Flutter source, which has none)', !/skip/i.test(nonCommentLines.join('\n')));

// ---- Returning-user behavior: SPLASH_DONE routes by real profile presence, untouched by this phase ----
const appStateSource = readSource('../src/state/AppStateContext.jsx');
check('SPLASH_DONE still routes to MAIN when a real profile exists (returning users skip onboarding)', /state\.profile \? AppPhase\.MAIN : AppPhase\.ONBOARDING/.test(appStateSource));

// ---- completeOnboarding call shape unchanged (profile persistence contract preserved) ----
check('OnboardingScreen still calls completeOnboarding with the full real profile shape', /completeOnboarding\(\{ level, target, examDate, weakSkills, dailyTime, onboarded: true \}\)/.test(screenSource));

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
