import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, VolumeX } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import { StorageService } from '../../../core/storage/storageService';
import { useAppState } from '../../../state/AppStateContext';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { isContentAccessible, isPremiumContent } from '../../premium/contentAccess';
import { useEntitlements } from '../../premium/EntitlementContext';
import { LoadingState } from '../../../shared/components/StateViews';
import { findListeningSessionById, LISTENING_AUDIO_AVAILABLE } from '../data/listeningSessionsCatalog';
import { computeListeningResult } from '../engines/listeningResult';
import { isAnswerCorrect } from '../models/listeningModels';
import ListeningQuestionCard from '../components/ListeningQuestionCard';

export default function ListeningSessionScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { recordPracticeSession } = useAppState();
  const session = findListeningSessionById(sessionId);
  const [answers, setAnswers] = useState({});

  // Defense in depth for direct URLs: entitlement comes from the server, so
  // premium content is neither shown nor treated as unlocked until the check
  // has finished. Free content never waits on it.
  const entitlements = useEntitlements();
  const accessPending = !!session && isPremiumContent(session.id) && entitlements.loading;
  const locked = !!session && !accessPending && !isContentAccessible(session.id, entitlements);
  useEffect(() => {
    if (locked) navigate('/pro', { replace: true });
  }, [locked, navigate]);

  if (!session) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This session is no longer available.</span>
      </div>
    );
  }

  if (accessPending || locked) return <LoadingState label="Checking your access…" />;

  const answeredCount = Object.keys(answers).filter((k) => answers[k] != null && answers[k] !== '').length;

  const handleSubmit = () => {
    const computed = computeListeningResult(session, answers, new Date());
    const timestamp = computed.completedAt.toISOString();
    const attemptRecords = session.questions.map((q) => ({
      sessionId: session.id,
      questionId: q.id,
      questionType: q.type,
      correct: isAnswerCorrect(answers[q.id], q),
      answered: answers[q.id] != null && answers[q.id] !== '',
      timestamp,
    }));

    recordPracticeSession({
      skillKey: 'Listening',
      storageKey: StorageService.keys.listeningAttempts,
      attemptRecords,
      correctCount: computed.correctCount,
      totalCount: computed.totalCount,
    });

    navigate(`/practice/listening/results/${session.id}`, { state: { answers, completedAt: timestamp } });
  };

  return (
    <div style={{ padding: '12px 20px 100px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0, fontSize: 16 }}>{session.title}</h1>
      </div>
      <div style={{ height: 16 }} />

      {!LISTENING_AUDIO_AVAILABLE ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: colors.surfaceAlt, borderRadius: 14, marginBottom: 20 }}>
          <VolumeX size={18} color={colors.textDim} aria-hidden="true" />
          <span style={textStyles.meta()}>Audio playback isn't available for this session yet. You can still read the material below and answer the questions.</span>
        </div>
      ) : null}

      <nav aria-label="Question navigator" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {session.questions.map((q, i) => {
          const done = answers[q.id] != null && answers[q.id] !== '';
          return (
            <a
              key={q.id}
              href={`#question-${i}`}
              aria-label={`Jump to question ${i + 1}${done ? ', answered' : ', not answered'}`}
              style={{
                width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? colors.violetSoft : colors.surfaceAlt, border: `1px solid ${done ? colors.violet : colors.border}`,
                ...textStyles.meta(done ? colors.violet : colors.textDim),
              }}
            >
              {i + 1}
            </a>
          );
        })}
      </nav>

      <div style={{ ...textStyles.label(), marginBottom: 12 }}>
        QUESTIONS ({answeredCount} / {session.questions.length} answered)
      </div>
      <AppCard>
        {session.questions.map((q, i) => (
          <div id={`question-${i}`} key={q.id}>
            <ListeningQuestionCard question={q} index={i} userAnswer={answers[q.id]} onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))} />
          </div>
        ))}
      </AppCard>

      <div style={{ height: 20 }} />
      <AppButton label={`Submit (${answeredCount}/${session.questions.length})`} onClick={handleSubmit} disabled={answeredCount === 0} />
    </div>
  );
}
