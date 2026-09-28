import { findAchievementById } from '../achievements/data/achievementCatalog';

/** Every milestone traces back to a real timestamp already stored by an
 * existing feature — nothing invented, and a milestone is simply absent
 * if it hasn't happened yet. Direct port of journey_engine.dart. */
export function buildJourneyMilestones({ readingAttempts, listeningAttempts, writingResponses, speakingAttempts, mockExamAttempts, unlockedAchievements, completedGoals }) {
  const milestones = [];
  const earliest = (dates) => (dates.length === 0 ? null : dates.reduce((a, b) => (a < b ? a : b)));

  const firstReading = earliest(readingAttempts.map((a) => new Date(a.timestamp)));
  if (firstReading) milestones.push({ title: 'First Reading practice', timestamp: firstReading });

  const firstListening = earliest(listeningAttempts.filter((a) => a.answered).map((a) => new Date(a.timestamp)));
  if (firstListening) milestones.push({ title: 'First Listening practice', timestamp: firstListening });

  const firstWriting = earliest(writingResponses.filter((r) => r.completedAt).map((r) => new Date(r.completedAt)));
  if (firstWriting) milestones.push({ title: 'First Writing response completed', timestamp: firstWriting });

  const firstSpeaking = earliest(speakingAttempts.filter((a) => a.completedAt).map((a) => new Date(a.completedAt)));
  if (firstSpeaking) milestones.push({ title: 'First Speaking recording completed', timestamp: firstSpeaking });

  const firstMockExam = earliest(mockExamAttempts.filter((a) => a.status === 'completed' && a.completedAt).map((a) => new Date(a.completedAt)));
  if (firstMockExam) milestones.push({ title: 'First Mock Exam completed', timestamp: firstMockExam });

  for (const unlock of unlockedAchievements) {
    const achievement = findAchievementById(unlock.achievementId);
    if (achievement) milestones.push({ title: `Achievement unlocked: ${achievement.title}`, timestamp: new Date(unlock.unlockedAt) });
  }
  for (const goal of completedGoals) {
    if (goal.completedAt) milestones.push({ title: `Goal completed: ${goal.title}`, timestamp: new Date(goal.completedAt) });
  }

  milestones.sort((a, b) => a.timestamp - b.timestamp);
  return milestones;
}
