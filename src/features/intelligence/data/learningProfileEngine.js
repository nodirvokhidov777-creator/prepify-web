import { loadReadingAttempts } from '../../reading/data/readingRepository';
import { loadListeningAttempts } from '../../listening/data/listeningRepository';
import { loadAllResponses } from '../../writing/data/writingRepository';
import { loadAllSpeakingAttempts } from '../../speaking/data/speakingRepository';
import { loadAllVocabularyProgress } from '../../language/data/vocabularyRepository';
import { loadGrammarTopicStats, loadGrammarMistakes } from '../../language/data/grammarRepository';
import { StorageService } from '../../../core/storage/storageService';
import { computeReadingMetrics, computeListeningMetrics, computeWritingMetrics, computeSpeakingMetrics, computeVocabularyMetrics, computeGrammarMetrics } from '../engines/skillMetricsEngine';
import { detectStrengths, detectFocusAreas } from '../engines/strengthsFocusEngine';
import { generateInsights } from '../engines/insightEngine';

/**
 * Builds the unified LearningProfile from every feature's real stored
 * data — direct port of learning_profile_engine.dart's
 * buildLearningProfile. Reads only the six practice repositories, never
 * Mock Exam data (the real Flutter function doesn't accept it either) —
 * preserving the required one-way boundary: Mock Exam never becomes a
 * dependency of Intelligence.
 *
 * This is a computed view, not persisted — generated fresh every time
 * it's needed, matching the real Flutter architecture exactly.
 */
export function buildLearningProfile(now = new Date()) {
  const readingAttempts = loadReadingAttempts();
  const listeningAttempts = loadListeningAttempts();
  const writingResponses = loadAllResponses();
  const speakingAttempts = loadAllSpeakingAttempts();
  const vocabularyProgress = loadAllVocabularyProgress();
  const grammarStats = loadGrammarTopicStats();
  const grammarMistakes = loadGrammarMistakes();
  const progress = StorageService.readJson(StorageService.keys.progress) ?? {};
  const practiceSessionsCompleted = progress.practiceSessionsCompleted ?? {};

  const metrics = {
    Reading: computeReadingMetrics(readingAttempts, now),
    Listening: computeListeningMetrics(listeningAttempts, now),
    Writing: computeWritingMetrics(writingResponses),
    Speaking: computeSpeakingMetrics(speakingAttempts),
    Vocabulary: computeVocabularyMetrics(vocabularyProgress),
    Grammar: computeGrammarMetrics(grammarStats),
  };

  const strengths = detectStrengths(metrics);
  const focusAreas = detectFocusAreas(metrics);
  const insights = generateInsights({ readingAttempts, listeningAttempts, grammarStats, grammarMistakes, vocabularyProgress, now });
  const totalPracticeSessions = Object.values(practiceSessionsCompleted).reduce((a, b) => a + b, 0);

  return { generatedAt: now, totalPracticeSessions, metrics, strengths, focusAreas, insights };
}
