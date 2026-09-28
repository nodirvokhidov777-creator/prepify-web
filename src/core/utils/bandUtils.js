export const levelToBand = { Beginner: 4.5, 'Around Band 5': 5.0, 'Around Band 6': 6.0, 'Around Band 6.5': 6.5, 'Band 7+': 7.0, "I'm not sure": 5.5 };
export const dailyTimeToMinutes = { '20 minutes': 20, '30 minutes': 30, '45 minutes': 45, '1 hour': 60, '2+ hours': 120 };
export const coreSkills = ['Listening', 'Reading', 'Writing', 'Speaking'];
export function currentBandFor(level) { return levelToBand[level] ?? 5.5; }
export function targetBandFor(target) {
  if (!target) return 6.5;
  const parsed = parseFloat(String(target).replace('+', '')); return Number.isNaN(parsed) ? 6.5 : parsed;
}
