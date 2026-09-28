/** Returns the set of achievement IDs `context` currently qualifies for
 * — pure and deterministic. Direct port of achievement_engine.dart. */
export function evaluateQualifyingAchievementIds(context) {
  const total = Object.values(context.practiceSessionsCompleted).reduce((a, b) => a + b, 0);
  const qualifying = new Set();

  if (total >= 1) qualifying.add('first_practice');
  if (total >= 10) qualifying.add('practice_10');
  if (total >= 50) qualifying.add('practice_50');
  if (total >= 100) qualifying.add('practice_100');

  if (context.streak >= 3) qualifying.add('streak_3');
  if (context.streak >= 7) qualifying.add('streak_7');
  if (context.streak >= 30) qualifying.add('streak_30');

  if ((context.practiceSessionsCompleted.Reading ?? 0) >= 1) qualifying.add('reading_explorer');
  if ((context.practiceSessionsCompleted.Listening ?? 0) >= 1) qualifying.add('listening_explorer');
  if ((context.practiceSessionsCompleted.Writing ?? 0) >= 1) qualifying.add('writing_builder');
  if ((context.practiceSessionsCompleted.Speaking ?? 0) >= 1) qualifying.add('speaking_starter');

  if (context.familiarWords >= 10) qualifying.add('familiar_10');
  if (context.familiarWords >= 25) qualifying.add('familiar_25');
  if (context.masteredWords >= 10) qualifying.add('mastered_10');
  if (context.masteredWords >= 25) qualifying.add('mastered_25');

  if (context.grammarTopicsAttempted >= 1) qualifying.add('grammar_topic_1');
  if (context.grammarTopicsAttempted >= 3) qualifying.add('grammar_topic_multiple');

  if (context.completedMockExams >= 1) qualifying.add('mock_exam_1');
  if (context.completedMockExams >= 2) qualifying.add('mock_exam_multiple');

  return qualifying;
}
