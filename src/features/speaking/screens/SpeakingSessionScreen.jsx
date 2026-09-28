import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MicOff } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { isContentAccessible } from '../../premium/contentAccess';
import { loadEntitlements } from '../../premium/premiumRegistry';
import { findSpeakingSessionById } from '../data/speakingSessionCatalog';
import { saveSpeakingAttempt } from '../data/speakingRepository';
import { speakingPartLabel, speakingPartAccent } from '../models/speakingModels';

export default function SpeakingSessionScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = findSpeakingSessionById(sessionId);

  const [index, setIndex] = useState(0);
  const [startedAt] = useState(() => new Date());

  useEffect(() => {
    if (session && !isContentAccessible(session.id, loadEntitlements())) {
      navigate('/pro', { replace: true });
    }
  }, [session, navigate]);

  if (!session) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This session is no longer available.</span>
      </div>
    );
  }

  const accent = speakingPartAccent(session.part);
  const question = session.questions[index];
  const isLast = index === session.questions.length - 1;

  const handleNext = () => {
    if (isLast) {
      const now = new Date();
      const attemptId = `speaking_${session.id}_${startedAt.getTime()}`;
      saveSpeakingAttempt({
        id: attemptId,
        sessionId: session.id,
        sessionTitle: session.title,
        part: session.part,
        totalQuestions: session.questions.length,
        startedAt: startedAt.toISOString(),
        completedAt: now.toISOString(),
        status: 'completed',
      });
      navigate(`/practice/speaking/results/${session.id}`, { state: { attemptId } });
    } else {
      setIndex((i) => i + 1);
    }
  };

  const speakLabel = question.speakingSeconds >= 60 ? `${Math.round(question.speakingSeconds / 60)} min` : `${question.speakingSeconds}s`;

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0, fontSize: 16 }}>{session.title}</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 16 }}>
        <span style={textStyles.meta(accent)}>
          {speakingPartLabel(session.part)} · Question {index + 1} of {session.questions.length}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: colors.surfaceAlt, borderRadius: 14, marginBottom: 20 }}>
        <MicOff size={18} color={colors.textDim} aria-hidden="true" />
        <span style={textStyles.meta()}>Audio recording isn't available in this build yet. Practice by speaking your answer aloud, then continue.</span>
      </div>

      <AppCard style={{ marginBottom: 20 }}>
        <p style={{ ...textStyles.body(), margin: 0 }}>{question.prompt}</p>
        {question.hints.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <h2 style={{ ...textStyles.label(), margin: '0 0 8px' }}>YOU SHOULD SAY:</h2>
            {question.hints.map((h) => (
              <div key={h} style={{ ...textStyles.bodyDim(), marginBottom: 4 }}>
                • {h}
              </div>
            ))}
            {question.followUp ? <div style={{ ...textStyles.bodyDim(), marginTop: 8 }}>{question.followUp}</div> : null}
          </div>
        ) : null}
        <div style={{ height: 14 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          {question.preparationMinutes > 0 ? <span style={textStyles.meta()}>Prep: {question.preparationMinutes} min</span> : null}
          <span style={textStyles.meta()}>Speak: ~{speakLabel}</span>
        </div>
      </AppCard>

      <AppButton label={isLast ? 'Finish Session' : 'Next Question'} onClick={handleNext} />
    </div>
  );
}
