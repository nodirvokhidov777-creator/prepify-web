import { IntelligenceThresholds } from './intelligenceThresholds';
export function detectStrengths(metrics) {
  return Object.values(metrics)
    .filter((m) => m.hasEnoughData && m.accuracy != null && m.accuracy >= IntelligenceThresholds.strengthAccuracyThreshold)
    .sort((a, b) => b.accuracy - a.accuracy)
    .map((m) => m.skill);
}
export function detectFocusAreas(metrics) {
  return Object.values(metrics)
    .filter((m) => m.hasEnoughData && m.accuracy != null && m.accuracy < IntelligenceThresholds.focusAreaAccuracyThreshold)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((m) => m.skill);
}
