import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findWritingTaskById } from '../data/writingTaskCatalog';
import { writingTaskBadge } from '../models/writingModels';

export default function WritingResultsScreen() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const task = findWritingTaskById(promptId);

  if (!task) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This prompt is no longer available.</span>
      </div>
    );
  }

  const wordCount = location.state?.wordCount;

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Response Saved</h1>
      </div>
      <div style={{ height: 16 }} />

      <AppCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={textStyles.bodyDim()}>Task</span>
          <span style={textStyles.cardTitle()}>{writingTaskBadge(task.taskType)}</span>
        </div>
        {wordCount != null ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={textStyles.bodyDim()}>Word count</span>
            <span style={textStyles.cardTitle()}>{wordCount}</span>
          </div>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={textStyles.bodyDim()}>Minimum required</span>
          <span style={textStyles.cardTitle()}>{task.minimumWordCount}</span>
        </div>
      </AppCard>

      <div style={{ display: 'flex', gap: 10, padding: 14, background: colors.surfaceAlt, borderRadius: 14, marginBottom: 24 }}>
        <Info size={16} color={colors.textDim} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <span style={textStyles.meta()}>
          No AI grading is available yet — this saves your response honestly, without a fabricated band score or
          feedback. Automated feedback will be added only when a real analysis system is integrated.
        </span>
      </div>

      <AppButton label="Review Response" variant="secondary" onClick={() => navigate(`/practice/writing/review/${task.id}`)} />
      <div style={{ height: 12 }} />
      <AppButton label="Back to Writing" onClick={() => navigate('/practice/writing')} />
    </div>
  );
}
