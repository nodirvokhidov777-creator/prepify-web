export const StorageKeys = {
  profile: 'prepify.profile', progress: 'prepify.progress',
  readingAttempts: 'prepify.readingAttempts', listeningAttempts: 'prepify.listeningAttempts',
  writingAttempts: 'prepify.writingAttempts', writingResponses: 'prepify.writingResponses',
  speakingAttempts: 'prepify.speakingAttempts', vocabularyProgress: 'prepify.vocabularyProgress',
  grammarMistakes: 'prepify.grammarMistakes', grammarTopicStats: 'prepify.grammarTopicStats',
  vocabularyAttempts: 'prepify.vocabularyAttempts', grammarAttempts: 'prepify.grammarAttempts',
  writingAnalyses: 'prepify.writingAnalyses', speakingAnalyses: 'prepify.speakingAnalyses',
  mockExamAttempts: 'prepify.mockExamAttempts', goals: 'prepify.goals',
  achievements: 'prepify.unlockedAchievements', examTargetDate: 'prepify.examTargetDate',
  notificationPreferences: 'prepify.notificationPreferences', proEntitlement: 'prepify.proEntitlement',
  deviceRefId: 'prepify.deviceRefId',
};
function isStorageAvailable() {
  try { const k = '__t__'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; }
  catch { return false; }
}
const storageAvailable = isStorageAvailable();
export function readJson(key) {
  if (!storageAvailable) return null;
  try { const raw = window.localStorage.getItem(key); return raw == null ? null : JSON.parse(raw); }
  catch { return null; }
}
export function writeJson(key, value) {
  if (!storageAvailable) return false;
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function readJsonList(key) { const v = readJson(key); return Array.isArray(v) ? v : []; }
export function writeJsonList(key, list) { return writeJson(key, list); }
export function removeKey(key) {
  if (!storageAvailable) return false;
  try { window.localStorage.removeItem(key); return true; } catch { return false; }
}
export function clearAll() { Object.values(StorageKeys).forEach(removeKey); }
export const StorageService = { keys: StorageKeys, isAvailable: storageAvailable, readJson, writeJson, readJsonList, writeJsonList, removeKey, clearAll };
