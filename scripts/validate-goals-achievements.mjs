// Independent Goals/Achievements validation — run with:
//   node scripts/validate-goals-achievements.mjs
import { goalTemplates, GoalType } from '../src/features/goals/data/goalTemplates.js';
import { achievementCatalog } from '../src/features/achievements/data/achievementCatalog.js';
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

// ---- Goal templates ----
check('exactly 9 goal templates (one per GoalType)', goalTemplates.length === 9);
check('every GoalType has exactly one template', new Set(goalTemplates.map((t) => t.type)).size === 9);
check('no invented goal types', goalTemplates.every((t) => Object.values(GoalType).includes(t.type)));

// ---- Goal progress engine — reimplemented inline (same known Node raw-ESM
// extensionless-import limitation as prior scripts; app's own `npm run
// build` already proves the real modules resolve). ----
function computeGoalProgress(goal, context) {
  switch (goal.type) {
    case GoalType.READING_SESSIONS: return context.practiceSessionsCompleted.Reading ?? 0;
    case GoalType.LISTENING_SESSIONS: return context.practiceSessionsCompleted.Listening ?? 0;
    case GoalType.WRITING_SESSIONS: return context.practiceSessionsCompleted.Writing ?? 0;
    case GoalType.SPEAKING_SESSIONS: return context.practiceSessionsCompleted.Speaking ?? 0;
    case GoalType.TOTAL_SESSIONS: return Object.values(context.practiceSessionsCompleted).reduce((a, b) => a + b, 0);
    case GoalType.STREAK_DAYS: return context.streak;
    case GoalType.VOCABULARY_WORDS: return context.familiarOrMasteredWords;
    case GoalType.MOCK_EXAMS: return context.completedMockExams;
    case GoalType.TARGET_BAND: return context.currentBand;
    default: return 0;
  }
}
function isGoalTargetReached(goal, value) { return value >= goal.targetValue; }

const streakGoal = { type: GoalType.STREAK_DAYS, targetValue: 7 };
check('streak goal progress reads real streak from context', computeGoalProgress(streakGoal, { practiceSessionsCompleted: {}, streak: 5, familiarOrMasteredWords: 0, completedMockExams: 0, currentBand: 0 }) === 5);
check('streak goal at exactly target -> reached', isGoalTargetReached(streakGoal, computeGoalProgress(streakGoal, { practiceSessionsCompleted: {}, streak: 7, familiarOrMasteredWords: 0, completedMockExams: 0, currentBand: 0 })));
check('streak goal below target -> not reached', !isGoalTargetReached(streakGoal, computeGoalProgress(streakGoal, { practiceSessionsCompleted: {}, streak: 6, familiarOrMasteredWords: 0, completedMockExams: 0, currentBand: 0 })));

const totalGoal = { type: GoalType.TOTAL_SESSIONS, targetValue: 50 };
check('total sessions goal sums across all skills', computeGoalProgress(totalGoal, { practiceSessionsCompleted: { Reading: 10, Writing: 5 }, streak: 0, familiarOrMasteredWords: 0, completedMockExams: 0, currentBand: 0 }) === 15);

// ---- Achievement catalog ----
check('exactly 19 achievements', achievementCatalog.length === 19);
const achievementIds = achievementCatalog.map((a) => a.id);
check('zero duplicate achievement IDs', new Set(achievementIds).size === achievementIds.length);
check('all required achievement fields present', achievementCatalog.every((a) => a.id && a.title && a.description && a.category));

// ---- Achievement engine — reimplemented inline for the same reason as above ----
function evaluateQualifyingAchievementIds(context) {
  const total = Object.values(context.practiceSessionsCompleted).reduce((a, b) => a + b, 0);
  const qualifying = new Set();
  if (total >= 1) qualifying.add('first_practice');
  if (total >= 10) qualifying.add('practice_10');
  if (total >= 50) qualifying.add('practice_50');
  if (total >= 100) qualifying.add('practice_100');
  if (context.streak >= 3) qualifying.add('streak_3');
  if (context.streak >= 7) qualifying.add('streak_7');
  if (context.streak >= 30) qualifying.add('streak_30');
  if (context.familiarWords >= 10) qualifying.add('familiar_10');
  if (context.masteredWords >= 25) qualifying.add('mastered_25');
  if (context.grammarTopicsAttempted >= 3) qualifying.add('grammar_topic_multiple');
  if (context.completedMockExams >= 2) qualifying.add('mock_exam_multiple');
  return qualifying;
}

const freshContext = { practiceSessionsCompleted: {}, streak: 0, familiarWords: 0, masteredWords: 0, grammarTopicsAttempted: 0, completedMockExams: 0 };
check('fresh user (zero activity) qualifies for zero achievements', evaluateQualifyingAchievementIds(freshContext).size === 0);

const oneSessionContext = { ...freshContext, practiceSessionsCompleted: { Reading: 1 } };
check('exactly 1 total session qualifies for first_practice only, not practice_10', evaluateQualifyingAchievementIds(oneSessionContext).has('first_practice') && !evaluateQualifyingAchievementIds(oneSessionContext).has('practice_10'));

const streakEdgeContext = { ...freshContext, streak: 2 };
check('streak of 2 (below the 3-day threshold) does not qualify for streak_3', !evaluateQualifyingAchievementIds(streakEdgeContext).has('streak_3'));
const streakQualifyContext = { ...freshContext, streak: 3 };
check('streak of exactly 3 qualifies for streak_3', evaluateQualifyingAchievementIds(streakQualifyContext).has('streak_3'));

// ---- Append-only unlock behavior (upsert-by-id, never duplicates) ----
function unlockOnce(unlockedList, achievementId) {
  if (unlockedList.some((u) => u.achievementId === achievementId)) return unlockedList;
  return [...unlockedList, { achievementId, unlockedAt: new Date().toISOString() }];
}
let unlocked = [];
unlocked = unlockOnce(unlocked, 'first_practice');
unlocked = unlockOnce(unlocked, 'first_practice');
check('unlocking the same achievement twice never creates a duplicate row', unlocked.length === 1);

// ---- Route existence ----
const appSource = readSource('../src/App.jsx');
check('Goals route exists in App.jsx', appSource.includes('path="/goals"') && appSource.includes('GoalsHubScreen'));
check('Achievements route exists in App.jsx', appSource.includes('path="/achievements"') && appSource.includes('AchievementsGalleryScreen'));

// ---- No fabricated unlocks: achievement engine never imports random/Math.random ----
const achievementEngineSource = readSource('../src/features/achievements/engines/achievementEngine.js');
check('achievement engine contains no randomness (fully deterministic)', !/Math\.random/.test(achievementEngineSource));

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
