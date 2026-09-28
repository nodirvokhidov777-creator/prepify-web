import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { vocabularyCatalog } from '../data/vocabularyCatalog';
import { loadAllVocabularyProgress, progressForWord, saveVocabularyProgress } from '../data/vocabularyRepository';
import { VocabularyQuestionType, vocabularyQuestionTypeLabel } from '../models/vocabularyModels';
import { generateVocabularyQuestion, applyAnswerOutcome, sortByReviewPriority } from '../engines/vocabularyEngine';

const QUESTION_TYPES = [VocabularyQuestionType.DEFINITION_TO_WORD, VocabularyQuestionType.WORD_TO_MEANING, VocabularyQuestionType.EXAMPLE_COMPLETION];
const SESSION_SIZE = 10;

export default function VocabularyPracticeScreen() {
  const navigate = useNavigate();

  const [sessionWords] = useState(() => {
    const progressMap = loadAllVocabularyProgress();
    const withProgress = vocabularyCatalog.map((w) => ({ word: w, progress: progressMap[w.id] ?? { wordId: w.id, learningState: 'newWord', correctCount: 0, incorrectCount: 0, flaggedForReview: false } }));
    const sorted = sortByReviewPriority(withProgress.map((x) => x.progress)).map((p) => withProgress.find((x) => x.progress.wordId === p.wordId).word);
    return sorted.slice(0, SESSION_SIZE);
  });

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = useMemo(() => {
    const word = sessionWords[index];
    if (!word) return null;
    const type = QUESTION_TYPES[index % QUESTION_TYPES.length];
    return generateVocabularyQuestion(word, vocabularyCatalog, type, index);
  }, [sessionWords, index]);

  if (sessionWords.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>No words available.</span>
      </div>
    );
  }

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === question.correctAnswer;
    const current = progressForWord(question.wordId);
    saveVocabularyProgress(applyAnswerOutcome(current, isCorrect));
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    if (index + 1 >= sessionWords.length) setFinished(true);
    else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (finished) {
    return (
      <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>Session Complete</h1>
        <div style={{ height: 16 }} />
        <AppCard style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={textStyles.label()}>SCORE</div>
          <div style={{ ...textStyles.bandDisplay(), marginTop: 6 }}>
            {correctCount}/{sessionWords.length}
          </div>
        </AppCard>
        <AppButton label="Back to Vocabulary Bank" onClick={() => navigate('/practice/vocabulary/bank')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Vocabulary Practice</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 16 }}>
        <span style={textStyles.meta()}>
          Question {index + 1} of {sessionWords.length}
        </span>
      </div>

      <AppCard>
        <h2 style={{ ...textStyles.label(), margin: 0 }}>{vocabularyQuestionTypeLabel(question.type)}</h2>
        <div style={{ height: 10 }} />
        <p style={{ ...textStyles.body(), margin: 0 }}>{question.prompt}</p>
        <div style={{ height: 14 }} />
        <div role="radiogroup" aria-label="Answer options" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map((option) => {
            const isSelected = selected === option;
            const isCorrectOption = option === question.correctAnswer;
            let bg = colors.surfaceAlt, border = colors.border, fg = colors.text;
            if (selected) {
              if (isCorrectOption) { bg = colors.emeraldSoft; border = colors.emerald; fg = colors.emerald; }
              else if (isSelected) { bg = colors.errorSoft; border = colors.error; fg = colors.error; }
            }
            return (
              <button
                key={option}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleAnswer(option)}
                disabled={!!selected}
                style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: bg, border: `1.5px solid ${border}`, ...textStyles.body(fg) }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </AppCard>

      <div style={{ height: 20 }} />
      {selected ? <AppButton label={index + 1 >= sessionWords.length ? 'Finish' : 'Next Word'} onClick={handleNext} /> : null}
    </div>
  );
}
