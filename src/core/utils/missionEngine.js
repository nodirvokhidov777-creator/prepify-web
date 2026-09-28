import { dailyTimeToMinutes } from './bandUtils';
const DEFAULT_MISSION_SKILLS = ['Reading', 'Vocabulary', 'Grammar', 'Writing'];
export function buildMission(weakSkills, dailyMinutes) {
  const pool = weakSkills.length > 0 ? weakSkills.slice(0, 4) : DEFAULT_MISSION_SKILLS;
  const n = pool.length;
  const per = Math.min(dailyMinutes, Math.max(5, Math.round(dailyMinutes / n / 5) * 5));
  const minutes = new Array(n).fill(per);
  const diff = dailyMinutes - per * n;
  minutes[0] = Math.min(dailyMinutes, Math.max(5, minutes[0] + diff));
  return pool.map((skill, i) => ({ skill, minutes: minutes[i], id: skill }));
}
export function todayMissionFor(profile) {
  if (!profile) return [];
  const minutes = dailyTimeToMinutes[profile.dailyTime] ?? 30;
  return buildMission(profile.weakSkills ?? [], minutes);
}
