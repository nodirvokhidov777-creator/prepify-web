import { IntelligenceThresholds } from './intelligenceThresholds';
import { computeTrend, TrendDirection } from './trendEngine';

export function computeReadingMetrics(attempts, now = new Date()) {
  const activityCount = attempts.length;
  const hasEnoughData = activityCount >= IntelligenceThresholds.minAttemptsForAccuracy;
  const correct = attempts.filter((a) => a.correct).length;
  const points = attempts.map((a) => ({ timestamp: new Date(a.timestamp), correct: a.correct }));
  return { skill: 'Reading', activityCount, accuracy: hasEnoughData && activityCount > 0 ? correct / activityCount : null, completionRate: null, averageWordCount: null, averageDurationSeconds: null, hasEnoughData, trend: computeTrend(points, now) };
}
export function computeListeningMetrics(attempts, now = new Date()) {
  const answered = attempts.filter((a) => a.answered);
  const activityCount = answered.length;
  const hasEnoughData = activityCount >= IntelligenceThresholds.minAttemptsForAccuracy;
  const correct = answered.filter((a) => a.correct).length;
  const points = answered.map((a) => ({ timestamp: new Date(a.timestamp), correct: a.correct }));
  return { skill: 'Listening', activityCount, accuracy: hasEnoughData && activityCount > 0 ? correct / activityCount : null, completionRate: null, averageWordCount: null, averageDurationSeconds: null, hasEnoughData, trend: computeTrend(points, now) };
}
export function computeWritingMetrics(responses) {
  const completed = responses.filter((r) => r.status === 'completed');
  const activityCount = completed.length;
  const hasEnoughData = activityCount >= IntelligenceThresholds.minResponsesForWritingMetrics;
  let averageWordCount = null, averageDurationSeconds = null;
  if (hasEnoughData) {
    averageWordCount = completed.reduce((s, r) => s + r.wordCount, 0) / completed.length;
    averageDurationSeconds = Math.round(completed.reduce((s, r) => s + (r.timeSpentSeconds ?? 0), 0) / completed.length);
  }
  return { skill: 'Writing', activityCount, accuracy: null, completionRate: responses.length === 0 ? null : completed.length / responses.length, averageWordCount, averageDurationSeconds, hasEnoughData, trend: TrendDirection.NEEDS_MORE_DATA };
}
export function computeSpeakingMetrics(attempts) {
  const completed = attempts.filter((a) => a.status === 'completed');
  const activityCount = completed.length;
  const hasEnoughData = activityCount >= IntelligenceThresholds.minRecordingsForSpeakingMetrics;
  let averageDurationSeconds = null;
  if (hasEnoughData) {
    const totalSeconds = completed.reduce((s, a) => {
      const started = new Date(a.startedAt).getTime();
      const ended = a.completedAt ? new Date(a.completedAt).getTime() : started;
      return s + Math.max(0, (ended - started) / 1000);
    }, 0);
    averageDurationSeconds = Math.round(totalSeconds / completed.length);
  }
  return { skill: 'Speaking', activityCount, accuracy: null, completionRate: attempts.length === 0 ? null : completed.length / attempts.length, averageWordCount: null, averageDurationSeconds, hasEnoughData, trend: TrendDirection.NEEDS_MORE_DATA };
}
export function computeVocabularyMetrics(progressMap) {
  const values = Object.values(progressMap);
  const totalAttempts = values.reduce((s, p) => s + p.correctCount + p.incorrectCount, 0);
  const totalCorrect = values.reduce((s, p) => s + p.correctCount, 0);
  const hasEnoughData = totalAttempts >= IntelligenceThresholds.minAttemptsForAccuracy;
  return { skill: 'Vocabulary', activityCount: totalAttempts, accuracy: hasEnoughData && totalAttempts > 0 ? totalCorrect / totalAttempts : null, completionRate: null, averageWordCount: null, averageDurationSeconds: null, hasEnoughData, trend: TrendDirection.NEEDS_MORE_DATA };
}
export function computeGrammarMetrics(statsMap) {
  const values = Object.values(statsMap);
  const totalAttempts = values.reduce((s, v) => s + v.totalCount, 0);
  const totalCorrect = values.reduce((s, v) => s + v.correctCount, 0);
  const hasEnoughData = totalAttempts >= IntelligenceThresholds.minAttemptsForAccuracy;
  return { skill: 'Grammar', activityCount: totalAttempts, accuracy: hasEnoughData && totalAttempts > 0 ? totalCorrect / totalAttempts : null, completionRate: null, averageWordCount: null, averageDurationSeconds: null, hasEnoughData, trend: TrendDirection.NEEDS_MORE_DATA };
}
