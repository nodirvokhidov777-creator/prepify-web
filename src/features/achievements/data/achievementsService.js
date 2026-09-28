import { loadAllVocabularyProgress } from '../../language/data/vocabularyRepository';
import { loadGrammarTopicStats } from '../../language/data/grammarRepository';
import { loadAllAttempts as loadAllMockExamAttempts } from '../../mockExam/data/mockExamRepository';
import { VocabularyLearningState } from '../../language/models/vocabularyModels';
import { achievementCatalog } from './achievementCatalog';
import { loadAllUnlocked, unlockAchievement } from './achievementsRepository';
import { evaluateQualifyingAchievementIds } from '../engines/achievementEngine';

function buildContext({ practiceSessionsCompleted, streak }) {
  const vocabProgress = Object.values(loadAllVocabularyProgress());
  const familiarWords = vocabProgress.filter((p) => p.learningState === VocabularyLearningState.FAMILIAR).length;
  const masteredWords = vocabProgress.filter((p) => p.learningState === VocabularyLearningState.MASTERED).length;

  const grammarStats = Object.values(loadGrammarTopicStats());
  const grammarTopicsAttempted = grammarStats.filter((s) => s.totalCount > 0).length;

  const completedMockExams = loadAllMockExamAttempts().filter((a) => a.status === 'completed').length;

  return { practiceSessionsCompleted, streak, familiarWords, masteredWords, grammarTopicsAttempted, completedMockExams };
}

/** Loads real data, evaluates every achievement, persists any newly
 * qualifying unlocks, and returns the full catalog with lock status —
 * the single entry point every screen should call. Direct port of
 * AchievementsService.loadStatuses. */
export function loadAchievementStatuses({ practiceSessionsCompleted, streak }) {
  const context = buildContext({ practiceSessionsCompleted, streak });
  const qualifying = evaluateQualifyingAchievementIds(context);

  const alreadyUnlocked = loadAllUnlocked();
  const alreadyUnlockedIds = new Set(alreadyUnlocked.map((u) => u.achievementId));

  for (const id of qualifying) {
    if (!alreadyUnlockedIds.has(id)) unlockAchievement(id);
  }

  const finalUnlocked = loadAllUnlocked();
  const unlockedById = new Map(finalUnlocked.map((u) => [u.achievementId, u]));

  return achievementCatalog.map((a) => ({
    achievement: a,
    unlocked: unlockedById.has(a.id),
    unlockedAt: unlockedById.get(a.id)?.unlockedAt ?? null,
  }));
}
