import { IntelligenceThresholds } from './intelligenceThresholds';

/** Real measured accuracy on a 0-9 scale, purely for polygon geometry —
 * never an invented or self-reported level. Returns null when fewer
 * than minSkillsForDnaSignal skills have enough real data, signaling
 * the caller to show a neutral incomplete state instead of a
 * misleading thin polygon. Direct port of buildDnaSignal. */
export function buildDnaSignal(metrics) {
  const eligible = Object.values(metrics)
    .filter((m) => m.hasEnoughData && m.accuracy != null)
    .sort((a, b) => a.skill.localeCompare(b.skill));
  if (eligible.length < IntelligenceThresholds.minSkillsForDnaSignal) return null;
  return eligible.map((m) => ({ skill: m.skill, score: Math.min(9.0, Math.max(0.5, m.accuracy * 9.0)) }));
}
