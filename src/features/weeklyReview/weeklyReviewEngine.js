const MAJOR_SKILLS = ['Reading', 'Listening', 'Writing', 'Speaking'];

/** Pure and deterministic given the same inputs and `now`. Direct port
 * of weekly_review_engine.dart. `recommendedActions` and `strengths` are
 * real data from the Intelligence layer (buildStudyActions /
 * LearningProfile.strengths) — no AI is involved anywhere here. */
export function buildWeeklyReview({ activityByDate, streak, vocabularyProgress, grammarMistakes, recommendedActions = [], strengths = [], now = new Date() }) {
  const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const skillDayCounts = {};
  let sessionsThisWeek = 0;
  for (const entry of Object.values(activityByDate)) {
    const date = new Date(entry.isoDate);
    if (isNaN(date) || date < windowStart) continue;
    for (const skill of entry.skillsPracticed) skillDayCounts[skill] = (skillDayCounts[skill] ?? 0) + 1;
    sessionsThisWeek += entry.sessionsCount;
  }

  let strongest = null;
  const entries = Object.entries(skillDayCounts);
  if (entries.length > 0) strongest = entries.reduce((a, b) => (a[1] >= b[1] ? a : b))[0];

  const untouched = MAJOR_SKILLS.filter((s) => (skillDayCounts[s] ?? 0) === 0);
  const leastPracticed = untouched.length > 0 ? untouched[0] : null;

  const vocabularyActivityCount = vocabularyProgress.filter((p) => p.lastReviewed && new Date(p.lastReviewed) >= windowStart).length;
  const grammarActivityCount = grammarMistakes.filter((m) => new Date(m.timestamp) >= windowStart).length;

  const positiveObservation = strengths.length > 0
    ? `${strengths[0]} is a real strength based on your recent accuracy.`
    : sessionsThisWeek > 0
      ? `You completed ${sessionsThisWeek} session${sessionsThisWeek === 1 ? '' : 's'} this week — real, evidence-based progress.`
      : 'A fresh week is a good time to build some momentum.';

  const recommendedFocus = recommendedActions.length > 0 ? recommendedActions[0].label : 'Keep up your regular practice.';

  return { sessionsThisWeek, skillsPracticed: new Set(Object.keys(skillDayCounts)), strongestSkill: strongest, leastPracticedSkill: leastPracticed, vocabularyActivityCount, grammarActivityCount, currentStreak: streak, positiveObservation, recommendedFocus };
}
