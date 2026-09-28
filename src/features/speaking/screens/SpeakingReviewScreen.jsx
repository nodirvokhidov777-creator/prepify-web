import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import { findSpeakingSessionById } from '../data/speakingSessionCatalog';
import { findCompletedAttemptForSession } from '../data/speakingRepository';

export default function SpeakingReviewScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = findSpeakingSessionById(sessionId);

  if (!session) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This session is no longer available.</span>
      </div>
    );
  }

  const attempt = findCompletedAttemptForSession(session.id);

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Review</h1>
      </div>
      <div style={{ height: 16 }} />

      {!attempt ? (
        <AppCard style={{ marginBottom: 16 }}>
          <span style={textStyles.bodyDim()}>No completed attempt is saved for this session yet.</span>
        </AppCard>
      ) : null}

      <div style={{ display: 'flex', gap: 10, padding: 14, background: colors.surfaceAlt, borderRadius: 14, marginBottom: 20 }}>
        <Info size={16} color={colors.textDim} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <span style={textStyles.meta()}>
          No recording or written response was captured for this session — audio recording isn't available in this
          build, so there is no response data to review. The real prompts are shown again below for reference.
        </span>
      </div>

      <AppCard>
        {session.questions.map((q, i) => (
          <div key={q.id} style={{ marginBottom: i < session.questions.length - 1 ? 20 : 0 }}>
            <h2 style={{ ...textStyles.label(), margin: '0 0 8px' }}>Question {i + 1}</h2>
            <p style={{ ...textStyles.body(), margin: 0 }}>{q.prompt}</p>
          </div>
        ))}
      </AppCard>
    </div>
  );
}
