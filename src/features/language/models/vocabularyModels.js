export const VocabularyLearningState = { NEW: 'newWord', LEARNING: 'learning', FAMILIAR: 'familiar', MASTERED: 'mastered' };
export function learningStateLabel(state) {
  switch (state) {
    case VocabularyLearningState.NEW: return 'New';
    case VocabularyLearningState.LEARNING: return 'Learning';
    case VocabularyLearningState.FAMILIAR: return 'Familiar';
    case VocabularyLearningState.MASTERED: return 'Mastered';
    default: return state;
  }
}
export const VocabularyQuestionType = { DEFINITION_TO_WORD: 'definitionToWord', WORD_TO_MEANING: 'wordToMeaning', EXAMPLE_COMPLETION: 'exampleCompletion' };
export function vocabularyQuestionTypeLabel(type) {
  switch (type) {
    case VocabularyQuestionType.DEFINITION_TO_WORD: return 'CHOOSE THE WORD';
    case VocabularyQuestionType.WORD_TO_MEANING: return 'CHOOSE THE MEANING';
    case VocabularyQuestionType.EXAMPLE_COMPLETION: return 'COMPLETE THE SENTENCE';
    default: return type;
  }
}
export const VocabularyFilter = { ALL: 'all', NEW: 'newWord', LEARNING: 'learning', FAMILIAR: 'familiar', MASTERED: 'mastered', NEEDS_REVIEW: 'needsReview' };
