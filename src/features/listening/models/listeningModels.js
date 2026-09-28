export const ListeningQuestionType = { MULTIPLE_CHOICE: 'multipleChoice', SHORT_ANSWER: 'shortAnswer' };
export function listeningQuestionTypeLabel(type) {
  switch (type) {
    case ListeningQuestionType.MULTIPLE_CHOICE: return 'MULTIPLE CHOICE';
    case ListeningQuestionType.SHORT_ANSWER: return 'COMPLETE THE ANSWER';
    default: return type;
  }
}
/** Trimmed, case-insensitive comparison against the correct answer or any
 * listed alternative spelling/form. */
export function isShortAnswerCorrect(userAnswer, question) {
  const normalize = (s) => (s ?? '').trim().toLowerCase();
  const given = normalize(userAnswer);
  if (!given) return false;
  const accepted = [question.correctAnswer, ...question.alternativeAnswers].map(normalize);
  return accepted.includes(given);
}
export function isAnswerCorrect(userAnswer, question) {
  if (question.type === ListeningQuestionType.SHORT_ANSWER) return isShortAnswerCorrect(userAnswer, question);
  return userAnswer === question.correctAnswer;
}
