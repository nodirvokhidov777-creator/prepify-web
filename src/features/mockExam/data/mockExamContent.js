/**
 * Mock Exam models and the exam definition — points at real, existing
 * content by ID, never a duplicated copy. Direct port of
 * mock_exam_content.dart / mock_exam_models.dart.
 */
export const MockExamSectionType = { READING: 'reading', LISTENING: 'listening', WRITING: 'writing', SPEAKING: 'speaking' };
export const MockExamStatus = { NOT_STARTED: 'notStarted', IN_PROGRESS: 'inProgress', COMPLETED: 'completed' };

export const prepifyFullMockExam = {
  id: 'mock_exam_full_v1',
  title: 'PREPIFY Full Mock Exam',
  description: 'A complete simulated exam covering Reading, Listening, Writing, and Speaking — a PREPIFY practice estimate, not an official IELTS examination.',
  sections: [
    { type: MockExamSectionType.READING, contentId: 'reading_urban_beekeeping', estimatedMinutes: 20 },
    { type: MockExamSectionType.LISTENING, contentId: 'listening_university_enquiry', estimatedMinutes: 15 },
    { type: MockExamSectionType.WRITING, contentId: 'writing_essay_task2_v1', estimatedMinutes: 40 },
    { type: MockExamSectionType.SPEAKING, contentId: 'speaking_part1_v1', estimatedMinutes: 10 },
  ],
};
export const mockExamCatalog = [prepifyFullMockExam];
export function findMockExamById(id) { return mockExamCatalog.find((e) => e.id === id) ?? null; }
export function totalEstimatedMinutes(exam) { return exam.sections.reduce((sum, s) => sum + s.estimatedMinutes, 0); }

export function sectionTypeLabel(type) {
  switch (type) {
    case MockExamSectionType.READING: return 'Reading';
    case MockExamSectionType.LISTENING: return 'Listening';
    case MockExamSectionType.WRITING: return 'Writing';
    case MockExamSectionType.SPEAKING: return 'Speaking';
    default: return type;
  }
}
/** Reuses the real, existing practice screens — never a duplicate UI. */
export function sectionPracticeRoute(section) {
  switch (section.type) {
    case MockExamSectionType.READING: return `/practice/reading/session/${section.contentId}`;
    case MockExamSectionType.LISTENING: return `/practice/listening/session/${section.contentId}`;
    case MockExamSectionType.WRITING: return `/practice/writing/session/${section.contentId}`;
    case MockExamSectionType.SPEAKING: return `/practice/speaking/session/${section.contentId}`;
    default: return '/practice';
  }
}
