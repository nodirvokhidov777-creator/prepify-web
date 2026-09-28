import { loadAllVocabularyProgress } from '../../language/data/vocabularyRepository';
import { loadAllAttempts as loadAllMockExamAttempts } from '../../mockExam/data/mockExamRepository';
import { loadAllGoals, saveGoal, deleteGoal as deleteGoalFromRepo } from './goalsRepository';
import { computeGoalProgress, isGoalTargetReached } from '../engines/goalProgressEngine';
import { VocabularyLearningState } from '../../language/models/vocabularyModels';

/** Assembles the real activity data goal progress is computed from —
 * direct port of GoalsService.buildContext. */
export function buildGoalContext({ practiceSessionsCompleted, streak, currentBand }) {
  const vocabProgress = Object.values(loadAllVocabularyProgress());
  const familiarOrMastered = vocabProgress.filter(
    (p) => p.learningState === VocabularyLearningState.FAMILIAR || p.learningState === VocabularyLearningState.MASTERED
  ).length;
  const completedMockExams = loadAllMockExamAttempts().filter((a) => a.status === 'completed').length;
  return { practiceSessionsCompleted, streak, familiarOrMasteredWords: familiarOrMastered, completedMockExams, currentBand };
}

/** Loads every goal and, for any not-yet-complete goal whose real
 * progress now meets its target, marks it complete and persists that —
 * the only write this makes, and only ever moving false -> true. */
export function loadAllGoalsWithFreshCompletionCheck(context) {
  const goals = loadAllGoals();
  return goals.map((g) => {
    if (!g.completed && isGoalTargetReached(g, computeGoalProgress(g, context))) {
      const completedGoal = { ...g, completed: true, completedAt: new Date().toISOString() };
      saveGoal(completedGoal);
      return completedGoal;
    }
    return g;
  });
}

export function createGoalFromTemplate(template, deadline = null) {
  const goal = {
    id: `goal_${Date.now()}`,
    title: template.title,
    type: template.type,
    targetValue: template.defaultTarget,
    createdAt: new Date().toISOString(),
    deadline,
    completed: false,
    completedAt: null,
  };
  saveGoal(goal);
  return goal;
}

export function deleteGoal(id) { deleteGoalFromRepo(id); }
