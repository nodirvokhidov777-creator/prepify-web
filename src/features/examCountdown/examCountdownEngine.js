import { StorageService } from '../../core/storage/storageService';

/** Days remaining until examDate, or null if no date is set. Pure given
 * `now`. Direct port of exam_countdown_engine.dart. */
export function daysUntilExam(examDate, now = new Date()) {
  if (!examDate) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}
/** Calm, non-alarming copy for every state — never urgency/stress
 * language even when the exam is very close or has passed. */
export function examCountdownMessage(daysRemaining) {
  if (daysRemaining == null) return 'Set your exam date to personalize your study plan.';
  if (daysRemaining < 0) return 'Your exam date has passed. Update it to keep your plan current.';
  if (daysRemaining === 0) return "Exam day — you've got this.";
  if (daysRemaining === 1) return '1 day remaining.';
  return `${daysRemaining} days remaining.`;
}
/** Onboarding's profile.examDate is a categorical bucket ("1–3 months"),
 * not an actual date — this stores a genuine optional Date the student
 * can set for a real countdown. */
export function loadExamDate() {
  const json = StorageService.readJson(StorageService.keys.examTargetDate);
  const raw = json?.examDate;
  return raw ? new Date(raw) : null;
}
export function setExamDate(date) { StorageService.writeJson(StorageService.keys.examTargetDate, { examDate: date.toISOString() }); }
export function clearExamDate() { StorageService.writeJson(StorageService.keys.examTargetDate, { examDate: null }); }
