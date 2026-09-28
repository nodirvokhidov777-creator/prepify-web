/** Deterministic mapping from a practice score to an approximate
 * practice band — direct port of practice_band_estimator.dart. Never an
 * official IELTS score; callers must label it "Practice Estimate". */
export function estimatePracticeBand(correct, total) {
  if (total <= 0) return 0.0;
  const pct = correct / total;
  if (pct >= 0.9) return 8.5;
  if (pct >= 0.8) return 8.0;
  if (pct >= 0.7) return 7.0;
  if (pct >= 0.6) return 6.5;
  if (pct >= 0.5) return 6.0;
  if (pct >= 0.4) return 5.5;
  if (pct >= 0.25) return 5.0;
  return 4.5;
}
