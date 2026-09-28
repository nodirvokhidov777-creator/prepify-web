import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findReadingPassageById } from '../data/readingPassagesCatalog';
import { computeReadingResult } from '../engines/readingResult';

export default function ReadingResultsScreen() {
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

  // Router state (the answers just submitted) is only available right
  // after Submit — a hard refresh on this URL loses it, matching the
  // real Flutter app's own behavior of passing the in-memory
  // ReadingResult forward rather than persisting per-question answers.
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
          <span style={textStyles.bodyDim()}>
            This result is no longer available to view directly — it was only kept for this session. Your
            completion was still recorded. Retake the passage to see a fresh result.
          </span>
        </AppCard>
        <div style={{ height: 16 }} />
        <AppButton label="Back to Reading" onClick={() => navigate('/practice/reading')} />
      </div>
    );
  }

  const result = computeReadingResult(passage, answers, new Date(location.state.completedAt));

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>Results</h1>
      <div style={{ height: 4 }} />
      <div style={textStyles.bodyDim()}>{passage.title}</div>
      <div style={{ height: 20 }} />

      <AppCard style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={textStyles.label()}>SCORE</div>
        <div style={{ ...textStyles.bandDisplay(), marginTop: 6 }}>
          {result.correctCount}/{result.totalCount}
        </div>
        <div style={{ height: 10 }} />
        <div style={textStyles.meta()}>Practice Estimate: Band {result.practiceBandEstimate.toFixed(1)} (not an official IELTS score)</div>
      </AppCard>

      <div style={{ ...textStyles.label(), marginBottom: 10 }}>BY QUESTION TYPE</div>
      <AppCard style={{ marginBottom: 16 }}>
        {result.typeStats.map((s) => (
          <div key={s.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={textStyles.bodyDim()}>{s.type === 'trueFalseNotGiven' ? 'True/False/Not Given' : 'Multiple Choice'}</span>
            <span style={textStyles.cardTitle()}>
              {s.correct}/{s.total} · {s.label}
            </span>
          </div>
        ))}
      </AppCard>

      <div style={{ ...textStyles.label(), marginBottom: 10 }}>INSIGHT</div>
      <AppCard style={{ marginBottom: 24 }}>
        <span style={textStyles.body()}>{result.insight}</span>
      </AppCard>

      <AppButton
        label="Review Answers"
        variant="secondary"
        onClick={() => navigate(`/practice/reading/review/${passage.id}`, { state: { answers } })}
      />
      <div style={{ height: 12 }} />
      <AppButton label="Back to Reading" onClick={() => navigate('/practice/reading')} />
    </div>
  );
}
