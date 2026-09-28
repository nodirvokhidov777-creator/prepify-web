import { StorageService } from '../../../core/storage/storageService';
export function loadListeningAttempts() { return StorageService.readJsonList(StorageService.keys.listeningAttempts); }
export function loadAttemptedSessionIds() {
  return new Set(loadListeningAttempts().filter((a) => a.answered).map((a) => a.sessionId));
}
