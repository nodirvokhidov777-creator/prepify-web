import { StorageService } from '../../../core/storage/storageService';
export function loadAllSpeakingAttempts() { return StorageService.readJsonList(StorageService.keys.speakingAttempts); }
export function saveSpeakingAttempt(attempt) {
  const all = loadAllSpeakingAttempts();
  const idx = all.findIndex((a) => a.id === attempt.id);
  if (idx >= 0) all[idx] = attempt; else all.push(attempt);
  StorageService.writeJsonList(StorageService.keys.speakingAttempts, all);
}
export function loadAttemptedSessionIds() {
  return new Set(loadAllSpeakingAttempts().filter((a) => a.status === 'completed').map((a) => a.sessionId));
}
export function findCompletedAttemptForSession(sessionId) {
  return loadAllSpeakingAttempts().filter((a) => a.sessionId === sessionId && a.status === 'completed')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0] ?? null;
}
