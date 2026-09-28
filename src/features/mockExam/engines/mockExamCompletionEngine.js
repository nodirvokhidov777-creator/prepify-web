/** Pure functions over already-persisted attempt records — direct port
 * of mock_exam_completion_engine.dart. No new Mock-Exam-specific
 * tracking is needed; every underlying practice engine already records
 * what's necessary. */
export function isReadingSectionComplete(attempts, passageId, since) {
  return attempts.some((a) => a.passageId === passageId && new Date(a.timestamp) >= since);
}
export function isListeningSectionComplete(attempts, sessionId, since) {
  return attempts.some((a) => a.sessionId === sessionId && new Date(a.timestamp) >= since);
}
export function findCompletedWritingResponseId(responses, taskId, since) {
  const match = responses.find((r) => r.taskId === taskId && r.status === 'completed' && r.completedAt && new Date(r.completedAt) >= since);
  return match ? match.id : null;
}
export function findCompletedSpeakingAttemptId(attempts, sessionId, since) {
  const match = attempts.find((a) => a.sessionId === sessionId && a.status === 'completed' && a.completedAt && new Date(a.completedAt) >= since);
  return match ? match.id : null;
}
