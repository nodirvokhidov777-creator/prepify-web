import { VocabularyLearningState, VocabularyFilter } from '../models/vocabularyModels';

const FAMILIAR_TO_MASTERED_STREAK = 2;

/** ---- Learning-state transitions (deterministic, interaction-driven) ---- */

export function applyStudied(current) {
  return current === VocabularyLearningState.NEW ? VocabularyLearningState.LEARNING : current;
}

export function applyKnowThis(current) {
  switch (current) {
    case VocabularyLearningState.NEW:
      return VocabularyLearningState.LEARNING;
    case VocabularyLearningState.LEARNING:
      return VocabularyLearningState.FAMILIAR;
    default:
      return VocabularyLearningState.MASTERED;
  }
}

export function applyPracticeAgain(current) {
  return current === VocabularyLearningState.NEW ? VocabularyLearningState.LEARNING : current;
}

export function applyCorrectAnswer(current, familiarStreak = 0) {
  switch (current) {
    case VocabularyLearningState.NEW:
      return VocabularyLearningState.LEARNING;
    case VocabularyLearningState.LEARNING:
      return VocabularyLearningState.FAMILIAR;
    case VocabularyLearningState.FAMILIAR:
      return familiarStreak + 1 >= FAMILIAR_TO_MASTERED_STREAK ? VocabularyLearningState.MASTERED : VocabularyLearningState.FAMILIAR;
    default:
      return VocabularyLearningState.MASTERED;
  }
}

/** An incorrect answer never downgrades the learning state — only the
 * incorrect count and flaggedForReview change. */
export function applyIncorrectAnswer(current) {
  return current;
}

/** Single source of truth for applying one practice answer's outcome —
 * shared logic point, mirroring applyVocabularyAnswerOutcome. */
export function applyAnswerOutcome(progress, correct) {
  const now = new Date().toISOString();
  if (correct) {
    return { ...progress, correctCount: progress.correctCount + 1, learningState: applyCorrectAnswer(progress.learningState), lastReviewed: now, flaggedForReview: false };
  }
  return { ...progress, incorrectCount: progress.incorrectCount + 1, lastReviewed: now, flaggedForReview: true };
}

/** ---- Review priority (deterministic ordering, not true spaced repetition) ---- */

export function reviewUrgencyScore(progress) {
  if (progress.learningState === VocabularyLearningState.MASTERED && !progress.flaggedForReview) return 0;
  let score = progress.incorrectCount * 3 - progress.correctCount;
  if (progress.flaggedForReview) score += 5;
  if (progress.learningState === VocabularyLearningState.NEW) score += 1;
  return score;
}

export function needsReview(progress) {
  if (progress.learningState === VocabularyLearningState.MASTERED) return progress.flaggedForReview;
  return progress.flaggedForReview || progress.incorrectCount > progress.correctCount;
}

export function sortByReviewPriority(progresses) {
  return [...progresses].sort((a, b) => {
    const diff = reviewUrgencyScore(b) - reviewUrgencyScore(a);
    return diff !== 0 ? diff : a.wordId.localeCompare(b.wordId);
  });
}

/** ---- Deterministic vocabulary question generation ---- */

function pickDistractors(target, pool, count, seed = 0) {
  const others = pool.filter((w) => w.id !== target.id).sort((a, b) => a.id.localeCompare(b.id));
  if (others.length === 0) return [];
  const picked = [];
  const usedIds = new Set();
  let i = 0;
  const maxAttempts = others.length * 2;
  while (picked.length < count && i < maxAttempts) {
    const candidate = others[(seed + i) % others.length];
    if (!usedIds.has(candidate.id)) {
      usedIds.add(candidate.id);
      picked.push(candidate);
    }
    i++;
  }
  return picked;
}

function rotate(list, by) {
  if (list.length === 0) return list;
  const n = ((by % list.length) + list.length) % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
}

function blankOutWord(sentence, word) {
  const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return sentence.replace(pattern, '_____');
}

/** Builds one question deterministically — same inputs always produce
 * the same question, matching generateVocabularyQuestion exactly. */
export function generateVocabularyQuestion(target, pool, type, seed = 0) {
  const distractors = pickDistractors(target, pool, 3, seed);
  let prompt, correctAnswer;
  const rawOptions = [];

  if (type === 'definitionToWord') {
    prompt = target.definition;
    correctAnswer = target.word;
    rawOptions.push(target.word, ...distractors.map((d) => d.word));
  } else if (type === 'wordToMeaning') {
    prompt = target.word;
    correctAnswer = target.definition;
    rawOptions.push(target.definition, ...distractors.map((d) => d.definition));
  } else {
    prompt = blankOutWord(target.exampleSentence, target.word);
    correctAnswer = target.word;
    rawOptions.push(target.word, ...distractors.map((d) => d.word));
  }

  const seen = new Set();
  const options = rawOptions.filter((o) => (seen.has(o) ? false : seen.add(o)));
  const rotated = options.length === 0 ? options : rotate(options, seed % options.length);

  return { id: `${target.id}_${type}_${seed}`, type, wordId: target.id, prompt, options: rotated, correctAnswer };
}

/** ---- Search & filtering (Vocabulary Bank) ---- */

export function searchVocabulary(words, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return words;
  return words.filter((w) => w.word.toLowerCase().includes(trimmed) || w.definition.toLowerCase().includes(trimmed) || w.tags.some((t) => t.toLowerCase().includes(trimmed)));
}

export function filterVocabularyByState(words, filter, progressByWordId) {
  const progressFor = (w) => progressByWordId[w.id] ?? { wordId: w.id, learningState: VocabularyLearningState.NEW, correctCount: 0, incorrectCount: 0, flaggedForReview: false };
  switch (filter) {
    case VocabularyFilter.ALL:
      return words;
    case VocabularyFilter.NEW:
      return words.filter((w) => progressFor(w).learningState === VocabularyLearningState.NEW);
    case VocabularyFilter.LEARNING:
      return words.filter((w) => progressFor(w).learningState === VocabularyLearningState.LEARNING);
    case VocabularyFilter.FAMILIAR:
      return words.filter((w) => progressFor(w).learningState === VocabularyLearningState.FAMILIAR);
    case VocabularyFilter.MASTERED:
      return words.filter((w) => progressFor(w).learningState === VocabularyLearningState.MASTERED);
    case VocabularyFilter.NEEDS_REVIEW:
      return words.filter((w) => needsReview(progressFor(w)));
    default:
      return words;
  }
}
