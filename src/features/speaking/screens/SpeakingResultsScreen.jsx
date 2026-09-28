import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findSpeakingSessionById } from '../data/speakingSessionCatalog';
import { findCompletedAttemptForSession } from '../data/speakingRepository';
import { speakingPartLabel } from '../models/speakingModels';

export default function SpeakingResultsScreen() {
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

  // Reads the real persisted attempt directly — unlike Reading/Listening's
  // full answer maps, a completed SpeakingSessionAttempt is fully
  // persisted, so this survives a page reload rather than depending on
  // transient router state.
  const attempt = findCompletedAttemptForSession(session.id);

  if (!attempt) {
    return (
      <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
            <ChevronLeft color={colors.text} />
          </button>
          <h1 style={{ ...textStyles.heading(), margin: 0 }}>Results</h1>
        </div>
        <div style={{ height: 16 }} />
        <AppCard>
          <span style={textStyles.bodyDim()}>No completed attempt is saved for this session yet.</span>
        </AppCard>
        <div style={{ height: 16 }} />
        <AppButton label="Back to Speaking" onClick={() => navigate('/practice/speaking')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>Session Complete</h1>
      <div style={{ height: 4 }} />
      <div style={textStyles.bodyDim()}>{session.title}</div>
      <div style={{ height: 20 }} />

      <AppCard style={{ marginBottom: 16 }}>
        <Row label="Part" value={speakingPartLabel(session.part)} />
        <Row label="Questions completed" value={String(attempt.totalQuestions)} />
        <Row label="Status" value="Completed" isLast />
      </AppCard>

      <div style={{ display: 'flex', gap: 10, padding: 14, background: colors.surfaceAlt, borderRadius: 14, marginBottom: 24 }}>
        <Info size={16} color={colors.textDim} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <span style={textStyles.meta()}>
          No AI speaking analysis is available yet — no fluency, pronunciation, or band score is generated. This
          only records that you practiced the session.
        </span>
      </div>

      <AppButton label="Review Session" variant="secondary" onClick={() => navigate(`/practice/speaking/review/${session.id}`)} />
      <div style={{ height: 12 }} />
      <AppButton label="Back to Speaking" onClick={() => navigate('/practice/speaking')} />
    </div>
  );
}

function Row({ label, value, isLast }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: isLast ? 'none' : `1px solid ${colors.border}` }}>
      <span style={textStyles.bodyDim()}>{label}</span>
      <span style={textStyles.cardTitle()}>{value}</span>
    </div>
  );
}
