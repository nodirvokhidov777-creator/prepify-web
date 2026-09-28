import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findListeningSessionById } from '../data/listeningSessionsCatalog';
import ListeningQuestionCard from '../components/ListeningQuestionCard';

export default function ListeningReviewScreen() {
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
          <h1 style={{ ...textStyles.heading(), margin: 0 }}>Review</h1>
        </div>
        <div style={{ height: 16 }} />
        <AppCard>
          <span style={textStyles.bodyDim()}>This review is no longer available — it was only kept for this session. Retake the session to review a fresh attempt.</span>
        </AppCard>
        <div style={{ height: 16 }} />
        <AppButton label="Back to Listening" onClick={() => navigate('/practice/listening')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Review</h1>
      </div>
      <div style={{ height: 16 }} />
      <AppCard>
        {session.questions.map((q, i) => (
          <ListeningQuestionCard key={q.id} question={q} index={i} userAnswer={answers[q.id]} onChange={() => {}} revealAnswer />
        ))}
      </AppCard>
    </div>
  );
}
