import { StorageService } from '../../../core/storage/storageService';
export function loadAllUnlocked() { return StorageService.readJsonList(StorageService.keys.achievements); }
/** Appends a new unlock — never duplicates an achievementId. */
export function unlockAchievement(achievementId) {
  const all = loadAllUnlocked();
  if (all.some((u) => u.achievementId === achievementId)) return;
  all.push({ achievementId, unlockedAt: new Date().toISOString() });
  StorageService.writeJsonList(StorageService.keys.achievements, all);
}
