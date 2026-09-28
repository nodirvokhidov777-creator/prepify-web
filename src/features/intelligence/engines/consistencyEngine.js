import { isoDate } from '../../../core/utils/dateUtils';
import { IntelligenceThresholds } from './intelligenceThresholds';

/** Study Pattern label — deliberately plain, activity-based language,
 * never a psychological label. */
export function studyPatternLabel(totalPracticeSessions, streak) {
  if (totalPracticeSessions < 3) return 'Needs More Data';
  if (streak >= IntelligenceThresholds.minDaysForConsistencyTrend) return 'Consistent Practice';
  return 'Building Momentum';
}

/** Pure given `now` — never shames a broken streak; always frames
 * restarting positively. Direct port of computeConsistencySummary. */
export function computeConsistencySummary(completedDates, streak, now = new Date(), windowDays = IntelligenceThresholds.consistencyWindowDays) {
  let activeDays = 0;
  for (let i = 0; i < windowDays; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    if (completedDates[isoDate(day)] === true) activeDays++;
  }

  let message;
  if (streak === 0) message = 'Ready to restart? One short session today can rebuild your momentum.';
  else if (streak === 1) message = "You're one day in — keep it going.";
  else if (activeDays >= IntelligenceThresholds.minDaysForConsistencyTrend) message = `You're on a ${streak}-day streak — steady and consistent.`;
  else message = `You're on a ${streak}-day streak.`;

  return { streak, activeDaysInWindow: activeDays, windowDays, message };
}
