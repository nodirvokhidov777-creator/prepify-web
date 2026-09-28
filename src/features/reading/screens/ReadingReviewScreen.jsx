import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findReadingPassageById } from '../data/readingPassagesCatalog';
import ReadingQuestionCard from '../components/ReadingQuestionCard';

export default function ReadingReviewScreen() {
  const { passageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const passage = findReadingPassageById(passageId);
  const answers = location.state?.answers;

  if (!passage) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This passage is no longer available.</span>
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
          <span style={textStyles.bodyDim()}>This review is no longer available — it was only kept for this session. Retake the passage to review a fresh attempt.</span>
        </AppCard>
        <div style={{ height: 16 }} />
        <AppButton label="Back to Reading" onClick={() => navigate('/practice/reading')} />
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
        {passage.questions.map((q, i) => (
          <ReadingQuestionCard key={q.id} question={q} index={i} selectedAnswer={answers[q.id]} onSelect={() => {}} revealAnswer />
        ))}
      </AppCard>
    </div>
  );
}
