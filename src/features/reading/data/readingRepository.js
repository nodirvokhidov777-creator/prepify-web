import { StorageService } from '../../../core/storage/storageService';
export function loadReadingAttempts() { return StorageService.readJsonList(StorageService.keys.readingAttempts); }
export function loadAttemptedPassageIds() {
  return new Set(loadReadingAttempts().map((a) => a.passageId));
}
