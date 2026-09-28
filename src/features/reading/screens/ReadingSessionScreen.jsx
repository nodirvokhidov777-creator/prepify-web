import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import { StorageService } from '../../../core/storage/storageService';
import { useAppState } from '../../../state/AppStateContext';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findReadingPassageById } from '../data/readingPassagesCatalog';
import { computeReadingResult } from '../engines/readingResult';
import ReadingQuestionCard from '../components/ReadingQuestionCard';

export default function ReadingSessionScreen() {
  const { passageId } = useParams();
  const navigate = useNavigate();
  const { recordPracticeSession } = useAppState();
  const passage = findReadingPassageById(passageId);

  const [answers, setAnswers] = useState({});

  if (!passage) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This passage is no longer available.</span>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = () => {
    const computed = computeReadingResult(passage, answers, new Date());

    const timestamp = computed.completedAt.toISOString();
    const attemptRecords = passage.questions.map((q) => ({
      passageId: passage.id,
      questionType: q.type,
      correct: answers[q.id] === q.correctAnswer,
      timestamp,
    }));

    recordPracticeSession({
      skillKey: 'Reading',
      storageKey: StorageService.keys.readingAttempts,
      attemptRecords,
      correctCount: computed.correctCount,
      totalCount: computed.totalCount,
    });

    navigate(`/practice/reading/results/${passage.id}`, { state: { answers, completedAt: timestamp } });
  };

  return (
    <div style={{ padding: '12px 20px 100px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0, fontSize: 16 }}>{passage.title}</h1>
      </div>
      <div style={{ height: 16 }} />

      <AppCard style={{ marginBottom: 20 }}>
        <div style={{ whiteSpace: 'pre-line', ...textStyles.body(), lineHeight: 1.7 }}>{passage.content}</div>
      </AppCard>

      {/* Question navigator: jump to any question, with a visual mark for answered ones */}
      <nav aria-label="Question navigator" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {passage.questions.map((q, i) => {
          const done = answers[q.id] != null;
          return (
            <a
              key={q.id}
              href={`#question-${i}`}
              aria-label={`Jump to question ${i + 1}${done ? ', answered' : ', not answered'}`}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: done ? colors.violetSoft : colors.surfaceAlt,
                border: `1px solid ${done ? colors.violet : colors.border}`,
                ...textStyles.meta(done ? colors.violet : colors.textDim),
              }}
            >
              {i + 1}
            </a>
          );
        })}
      </nav>

      <div style={{ ...textStyles.label(), marginBottom: 12 }}>
        QUESTIONS ({answeredCount} / {passage.questions.length} answered)
      </div>
      <AppCard>
        {passage.questions.map((q, i) => (
          <div id={`question-${i}`} key={q.id}>
            <ReadingQuestionCard question={q} index={i} selectedAnswer={answers[q.id]} onSelect={(option) => setAnswers((prev) => ({ ...prev, [q.id]: option }))} />
          </div>
        ))}
      </AppCard>

      <div style={{ height: 20 }} />
      <AppButton label={`Submit (${answeredCount}/${passage.questions.length})`} onClick={handleSubmit} disabled={answeredCount === 0} />
    </div>
  );
}
