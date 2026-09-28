import { StorageService } from '../../../core/storage/storageService';
export function loadAllResponses() { return StorageService.readJsonList(StorageService.keys.writingResponses); }
export function findDraftForTask(taskId) {
  const drafts = loadAllResponses().filter((r) => r.taskId === taskId && r.status === 'draft')
    .sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt));
  return drafts[0] ?? null;
}
export function findCompletedForTask(taskId) {
  return loadAllResponses().filter((r) => r.taskId === taskId && r.status === 'completed')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}
export function saveResponse(response) {
  const all = loadAllResponses();
  const idx = all.findIndex((r) => r.id === response.id);
  if (idx >= 0) all[idx] = response; else all.push(response);
  StorageService.writeJsonList(StorageService.keys.writingResponses, all);
}
export function loadAttemptedTaskIds() {
  return new Set(loadAllResponses().filter((r) => r.status === 'completed').map((r) => r.taskId));
}
