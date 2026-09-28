export const GoalType = {
  READING_SESSIONS: 'readingSessions', LISTENING_SESSIONS: 'listeningSessions', WRITING_SESSIONS: 'writingSessions',
  SPEAKING_SESSIONS: 'speakingSessions', TOTAL_SESSIONS: 'totalSessions', STREAK_DAYS: 'streakDays',
  VOCABULARY_WORDS: 'vocabularyWords', MOCK_EXAMS: 'mockExams', TARGET_BAND: 'targetBand',
};
/** One representative template per goal type — direct port of
 * goal_templates.dart. Picking one keeps goal creation a quick, safe
 * choice rather than a free-form form that could produce an
 * unmeasurable goal. */
export const goalTemplates = [
  { title: 'Reach IELTS Band 7', type: GoalType.TARGET_BAND, defaultTarget: 7.0, unit: 'band' },
  { title: 'Complete 20 Reading sessions', type: GoalType.READING_SESSIONS, defaultTarget: 20, unit: 'sessions' },
  { title: 'Complete 20 Listening sessions', type: GoalType.LISTENING_SESSIONS, defaultTarget: 20, unit: 'sessions' },
  { title: 'Practice Writing 10 times', type: GoalType.WRITING_SESSIONS, defaultTarget: 10, unit: 'sessions' },
  { title: 'Practice Speaking 10 times', type: GoalType.SPEAKING_SESSIONS, defaultTarget: 10, unit: 'sessions' },
  { title: 'Complete 50 practice sessions', type: GoalType.TOTAL_SESSIONS, defaultTarget: 50, unit: 'sessions' },
  { title: 'Maintain a 7-day study streak', type: GoalType.STREAK_DAYS, defaultTarget: 7, unit: 'days' },
  { title: 'Learn 25 vocabulary words', type: GoalType.VOCABULARY_WORDS, defaultTarget: 25, unit: 'words' },
  { title: 'Complete 2 mock exams', type: GoalType.MOCK_EXAMS, defaultTarget: 2, unit: 'exams' },
];
