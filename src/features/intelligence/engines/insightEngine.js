import { IntelligenceThresholds } from './intelligenceThresholds';
import { computeWeakAreas } from '../../language/engines/grammarEngine';
import { needsReview } from '../../language/engines/vocabularyEngine';

function readableType(typeName) {
  return typeName.replace(/([A-Z])/g, (m) => ` ${m.toLowerCase()}`).trim();
}

/** Compares accuracy across question types within one skill; returns
 * null unless at least 2 types have enough data AND the gap is
 * meaningful (>=20 points) — never flags noise as a real pattern. */
function questionTypeComparisonInsight(skill, attempts, now) {
  const byType = new Map();
  for (const a of attempts) {
    if (!byType.has(a.type)) byType.set(a.type, []);
    byType.get(a.type).push(a);
  }
  const eligible = [...byType.entries()].filter(([, list]) => list.length >= IntelligenceThresholds.minAttemptsForQuestionTypeInsight);
  if (eligible.length < 2) return null;

  const accuracies = eligible
    .map(([type, list]) => [type, list.filter((a) => a.correct).length / list.length])
    .sort((a, b) => a[1] - b[1]);

  const [weakestType, weakestAcc] = accuracies[0];
  const [strongestType, strongestAcc] = accuracies[accuracies.length - 1];
  if (strongestAcc - weakestAcc < 0.2) return null;

  const weakestList = byType.get(weakestType);
  const strongestList = byType.get(strongestType);
  const weakestCorrect = weakestList.filter((a) => a.correct).length;
  const strongestCorrect = strongestList.filter((a) => a.correct).length;

  return {
    id: `${skill}_question_type_${weakestType}`,
    category: skill,
    title: `Review ${readableType(weakestType)} ${skill} questions.`,
    description: `Your recent accuracy on ${readableType(weakestType)} questions is lower than your ${readableType(strongestType)} questions.`,
    priority: 'medium',
    evidence: `${weakestCorrect}/${weakestList.length} correct compared with ${strongestCorrect}/${strongestList.length} on ${readableType(strongestType)}.`,
    generatedAt: now,
  };
}

/** Builds every insight Intelligence currently supports — direct port of
 * generateInsights. Pure given the raw data passed in. */
export function generateInsights({ readingAttempts, listeningAttempts, grammarStats, grammarMistakes, vocabularyProgress, now = new Date() }) {
  const insights = [];

  const readingInsight = questionTypeComparisonInsight('Reading', readingAttempts.map((a) => ({ type: a.questionType, correct: a.correct })), now);
  if (readingInsight) insights.push(readingInsight);

  const listeningInsight = questionTypeComparisonInsight(
    'Listening',
    listeningAttempts.filter((a) => a.answered).map((a) => ({ type: a.questionType, correct: a.correct })),
    now
  );
  if (listeningInsight) insights.push(listeningInsight);

  const unresolvedMistakes = grammarMistakes.filter((m) => !m.resolved);
  if (unresolvedMistakes.length > 0) {
    insights.push({
      id: 'grammar_unresolved_mistakes',
      category: 'Grammar',
      title: 'Review your unresolved Grammar mistakes.',
      description: 'You have Grammar questions marked incorrect that have not been retried successfully yet.',
      priority: 'high',
      evidence: `${unresolvedMistakes.length} unresolved mistake record(s).`,
      generatedAt: now,
    });
  }

  const weakGrammarAreas = computeWeakAreas(grammarStats, grammarMistakes);
  for (const area of weakGrammarAreas) {
    insights.push({
      id: `grammar_weak_topic_${area.topicId}`,
      category: 'Grammar',
      title: `Focus on ${area.topicId} in Grammar.`,
      description: 'Your accuracy on this Grammar topic is consistently lower than your overall performance.',
      priority: 'medium',
      evidence: `${Math.round(area.accuracy * 100)}% accuracy over ${area.totalAttempts} attempts.`,
      generatedAt: now,
    });
  }

  const reviewDueWords = Object.values(vocabularyProgress).filter(needsReview).length;
  if (reviewDueWords > 0) {
    insights.push({
      id: 'vocabulary_review_due',
      category: 'Vocabulary',
      title: 'Your vocabulary review is due.',
      description: 'Some words you practiced recently are flagged for another look.',
      priority: 'low',
      evidence: `${reviewDueWords} word(s) currently need review.`,
      generatedAt: now,
    });
  }

  return insights;
}
