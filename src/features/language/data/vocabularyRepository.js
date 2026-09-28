import { StorageService } from '../../../core/storage/storageService';
import { VocabularyLearningState } from '../models/vocabularyModels';

export function loadAllVocabularyProgress() {
  return StorageService.readJson(StorageService.keys.vocabularyProgress) ?? {};
}
export function progressForWord(wordId) {
  const all = loadAllVocabularyProgress();
  return all[wordId] ?? { wordId, learningState: VocabularyLearningState.NEW, correctCount: 0, incorrectCount: 0, lastReviewed: null, flaggedForReview: false };
}
export function saveVocabularyProgress(progress) {
  const all = loadAllVocabularyProgress();
  all[progress.wordId] = progress;
  StorageService.writeJson(StorageService.keys.vocabularyProgress, all);
}
