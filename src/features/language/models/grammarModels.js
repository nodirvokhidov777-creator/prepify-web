export const GrammarQuestionType = { MULTIPLE_CHOICE: 'multipleChoice', FILL_GAP: 'fillGap', ERROR_DETECTION: 'errorDetection' };
export function grammarQuestionTypeLabel(type) {
  switch (type) {
    case GrammarQuestionType.MULTIPLE_CHOICE: return 'MULTIPLE CHOICE';
    case GrammarQuestionType.FILL_GAP: return 'FILL THE GAP';
    case GrammarQuestionType.ERROR_DETECTION: return 'FIND THE ERROR';
    default: return type;
  }
}
