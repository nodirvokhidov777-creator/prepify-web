import { ReadingQuestionType } from '../models/readingModels';
/** Deterministic, rule-based feedback — NOT AI. Direct port of ReadingInsightEngine. */
const WEAK_THRESHOLD = 0.6;
export function generateReadingInsight(stats) {
  const attempted = stats.filter((s) => s.total > 0);
  if (attempted.length === 0) return 'Answer a few questions to see a practice insight here.';
  const weak = attempted.filter((s) => s.accuracy < WEAK_THRESHOLD).sort((a, b) => a.accuracy - b.accuracy);
  if (weak.length === 0) return 'You showed strong reading comprehension across question types. Continue improving speed and consistency.';
  const weakest = weak[0];
  switch (weakest.type) {
    case ReadingQuestionType.TRUE_FALSE_NOT_GIVEN:
      return 'Your biggest challenge was distinguishing between information that is contradicted (FALSE) and information that is simply not mentioned (NOT GIVEN). Re-read the exact wording of each statement before deciding.';
    case ReadingQuestionType.MULTIPLE_CHOICE:
      return 'Focus on identifying distractors in Multiple Choice questions — compare every option against the passage instead of picking the first one that sounds correct.';
    default:
      return 'Keep practicing to build a clearer picture of your strengths.';
  }
}
