/** 19 achievements — migrated verbatim from achievement_catalog.dart. */
export const AchievementCategory = { PRACTICE: 'practice', CONSISTENCY: 'consistency', SKILLS: 'skills', VOCABULARY: 'vocabulary', GRAMMAR: 'grammar', MOCK_EXAM: 'mockExam' };

export const achievementCatalog = [
  { id: 'first_practice', title: 'First Practice', description: 'Complete your first practice session.', category: AchievementCategory.PRACTICE },
  { id: 'practice_10', title: '10 Practice Sessions', description: 'Complete 10 practice sessions.', category: AchievementCategory.PRACTICE },
  { id: 'practice_50', title: '50 Practice Sessions', description: 'Complete 50 practice sessions.', category: AchievementCategory.PRACTICE },
  { id: 'practice_100', title: '100 Practice Sessions', description: 'Complete 100 practice sessions.', category: AchievementCategory.PRACTICE },

  { id: 'streak_3', title: '3 Day Streak', description: 'Study three days in a row.', category: AchievementCategory.CONSISTENCY },
  { id: 'streak_7', title: '7 Day Streak', description: 'Study seven days in a row.', category: AchievementCategory.CONSISTENCY },
  { id: 'streak_30', title: '30 Day Streak', description: 'Study thirty days in a row.', category: AchievementCategory.CONSISTENCY },

  { id: 'reading_explorer', title: 'Reading Explorer', description: 'Complete your first Reading session.', category: AchievementCategory.SKILLS },
  { id: 'listening_explorer', title: 'Listening Explorer', description: 'Complete your first Listening session.', category: AchievementCategory.SKILLS },
  { id: 'writing_builder', title: 'Writing Builder', description: 'Complete your first Writing session.', category: AchievementCategory.SKILLS },
  { id: 'speaking_starter', title: 'Speaking Starter', description: 'Complete your first Speaking session.', category: AchievementCategory.SKILLS },

  { id: 'familiar_10', title: 'First 10 Familiar Words', description: 'Reach Familiar on 10 words.', category: AchievementCategory.VOCABULARY },
  { id: 'familiar_25', title: '25 Familiar Words', description: 'Reach Familiar on 25 words.', category: AchievementCategory.VOCABULARY },
  { id: 'mastered_10', title: '10 Mastered Words', description: 'Reach Mastered on 10 words.', category: AchievementCategory.VOCABULARY },
  { id: 'mastered_25', title: '25 Mastered Words', description: 'Reach Mastered on 25 words.', category: AchievementCategory.VOCABULARY },

  { id: 'grammar_topic_1', title: 'First Grammar Topic Completed', description: 'Practice your first Grammar topic.', category: AchievementCategory.GRAMMAR },
  { id: 'grammar_topic_multiple', title: 'Multiple Grammar Topics Completed', description: 'Practice three or more Grammar topics.', category: AchievementCategory.GRAMMAR },

  { id: 'mock_exam_1', title: 'First Mock Exam', description: 'Complete your first full Mock Exam.', category: AchievementCategory.MOCK_EXAM },
  { id: 'mock_exam_multiple', title: 'Multiple Mock Exams', description: 'Complete two or more full Mock Exams.', category: AchievementCategory.MOCK_EXAM },
];

export function findAchievementById(id) { return achievementCatalog.find((a) => a.id === id) ?? null; }
