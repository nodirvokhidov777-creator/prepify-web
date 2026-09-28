/** Every threshold exists so Intelligence never claims a pattern from
 * too little data. Direct port of intelligence_thresholds.dart. */
export const IntelligenceThresholds = {
  minAttemptsForAccuracy: 10,
  minAttemptsForQuestionTypeInsight: 6,
  minResponsesForWritingMetrics: 3,
  minRecordingsForSpeakingMetrics: 3,
  minPointsPerTrendWindow: 4,
  trendWindowMs: 7 * 24 * 60 * 60 * 1000,
  trendMeaningfulDelta: 0.08,
  strengthAccuracyThreshold: 0.85,
  focusAreaAccuracyThreshold: 0.6,
  minSkillsForDnaSignal: 3,
  minDaysForConsistencyTrend: 3,
  consistencyWindowDays: 7,
};
