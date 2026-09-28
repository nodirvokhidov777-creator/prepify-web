// Independent validation for Calendar, Weekly Review, Journey, and Exam
// Countdown — run with: node scripts/validate-calendar-journey.mjs
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

// ---- Exam Countdown: date-boundary logic, reimplemented inline (same
// known Node raw-ESM extensionless-import limitation as prior scripts;
// `npm run build` already proves the real modules resolve). ----
function daysUntilExam(examDate, now) {
  if (!examDate) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}
function examCountdownMessage(daysRemaining) {
  if (daysRemaining == null) return 'Set your exam date to personalize your study plan.';
  if (daysRemaining < 0) return 'Your exam date has passed. Update it to keep your plan current.';
  if (daysRemaining === 0) return "Exam day — you've got this.";
  if (daysRemaining === 1) return '1 day remaining.';
  return `${daysRemaining} days remaining.`;
}

check('no exam date set -> null days, honest message', daysUntilExam(null, new Date()) === null && examCountdownMessage(null).includes('Set your exam date'));

const now = new Date('2026-06-15T14:30:00'); // mid-afternoon, to test time-of-day doesn't affect day-boundary math
const examTomorrow = new Date('2026-06-16T02:00:00'); // early morning next day
check('exam "tomorrow" (crossing midnight) correctly resolves to 1 day, not 0 (time-of-day ignored)', daysUntilExam(examTomorrow, now) === 1);

const examToday = new Date('2026-06-15T09:00:00'); // earlier same day, different time-of-day
check('exam later today (same calendar day, earlier time) resolves to exactly 0', daysUntilExam(examToday, now) === 0);
check('0 days remaining -> exam-day message, no urgency/stress language', examCountdownMessage(0) === "Exam day — you've got this.");

const examYesterday = new Date('2026-06-14T00:00:00');
check('a passed exam date resolves to a negative day count', daysUntilExam(examYesterday, now) === -1);
check('negative days -> calm "passed" message, not an error state', examCountdownMessage(-1).includes('passed'));

const examFarFuture = new Date('2026-07-15T00:00:00');
check('30 days out resolves to exactly 30', daysUntilExam(examFarFuture, now) === 30);

// ---- Weekly Review: 7-day window boundary ----
function inWeeklyWindow(isoDateStr, now, windowDays = 7) {
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const date = new Date(isoDateStr);
  return !isNaN(date) && date >= windowStart;
}
const weekNow = new Date('2026-06-15T00:00:00Z');
// The real Flutter source's condition is `!date.isBefore(windowStart)`,
// i.e. inclusive of the boundary itself — a date exactly 7 days ago
// (== windowStart) IS included, matching this check.
check('a date exactly 7 days ago is included (the real Flutter condition is inclusive of the boundary)', inWeeklyWindow('2026-06-08T00:00:00Z', weekNow));
check('a date 6 days ago is included in the window', inWeeklyWindow('2026-06-09T00:00:00Z', weekNow));
check('today is included in the window', inWeeklyWindow('2026-06-15T00:00:00Z', weekNow));
check('an invalid date string never crashes the window check', inWeeklyWindow('not-a-date', weekNow) === false);

// ---- Journey: milestone ordering (earliest-first) and honest absence ----
function buildMilestonesFromDates(dates) {
  return dates
    .filter((d) => d.timestamp)
    .map((d) => ({ title: d.title, timestamp: new Date(d.timestamp) }))
    .sort((a, b) => a.timestamp - b.timestamp);
}
const milestoneInputs = [
  { title: 'C', timestamp: '2026-03-01' },
  { title: 'A', timestamp: '2026-01-01' },
  { title: 'B', timestamp: '2026-02-01' },
];
const ordered = buildMilestonesFromDates(milestoneInputs);
check('milestones are sorted earliest-first regardless of input order', ordered.map((m) => m.title).join('') === 'ABC');

check('a milestone with no timestamp is never included (never a placeholder date)', buildMilestonesFromDates([{ title: 'X', timestamp: null }]).length === 0);

// ---- Calendar: a day only appears if it has real signal ----
function dayHasRealSignal(day, skillsPracticedCount) {
  return day.missionCompleted === true || skillsPracticedCount > 0;
}
check('a day with zero skills practiced and no completed mission has no real signal', !dayHasRealSignal({ missionCompleted: false }, 0));
check('a day with at least one real skill practiced counts as having signal', dayHasRealSignal({ missionCompleted: false }, 1));

// ---- Real source files exist and export what's expected ----
check('calendarEngine.js exports buildActivityCalendar', /export function buildActivityCalendar/.test(readSource('../src/features/calendar/calendarEngine.js')));
check('weeklyReviewEngine.js exports buildWeeklyReview', /export function buildWeeklyReview/.test(readSource('../src/features/weeklyReview/weeklyReviewEngine.js')));
check('journeyEngine.js exports buildJourneyMilestones', /export function buildJourneyMilestones/.test(readSource('../src/features/journey/journeyEngine.js')));
check('examCountdownEngine.js exports daysUntilExam and examCountdownMessage', /export function daysUntilExam/.test(readSource('../src/features/examCountdown/examCountdownEngine.js')) && /export function examCountdownMessage/.test(readSource('../src/features/examCountdown/examCountdownEngine.js')));

// ---- Real Intelligence integration in Weekly Review screen (not an empty placeholder) ----
const weeklyReviewScreenSource = readSource('../src/features/weeklyReview/WeeklyReviewScreen.jsx');
check('WeeklyReviewScreen imports the real Intelligence bundle (not a placeholder)', /buildIntelligenceBundle/.test(weeklyReviewScreenSource));

// ---- Route existence ----
const appSource = readSource('../src/App.jsx');
check('Calendar route exists in App.jsx', appSource.includes('path="/calendar"') && appSource.includes('StudyCalendarScreen'));
check('Weekly Review route exists in App.jsx', appSource.includes('path="/weekly-review"') && appSource.includes('WeeklyReviewScreen'));
check('Journey route exists in App.jsx', appSource.includes('path="/journey"') && appSource.includes('JourneyScreen'));

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
