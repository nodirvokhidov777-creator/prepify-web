import { StorageService } from '../../../core/storage/storageService';
import { applyCorrectReview, applyRepeatedMistake } from '../engines/grammarEngine';

export function loadGrammarMistakes() {
  return StorageService.readJsonList(StorageService.keys.grammarMistakes);
}
export function loadUnresolvedMistakes() {
  return loadGrammarMistakes().filter((m) => !m.resolved);
}
/** Upserts by questionId — a question missed repeatedly gets exactly one
 * row, reset to unresolved, never a flood of duplicates. */
export function recordMistake({ questionId, topicId, selectedAnswer, correctAnswer, timestamp }) {
  const all = loadGrammarMistakes();
  const now = timestamp ?? new Date().toISOString();
  const idx = all.findIndex((m) => m.questionId === questionId);
  if (idx >= 0) {
    all[idx] = applyRepeatedMistake(all[idx], selectedAnswer, now);
  } else {
    all.push({ id: `gm_${questionId}_${Date.now()}`, questionId, topicId, selectedAnswer, correctAnswer, timestamp: now, resolved: false, reviewCorrectCount: 0 });
  }
  StorageService.writeJsonList(StorageService.keys.grammarMistakes, all);
}
export function applyCorrectReviewFor(questionId) {
  const all = loadGrammarMistakes();
  const idx = all.findIndex((m) => m.questionId === questionId);
  if (idx < 0) return;
  all[idx] = applyCorrectReview(all[idx]);
  StorageService.writeJsonList(StorageService.keys.grammarMistakes, all);
}
export function loadGrammarTopicStats() {
  return StorageService.readJson(StorageService.keys.grammarTopicStats) ?? {};
}
export function recordAttempt(topicId, correct) {
  const all = loadGrammarTopicStats();
  const current = all[topicId] ?? { topicId, correctCount: 0, totalCount: 0 };
  all[topicId] = { ...current, correctCount: current.correctCount + (correct ? 1 : 0), totalCount: current.totalCount + 1 };
  StorageService.writeJson(StorageService.keys.grammarTopicStats, all);
  return all[topicId];
}
