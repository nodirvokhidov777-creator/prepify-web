import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findListeningSessionById } from '../data/listeningSessionsCatalog';
import { computeListeningResult } from '../engines/listeningResult';

export default function ListeningResultsScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const session = findListeningSessionById(sessionId);
  const answers = location.state?.answers;

  if (!session) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This session is no longer available.</span>
      </div>
    );
  }

  if (!answers) {
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
          <span style={textStyles.bodyDim()}>This result is no longer available to view directly — it was only kept for this session. Your completion was still recorded. Retake the session to see a fresh result.</span>
        </AppCard>
        <div style={{ height: 16 }} />
        <AppButton label="Back to Listening" onClick={() => navigate('/practice/listening')} />
      </div>
    );
  }

  const result = computeListeningResult(session, answers, new Date(location.state.completedAt));

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>Results</h1>
      <div style={{ height: 4 }} />
      <div style={textStyles.bodyDim()}>{session.title}</div>
      <div style={{ height: 20 }} />
      <AppCard style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={textStyles.label()}>SCORE</div>
        <div style={{ ...textStyles.bandDisplay(), marginTop: 6 }}>
          {result.correctCount}/{result.totalCount}
        </div>
        <div style={{ height: 10 }} />
        <div style={textStyles.meta()}>Practice Estimate: Band {result.practiceBandEstimate.toFixed(1)} (not an official IELTS score)</div>
      </AppCard>
      <AppButton label="Review Answers" variant="secondary" onClick={() => navigate(`/practice/listening/review/${session.id}`, { state: { answers } })} />
      <div style={{ height: 12 }} />
      <AppButton label="Back to Listening" onClick={() => navigate('/practice/listening')} />
    </div>
  );
}
