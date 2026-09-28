import { loadReadingAttempts } from '../../reading/data/readingRepository';
import { loadListeningAttempts } from '../../listening/data/listeningRepository';
import { loadAllResponses } from '../../writing/data/writingRepository';
import { loadAllSpeakingAttempts } from '../../speaking/data/speakingRepository';
import { MockExamSectionType, MockExamStatus } from './mockExamContent';
import { saveAttempt } from './mockExamRepository';
import { isReadingSectionComplete, isListeningSectionComplete, findCompletedWritingResponseId, findCompletedSpeakingAttemptId } from '../engines/mockExamCompletionEngine';

/**
 * The single place that checks real Reading/Listening/Writing/Speaking
 * data to determine whether a mock exam's sections have actually been
 * completed — direct port of mock_exam_service.dart. Deliberately reads
 * only the four practice repositories, never the Intelligence layer:
 * Mock Exam must not depend on Intelligence (which isn't migrated in
 * this project yet), even though the real Flutter Results screen does
 * read Intelligence's aggregate profile.metrics for its Reading/
 * Listening display. That specific dependency is intentionally not
 * replicated here — see computeSectionResults below.
 */
export function startNewAttempt(exam) {
  const attempt = {
    id: `attempt_${exam.id}_${Date.now()}`,
    examId: exam.id,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: MockExamStatus.IN_PROGRESS,
    completedSectionContentIds: [],
    linkedResponseIds: {},
  };
  saveAttempt(attempt);
  return attempt;
}

export function refreshCompletionStatus(attempt, exam) {
  const readingAttempts = loadReadingAttempts();
  const listeningAttempts = loadListeningAttempts();
  const writingResponses = loadAllResponses();
  const speakingAttempts = loadAllSpeakingAttempts();

  const since = new Date(attempt.startedAt);
  const completed = [...attempt.completedSectionContentIds];
  const linked = { ...attempt.linkedResponseIds };

  for (const section of exam.sections) {
    if (completed.includes(section.contentId)) continue;
    if (section.type === MockExamSectionType.READING) {
      if (isReadingSectionComplete(readingAttempts, section.contentId, since)) completed.push(section.contentId);
    } else if (section.type === MockExamSectionType.LISTENING) {
      if (isListeningSectionComplete(listeningAttempts, section.contentId, since)) completed.push(section.contentId);
    } else if (section.type === MockExamSectionType.WRITING) {
      const responseId = findCompletedWritingResponseId(writingResponses, section.contentId, since);
      if (responseId) { completed.push(section.contentId); linked[section.contentId] = responseId; }
    } else if (section.type === MockExamSectionType.SPEAKING) {
      const attemptId = findCompletedSpeakingAttemptId(speakingAttempts, section.contentId, since);
      if (attemptId) { completed.push(section.contentId); linked[section.contentId] = attemptId; }
    }
  }

  const allDone = exam.sections.every((s) => completed.includes(s.contentId));
  const refreshed = {
    ...attempt,
    completedSectionContentIds: completed,
    linkedResponseIds: linked,
    status: allDone ? MockExamStatus.COMPLETED : MockExamStatus.IN_PROGRESS,
    completedAt: allDone ? (attempt.completedAt ?? new Date().toISOString()) : null,
  };
  saveAttempt(refreshed);
  return refreshed;
}

/** Real, honest per-section results computed directly from this
 * attempt's own real records — never from aggregate Intelligence
 * metrics (not migrated, and the master plan explicitly prohibits that
 * dependency), and arguably more precise for a single attempt anyway.
 * Writing and Speaking show completion only, since no real AI grading
 * exists to produce a band/fluency score. */
export function computeSectionResults(attempt, exam) {
  const readingAttempts = loadReadingAttempts();
  const listeningAttempts = loadListeningAttempts();
  const since = new Date(attempt.startedAt);

  return exam.sections.map((section) => {
    const done = attempt.completedSectionContentIds.includes(section.contentId);
    if (section.type === MockExamSectionType.READING) {
      const relevant = readingAttempts.filter((a) => a.passageId === section.contentId && new Date(a.timestamp) >= since);
      const correct = relevant.filter((a) => a.correct).length;
      return { section, done, correct, total: relevant.length, hasObjectiveScore: relevant.length > 0 };
    }
    if (section.type === MockExamSectionType.LISTENING) {
      const relevant = listeningAttempts.filter((a) => a.sessionId === section.contentId && new Date(a.timestamp) >= since);
      const correct = relevant.filter((a) => a.correct).length;
      return { section, done, correct, total: relevant.length, hasObjectiveScore: relevant.length > 0 };
    }
    return { section, done, correct: null, total: null, hasObjectiveScore: false };
  });
}
