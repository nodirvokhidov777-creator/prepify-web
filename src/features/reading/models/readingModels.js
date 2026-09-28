export const ReadingQuestionType = { TRUE_FALSE_NOT_GIVEN: 'trueFalseNotGiven', MULTIPLE_CHOICE: 'multipleChoice' };
export function readingQuestionTypeLabel(type) {
  switch (type) {
    case ReadingQuestionType.TRUE_FALSE_NOT_GIVEN: return 'TRUE / FALSE / NOT GIVEN';
    case ReadingQuestionType.MULTIPLE_CHOICE: return 'MULTIPLE CHOICE';
    default: return type;
  }
}
