import { estimatePracticeBand } from '../../../core/utils/practiceBandEstimator';
import { isAnswerCorrect } from '../models/listeningModels';
/** Pure, deterministic — same pattern as Reading's computeReadingResult;
 * reuses the same real PracticeBandEstimator, correctly labeled as an
 * estimate, never an official score. */
export function computeListeningResult(session, answers, completedAt = new Date()) {
  const correctCount = session.questions.filter((q) => isAnswerCorrect(answers[q.id], q)).length;
  const totalCount = session.questions.length;
  return { session, answers, correctCount, totalCount, practiceBandEstimate: estimatePracticeBand(correctCount, totalCount), completedAt };
}
