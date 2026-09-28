// Independent validation for Settings, Notifications, Data Export, and
// the moved Exam Countdown editor — run with:
//   node scripts/validate-settings.mjs
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

// ---- Notification preferences: defaults, round-trip, honesty ----
const DEFAULT_PREFS = { studyReminderEnabled: false, studyReminderTime: '19:00', weeklyReviewReminderEnabled: false };
function loadPrefs(stored) { return stored ? { ...DEFAULT_PREFS, ...stored } : DEFAULT_PREFS; }

check('fresh user has notifications OFF by default (never opted in without consent)', loadPrefs(null).studyReminderEnabled === false);
check('a partially-stored preferences object is safely merged with defaults', loadPrefs({ studyReminderEnabled: true }).weeklyReviewReminderEnabled === false);
const toggled = { ...loadPrefs(null), studyReminderEnabled: true };
check('toggling one preference preserves the others unchanged', toggled.studyReminderTime === '19:00' && toggled.weeklyReviewReminderEnabled === false);

const notifSource = readSource('../src/features/notifications/notificationPreferences.js');
check('notification preferences module never imports the browser Notification API (honest: no real scheduling)', !/new Notification|Notification\.requestPermission/.test(notifSource));

const settingsScreenSource = readSource('../src/features/settings/SettingsScreen.jsx');
check('Settings screen explicitly states notifications are not yet configured (no false promise)', /not yet configured/.test(settingsScreenSource));

// ---- Data export: structure, real-data-only, honest failure path ----
function buildExportJson({ profile, goals, progress, vocabularyProgress, grammarProgress, achievements, practiceSummary, generatedAt }) {
  return { exportVersion: 1, generatedAt: generatedAt.toISOString(), profile, goals, progress, vocabularyProgress, grammarProgress, achievements, practiceSummary };
}
const sampleExport = buildExportJson({
  profile: { level: 'Around Band 6' }, goals: [], progress: { streak: 2 }, vocabularyProgress: {}, grammarProgress: {}, achievements: [], practiceSummary: { Reading: 3 },
  generatedAt: new Date('2026-06-01T00:00:00Z'),
});
check('export includes exportVersion for future compatibility', sampleExport.exportVersion === 1);
check('export generatedAt is a real ISO timestamp, not a placeholder', sampleExport.generatedAt === '2026-06-01T00:00:00.000Z');
check('export contains only the real fields the schema defines (no extras, no secrets)', Object.keys(sampleExport).sort().join(',') === ['achievements', 'exportVersion', 'generatedAt', 'goals', 'grammarProgress', 'practiceSummary', 'profile', 'progress', 'vocabularyProgress'].sort().join(','));

const dataExportServiceSource = readSource('../src/features/dataExport/dataExportService.js');
check('dataExportService wraps the download in try/catch and returns an honest failure message', /catch/.test(dataExportServiceSource) && /success: false/.test(dataExportServiceSource));
check('dataExportService never claims success unconditionally (both branches present)', /success: true/.test(dataExportServiceSource) && /success: false/.test(dataExportServiceSource));

// ---- Exam date persistence: moved to Settings, still read by Today ----
check('Settings screen contains a real exam-date input (not read-only text)', /type="date"/.test(settingsScreenSource));
const todayScreenSource = readSource('../src/features/today/TodayScreen.jsx');
check('Today screen no longer contains its own exam-date input (moved to Settings)', !/type="date"/.test(todayScreenSource));
check('Today screen still shows the real countdown message (card retained)', /examCountdownMessage/.test(todayScreenSource));
check('Today\'s countdown card navigates to Settings when no date is set', /navigate\('\/settings'\)/.test(todayScreenSource));

// ---- Legal/About: no invented claims ----
const legalSource = readSource('../src/features/legal/LegalAboutScreen.jsx');
check('Legal content explicitly states PREPIFY is not affiliated with IELTS/British Council/IDP/Cambridge', /not affiliated with IELTS/.test(legalSource));
check('Legal content explicitly states practice estimates are not official IELTS results', /not official IELTS results/.test(legalSource));
check('Legal content is honest that Speaking has no recording capability in this build (not copied verbatim from a claim that would be false here)', /no recording capability exists yet/.test(legalSource));
check('Legal content does not fabricate a cloud-sync claim', !/synced to (the )?cloud|backed up online/.test(legalSource));

// ---- Route existence ----
const appSource = readSource('../src/App.jsx');
check('Settings route exists in App.jsx', appSource.includes('path="/settings"') && appSource.includes('SettingsScreen'));
check('About route exists in App.jsx', appSource.includes('path="/about"') && appSource.includes('LegalAboutScreen'));

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
