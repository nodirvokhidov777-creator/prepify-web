import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import { findWritingTaskById } from '../data/writingTaskCatalog';
import { findCompletedForTask } from '../data/writingRepository';

export default function WritingReviewScreen() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const task = findWritingTaskById(promptId);

  if (!task) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This prompt is no longer available.</span>
      </div>
    );
  }

  const completed = findCompletedForTask(task.id);
  const latest = completed[0];

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Review</h1>
      </div>
      <div style={{ height: 16 }} />

      {!latest ? (
        <AppCard>
          <span style={textStyles.bodyDim()}>No completed response is saved for this prompt yet.</span>
        </AppCard>
      ) : (
        <>
          <AppCard style={{ marginBottom: 16 }}>
            <span style={textStyles.label()}>PROMPT</span>
            <div style={{ height: 8 }} />
            <div style={{ ...textStyles.bodyDim(), whiteSpace: 'pre-line' }}>{task.prompt}</div>
          </AppCard>

          <AppCard style={{ marginBottom: 16 }}>
            <span style={textStyles.label()}>YOUR RESPONSE ({latest.wordCount} words)</span>
            <div style={{ height: 8 }} />
            <div style={{ ...textStyles.body(), whiteSpace: 'pre-line', lineHeight: 1.6 }}>{latest.text}</div>
          </AppCard>

          <div style={{ display: 'flex', gap: 10, padding: 14, background: colors.surfaceAlt, borderRadius: 14 }}>
            <Info size={16} color={colors.textDim} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span style={textStyles.meta()}>
              No automated feedback is available for this response — Flutter's own Writing analysis is optional and
              inactive without a configured AI provider, so none is fabricated here either.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
