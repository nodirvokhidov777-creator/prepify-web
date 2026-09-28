import { IntelligenceThresholds } from './intelligenceThresholds';

export const TrendDirection = { IMPROVING: 'improving', STABLE: 'stable', DECLINING: 'declining', NEEDS_MORE_DATA: 'needsMoreData' };
export function trendLabel(trend) {
  switch (trend) {
    case TrendDirection.IMPROVING: return 'Improving';
    case TrendDirection.STABLE: return 'Stable';
    case TrendDirection.DECLINING: return 'Declining';
    default: return 'Needs more data';
  }
}

/** Compares a recent window of activity against the window immediately
 * before it. Pure given points and now. Direct port of computeTrend. */
export function computeTrend(points, now = new Date(), options = {}) {
  const minPerWindow = options.minPerWindow ?? IntelligenceThresholds.minPointsPerTrendWindow;
  const windowMs = options.windowMs ?? IntelligenceThresholds.trendWindowMs;
  const meaningfulDelta = options.meaningfulDelta ?? IntelligenceThresholds.trendMeaningfulDelta;

  if (points.length < minPerWindow * 2) return TrendDirection.NEEDS_MORE_DATA;
  const nowMs = now.getTime();
  const recentCutoff = nowMs - windowMs;
  const previousCutoff = nowMs - windowMs * 2;

  const recent = points.filter((p) => p.timestamp.getTime() > recentCutoff);
  const previous = points.filter((p) => p.timestamp.getTime() > previousCutoff && p.timestamp.getTime() <= recentCutoff);
  if (recent.length < minPerWindow || previous.length < minPerWindow) return TrendDirection.NEEDS_MORE_DATA;

  const recentAccuracy = recent.filter((p) => p.correct).length / recent.length;
  const previousAccuracy = previous.filter((p) => p.correct).length / previous.length;
  const delta = recentAccuracy - previousAccuracy;

  if (delta >= meaningfulDelta) return TrendDirection.IMPROVING;
  if (delta <= -meaningfulDelta) return TrendDirection.DECLINING;
  return TrendDirection.STABLE;
}
