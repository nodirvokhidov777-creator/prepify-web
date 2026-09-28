export function isoDate(d) {
  const y = String(d.getFullYear()).padStart(4, '0'), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function todayIso() { return isoDate(new Date()); }
export function isoDaysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); }
export function currentWeekDates() {
  const now = new Date(); const dow = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now); monday.setDate(now.getDate() - (dow - 1));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return isoDate(d); });
}
export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up'; if (h < 12) return 'Good morning'; if (h < 18) return 'Good afternoon'; return 'Good evening';
}
