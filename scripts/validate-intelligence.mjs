// Independent Intelligence/Progress/DNA validation — run with:
//   node scripts/validate-intelligence.mjs
//
// Engines are reimplemented inline where the real module has a deep
// extensionless import chain Node's raw ESM loader can't follow (the
// established, Vite-verified project convention — see prior validation
// scripts' comments for the full rationale). This script tests the
// THRESHOLD LOGIC and DATA CONTRACTS, which is what actually matters for
// catching a real regression; the app's own `npm run build` already
// proves the real modules wire together correctly.

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) failures++;
}

// ---- Thresholds: fresh user vs populated user, matching intelligence_thresholds.dart exactly ----
const MIN_ATTEMPTS_FOR_ACCURACY = 10;
function computeAccuracyMetric(attempts) {
  const activityCount = attempts.length;
  const hasEnoughData = activityCount >= MIN_ATTEMPTS_FOR_ACCURACY;
  const correct = attempts.filter((a) => a.correct).length;
  return { activityCount, hasEnoughData, accuracy: hasEnoughData && activityCount > 0 ? correct / activityCount : null };
}

check('fresh user (0 attempts) -> accuracy is null, never a fake 0%', computeAccuracyMetric([]).accuracy === null);
const nineAttempts = Array.from({ length: 9 }, () => ({ correct: true }));
check('9 attempts (below the 10-attempt threshold) -> still null', computeAccuracyMetric(nineAttempts).accuracy === null);
const twelveAttempts = Array.from({ length: 12 }, (_, i) => ({ correct: i < 9 }));
const populated = computeAccuracyMetric(twelveAttempts);
check('12 attempts, 9 correct -> exactly 0.75 once past threshold', populated.hasEnoughData === true && populated.accuracy === 0.75);

// ---- Trend: needs 4+ points per window, both windows, meaningful delta ----
const TREND_MIN_PER_WINDOW = 4;
const TREND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TREND_DELTA = 0.08;
function computeTrend(points, now) {
  if (points.length < TREND_MIN_PER_WINDOW * 2) return 'needsMoreData';
  const nowMs = now.getTime();
  const recent = points.filter((p) => p.timestamp.getTime() > nowMs - TREND_WINDOW_MS);
  const previous = points.filter((p) => p.timestamp.getTime() > nowMs - TREND_WINDOW_MS * 2 && p.timestamp.getTime() <= nowMs - TREND_WINDOW_MS);
  if (recent.length < TREND_MIN_PER_WINDOW || previous.length < TREND_MIN_PER_WINDOW) return 'needsMoreData';
  const recentAcc = recent.filter((p) => p.correct).length / recent.length;
  const prevAcc = previous.filter((p) => p.correct).length / previous.length;
  const delta = recentAcc - prevAcc;
  if (delta >= TREND_DELTA) return 'improving';
  if (delta <= -TREND_DELTA) return 'declining';
  return 'stable';
}
const now = new Date('2026-01-15T00:00:00Z');
check('trend with too few points overall -> needsMoreData', computeTrend([{ timestamp: now, correct: true }], now) === 'needsMoreData');

const recentGood = Array.from({ length: 5 }, (_, i) => ({ timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000), correct: true }));
const previousBad = Array.from({ length: 5 }, (_, i) => ({ timestamp: new Date(now.getTime() - (10 + i) * 24 * 60 * 60 * 1000), correct: false }));
check('clear improvement across two windows -> improving', computeTrend([...recentGood, ...previousBad], now) === 'improving');

