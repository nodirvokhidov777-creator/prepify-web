/** Turns real learning data into an ordered list of recommended study
 * steps — direct port of study_priority_engine.dart. Pure: same data in,
 * same order out. "Recommended for you" language, never "AI recommends"
 * — no AI is involved. Fixed priority order:
 * 1. Unresolved Grammar mistakes
 * 2. Existing focus areas
 * 3. Review-due vocabulary
 * 4. Weak Grammar topics
 * 5. Under-practiced major skills
 * 6. General practice (only if nothing else qualifies) */
export function buildStudyActions({ profile, unresolvedMistakeCount, reviewDueVocabCount, weakGrammarTopicTitles, sessionsCompleted, majorSkills = ['Reading', 'Listening', 'Writing', 'Speaking'] }) {
  const actions = [];

  if (unresolvedMistakeCount > 0) {
    actions.push({
      type: 'mistakeReview',
      skill: 'Grammar',
      label: `Review ${unresolvedMistakeCount} unresolved Grammar mistake${unresolvedMistakeCount === 1 ? '' : 's'}`,
      reason: 'These questions have not been answered correctly on retry yet.',
      estimatedMinutes: Math.min(20, Math.max(5, Math.ceil(unresolvedMistakeCount * 1.5))),
      evidence: `${unresolvedMistakeCount} unresolved mistake record(s).`,
    });
  }

  for (const skill of profile.focusAreas) {
    const metric = profile.metrics[skill];
    const accuracyPct = metric?.accuracy != null ? `${Math.round(metric.accuracy * 100)}%` : 'below your other areas';
    actions.push({
      type: 'focusArea',
      skill,
      label: `Practice ${skill}`,
      reason: `Your recent ${skill} accuracy is lower than your other areas.`,
      estimatedMinutes: 10,
      evidence: `${skill} accuracy: ${accuracyPct} over ${metric?.activityCount ?? 0} answered questions.`,
    });
  }

  if (reviewDueVocabCount > 0) {
    actions.push({
      type: 'vocabularyReview',
      skill: 'Vocabulary',
      label: `Review ${reviewDueVocabCount} word${reviewDueVocabCount === 1 ? '' : 's'}`,
      reason: 'Your vocabulary review is due.',
      estimatedMinutes: Math.min(15, Math.max(5, Math.ceil(reviewDueVocabCount * 0.6))),
      evidence: `${reviewDueVocabCount} word(s) flagged for review.`,
    });
  }

  for (const topic of weakGrammarTopicTitles) {
    actions.push({
      type: 'grammarFocus',
      skill: 'Grammar',
      label: `Grammar Focus: ${topic}`,
      reason: 'This topic has consistently lower accuracy than your overall Grammar performance.',
      estimatedMinutes: 8,
      evidence: 'Identified via recent topic-level Grammar performance.',
    });
  }

  const underPracticed = majorSkills.filter((s) => (sessionsCompleted[s] ?? 0) === 0);
  for (const skill of underPracticed) {
    actions.push({
      type: 'underPracticedSkill',
      skill,
      label: `Try a ${skill} session`,
      reason: `You have not practiced ${skill} yet.`,
      estimatedMinutes: 15,
      evidence: `No completed ${skill} sessions logged.`,
    });
  }

  if (actions.length === 0) {
    const leastPracticed = [...majorSkills].sort((a, b) => (sessionsCompleted[a] ?? 0) - (sessionsCompleted[b] ?? 0));
    const suggestion = leastPracticed[0] ?? 'Reading';
    actions.push({
      type: 'generalPractice',
      skill: suggestion,
      label: `Suggested next step: ${suggestion}`,
      reason: 'Keep your regular practice going.',
      estimatedMinutes: 10,
      evidence: 'No urgent focus areas or mistakes right now.',
    });
  }

  return actions;
}

/** Reduces an ordered StudyAction list to a deduplicated skill-key list,
 * preserving priority order — feeds real adaptive priority into the
 * existing, unchanged buildMission() rather than rewriting its logic. */
export function derivePrioritySkills(actions) {
  const seen = new Set();
  const ordered = [];
  for (const action of actions) {
    if (!seen.has(action.skill)) { seen.add(action.skill); ordered.push(action.skill); }
  }
  return ordered;
}
