import { estimatePracticeBand } from '../../../core/utils/practiceBandEstimator';
import { computeQuestionTypeStats } from './readingQuestionTypeStats';
import { generateReadingInsight } from './readingInsightEngine';
/** Direct port of ReadingResult.compute — pure, deterministic, no I/O. */
export function computeReadingResult(passage, answers, completedAt = new Date()) {
  const correctCount = passage.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const totalCount = passage.questions.length;
  const typeStats = computeQuestionTypeStats(passage.questions, answers);
  return { passage, answers, correctCount, totalCount, practiceBandEstimate: estimatePracticeBand(correctCount, totalCount), typeStats, insight: generateReadingInsight(typeStats), completedAt };
}
