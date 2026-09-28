/** One calendar day's real activity, aggregated from actual timestamped
 * records — never fabricated. Direct port of calendar_engine.dart. */
function dateKey(d) {
  const y = String(d.getFullYear()).padStart(4, '0'), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
/** Builds one summary per day that has any real signal — either a
 * completed daily mission or at least one real completion event. */
export function buildActivityCalendar({ completedDates, readingAttempts, listeningAttempts, writingResponses, speakingAttempts }) {
  const skillsByDate = new Map();
  const addSkill = (isoDate, skill) => {
    if (!skillsByDate.has(isoDate)) skillsByDate.set(isoDate, new Set());
    skillsByDate.get(isoDate).add(skill);
  };
  for (const a of readingAttempts) addSkill(dateKey(new Date(a.timestamp)), 'Reading');
  for (const a of listeningAttempts) if (a.answered) addSkill(dateKey(new Date(a.timestamp)), 'Listening');
  for (const r of writingResponses) if (r.completedAt) addSkill(dateKey(new Date(r.completedAt)), 'Writing');
  for (const a of speakingAttempts) if (a.completedAt) addSkill(dateKey(new Date(a.completedAt)), 'Speaking');

  const allDates = new Set([...Object.keys(completedDates), ...skillsByDate.keys()]);
  const result = {};
  for (const date of allDates) {
    const skillsPracticed = skillsByDate.get(date) ?? new Set();
    result[date] = { isoDate: date, missionCompleted: completedDates[date] === true, skillsPracticed, sessionsCount: skillsPracticed.size };
  }
  return result;
}
