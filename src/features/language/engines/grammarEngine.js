/** Direct port of grammar_engine.dart. Null/undefined means "not enough
 * practice data yet" — callers must render that honestly rather than a
 * fabricated weak-area claim. */
export const MIN_ATTEMPTS_FOR_GRAMMAR_INSIGHT = 5;
export const WEAK_ACCURACY_THRESHOLD = 0.7;

export function computeTopicInsight(stats, mistakes, minAttempts = MIN_ATTEMPTS_FOR_GRAMMAR_INSIGHT, weakThreshold = WEAK_ACCURACY_THRESHOLD) {
  if (stats.totalCount < minAttempts) return null;
  const accuracy = stats.totalCount === 0 ? 0 : stats.correctCount / stats.totalCount;
  if (accuracy >= weakThreshold) return null;
  const recentMistakeCount = mistakes.filter((m) => m.topicId === stats.topicId && !m.resolved).length;
  return { topicId: stats.topicId, accuracy, totalAttempts: stats.totalCount, recentMistakeCount };
}

export function computeWeakAreas(allStats, mistakes, minAttempts = MIN_ATTEMPTS_FOR_GRAMMAR_INSIGHT, weakThreshold = WEAK_ACCURACY_THRESHOLD) {
  const insights = [];
  for (const stats of Object.values(allStats)) {
    const insight = computeTopicInsight(stats, mistakes, minAttempts, weakThreshold);
    if (insight) insights.push(insight);
  }
  return insights.sort((a, b) => (a.accuracy !== b.accuracy ? a.accuracy - b.accuracy : a.topicId.localeCompare(b.topicId)));
}

export function applyCorrectReview(mistake) {
  const nextCount = mistake.reviewCorrectCount + 1;
  return { ...mistake, reviewCorrectCount: nextCount, resolved: nextCount >= 1 };
}

export function applyRepeatedMistake(existing, selectedAnswer, timestamp) {
  return { ...existing, selectedAnswer, timestamp, resolved: false, reviewCorrectCount: 0 };
}
