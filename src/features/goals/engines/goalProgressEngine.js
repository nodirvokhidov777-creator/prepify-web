import { GoalType } from '../data/goalTemplates';
/** Pure, deterministic: same goal + same context always yields the same
 * progress value. Direct port of goal_progress_engine.dart. */
export function computeGoalProgress(goal, context) {
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
export function isGoalTargetReached(goal, currentValue) { return currentValue >= goal.targetValue; }
export function goalProgressFraction(goal, currentValue) {
  if (goal.targetValue <= 0) return 0;
  return Math.max(0, Math.min(1, currentValue / goal.targetValue));
}
