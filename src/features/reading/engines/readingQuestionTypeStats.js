/** Direct port of computeQuestionTypeStats in reading_question_type_stats.dart. */
export function computeQuestionTypeStats(questions, answers) {
  const byType = new Map();
  for (const q of questions) {
    if (!byType.has(q.type)) byType.set(q.type, []);
    byType.get(q.type).push(q);
  }
  return Array.from(byType.entries()).map(([type, qs]) => {
    const total = qs.length;
    const correct = qs.filter((q) => answers[q.id] === q.correctAnswer).length;
    const accuracy = total === 0 ? 0 : correct / total;
    let label = 'Not attempted';
    if (total > 0) { if (accuracy >= 0.8) label = 'Strong'; else if (accuracy >= 0.6) label = 'Solid'; else label = 'Needs Focus'; }
    return { type, correct, total, accuracy, label };
  });
}
