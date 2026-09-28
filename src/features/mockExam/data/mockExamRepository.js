import { StorageService } from '../../../core/storage/storageService';
export function loadAllAttempts() { return StorageService.readJsonList(StorageService.keys.mockExamAttempts); }
export function findInProgressAttempt(examId) {
  return loadAllAttempts().find((a) => a.examId === examId && a.status === 'inProgress') ?? null;
}
export function findCompletedAttempts(examId) {
  return loadAllAttempts().filter((a) => a.examId === examId && a.status === 'completed');
}
export function findAttemptById(attemptId) {
  return loadAllAttempts().find((a) => a.id === attemptId) ?? null;
}
/** Upserts by id — closing the app mid-exam never silently destroys
 * progress. */
export function saveAttempt(attempt) {
  const all = loadAllAttempts();
  const idx = all.findIndex((a) => a.id === attempt.id);
  if (idx >= 0) all[idx] = attempt; else all.push(attempt);
  StorageService.writeJsonList(StorageService.keys.mockExamAttempts, all);
}
