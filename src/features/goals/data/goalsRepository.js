import { StorageService } from '../../../core/storage/storageService';
export function loadAllGoals() { return StorageService.readJsonList(StorageService.keys.goals); }
export function saveGoal(goal) {
  const all = loadAllGoals();
  const idx = all.findIndex((g) => g.id === goal.id);
  if (idx >= 0) all[idx] = goal; else all.push(goal);
  StorageService.writeJsonList(StorageService.keys.goals, all);
}
export function deleteGoal(id) {
  StorageService.writeJsonList(StorageService.keys.goals, loadAllGoals().filter((g) => g.id !== id));
}