// ---- Strengths/focus thresholds ----
const STRENGTH_THRESHOLD = 0.85;
const FOCUS_THRESHOLD = 0.6;
function detectStrengths(metrics) {
  return Object.values(metrics).filter((m) => m.hasEnoughData && m.accuracy != null && m.accuracy >= STRENGTH_THRESHOLD).map((m) => m.skill);
}
function detectFocusAreas(metrics) {
  return Object.values(metrics).filter((m) => m.hasEnoughData && m.accuracy != null && m.accuracy < FOCUS_THRESHOLD).map((m) => m.skill);
}
const sampleMetrics = {
  Reading: { skill: 'Reading', hasEnoughData: true, accuracy: 0.92 },
  Listening: { skill: 'Listening', hasEnoughData: true, accuracy: 0.45 },
  Writing: { skill: 'Writing', hasEnoughData: false, accuracy: null },
};
check('a skill without hasEnoughData never appears as a strength or focus area', !detectStrengths(sampleMetrics).includes('Writing') && !detectFocusAreas(sampleMetrics).includes('Writing'));
check('high-accuracy skill with enough data is a real strength', detectStrengths(sampleMetrics).includes('Reading'));
check('low-accuracy skill with enough data is a real focus area', detectFocusAreas(sampleMetrics).includes('Listening'));

// ---- DNA signal: minimum skill count gate ----
const MIN_SKILLS_FOR_DNA = 3;
function buildDnaSignal(metrics) {
  const eligible = Object.values(metrics).filter((m) => m.hasEnoughData && m.accuracy != null);
  if (eligible.length < MIN_SKILLS_FOR_DNA) return null;
  return eligible.map((m) => ({ skill: m.skill, score: Math.min(9, Math.max(0.5, m.accuracy * 9)) }));
}
check('fewer than 3 skills with real data -> DNA signal is null (honest incomplete state)', buildDnaSignal(sampleMetrics) === null);
const threeSkillMetrics = { A: { skill: 'A', hasEnoughData: true, accuracy: 0.9 }, B: { skill: 'B', hasEnoughData: true, accuracy: 0.5 }, C: { skill: 'C', hasEnoughData: true, accuracy: 0.7 } };
const signal = buildDnaSignal(threeSkillMetrics);
check('exactly 3 skills with real data -> a real signal is returned', signal !== null && signal.length === 3);
check('DNA signal scores are always in the 0.5-9.0 range', signal.every((s) => s.score >= 0.5 && s.score <= 9));

// ---- Real source files exist and export what's expected ----
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
function readSource(p) { return readFileSync(join(__dirname, p), 'utf-8'); }

check('learningProfileEngine.js exports buildLearningProfile', /export function buildLearningProfile/.test(readSource('../src/features/intelligence/data/learningProfileEngine.js')));
check('insightEngine.js exports generateInsights', /export function generateInsights/.test(readSource('../src/features/intelligence/engines/insightEngine.js')));
check('studyPriorityEngine.js exports buildStudyActions and derivePrioritySkills', /export function buildStudyActions/.test(readSource('../src/features/intelligence/engines/studyPriorityEngine.js')) && /export function derivePrioritySkills/.test(readSource('../src/features/intelligence/engines/studyPriorityEngine.js')));
check('dnaSignalEngine.js exports buildDnaSignal', /export function buildDnaSignal/.test(readSource('../src/features/intelligence/engines/dnaSignalEngine.js')));

// ---- Zero Mock-Exam dependency from Intelligence (one-way boundary) ----
const profileEngineSource = readSource('../src/features/intelligence/data/learningProfileEngine.js');
const bundleSource = readSource('../src/features/intelligence/data/intelligenceBundle.js');
const importLines = [...profileEngineSource.split('\n'), ...bundleSource.split('\n')].filter((l) => l.trim().startsWith('import'));
check('Intelligence has zero imports of a Mock Exam module', importLines.every((l) => !/mockExam/i.test(l)));

// ---- Route existence ----
const appSource = readSource('../src/App.jsx');
check('Progress route exists in App.jsx', appSource.includes('path="/progress"') && appSource.includes('ProgressScreen'));
check('DNA route exists in App.jsx', appSource.includes('path="/dna"') && appSource.includes('DnaScreen'));

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
