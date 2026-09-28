import { loadUnresolvedMistakes, loadGrammarTopicStats, loadGrammarMistakes } from '../../language/data/grammarRepository';
import { loadAllVocabularyProgress } from '../../language/data/vocabularyRepository';
import { computeWeakAreas } from '../../language/engines/grammarEngine';
import { needsReview } from '../../language/engines/vocabularyEngine';
import { grammarTopicsCatalog } from '../../language/data/grammarCatalog';
import { buildLearningProfile } from './learningProfileEngine';
import { buildStudyActions, derivePrioritySkills } from '../engines/studyPriorityEngine';
import { buildDailyStudyPlan } from '../engines/dailyStudyPlanEngine';
import { dailyTimeToMinutes } from '../../../core/utils/bandUtils';

/** Assembles everything Today/Progress/DNA need in one call: the real
 * LearningProfile, an ordered real StudyAction list, and a real
 * time-budgeted DailyStudyPlan — all traceable to actual stored data. */
export function buildIntelligenceBundle({ progress, profile, now = new Date() }) {
  const learningProfile = buildLearningProfile(now);

  const unresolvedMistakeCount = loadUnresolvedMistakes().length;
  const reviewDueVocabCount = Object.values(loadAllVocabularyProgress()).filter(needsReview).length;

  const weakAreas = computeWeakAreas(loadGrammarTopicStats(), loadGrammarMistakes());
  const weakGrammarTopicTitles = weakAreas.map((a) => grammarTopicsCatalog.find((t) => t.id === a.topicId)?.title ?? a.topicId);

  const actions = buildStudyActions({
    profile: learningProfile,
    unresolvedMistakeCount,
    reviewDueVocabCount,
    weakGrammarTopicTitles,
    sessionsCompleted: progress.practiceSessionsCompleted ?? {},
  });

  const dailyMinutes = dailyTimeToMinutes[profile?.dailyTime] ?? 30;
  const dailyPlan = buildDailyStudyPlan(actions, dailyMinutes);
  const prioritySkills = derivePrioritySkills(actions);

  return { profile: learningProfile, actions, dailyPlan, prioritySkills };
}
