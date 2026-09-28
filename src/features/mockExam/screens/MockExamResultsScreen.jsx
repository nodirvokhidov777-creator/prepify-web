import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { prepifyFullMockExam, sectionTypeLabel } from '../data/mockExamContent';
import { findAttemptById } from '../data/mockExamRepository';
import { computeSectionResults } from '../data/mockExamService';

export default function MockExamResultsScreen() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);

  useEffect(() => {
    const attempt = findAttemptById(attemptId);
    if (attempt) setResults(computeSectionResults(attempt, prepifyFullMockExam));
  }, [attemptId]);

  if (!results) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This attempt is no longer available.</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>Mock Exam Complete</h1>
      <div style={{ height: 4 }} />
      <div style={textStyles.bodyDim()}>{prepifyFullMockExam.title}</div>
      <div style={{ height: 6 }} />
      <div style={{ background: colors.surfaceAlt, borderRadius: 12, padding: 12 }}>
        <span style={textStyles.meta()}>PREPIFY Mock Exam — a practice estimate, not an official IELTS result.</span>
      </div>
      <div style={{ height: 20 }} />

      {results.map((r) => (
        <AppCard key={r.section.contentId} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={textStyles.cardTitle()}>{sectionTypeLabel(r.section.type)}</span>
            {r.hasObjectiveScore ? (
              <span style={textStyles.cardTitle(colors.violet)}>
                {r.correct}/{r.total}
              </span>
            ) : (
              <span style={textStyles.meta(colors.emerald)}>{r.done ? 'Completed' : 'Not completed'}</span>
            )}
          </div>
          {!r.hasObjectiveScore ? (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <Info size={14} color={colors.textDim} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <span style={textStyles.meta()}>
                Completion is shown, not a{' '}
                {r.section.type === 'writing' ? 'writing quality score — real feedback requires AI analysis' : 'fluency or pronunciation score — no fake scoring is generated'}.
              </span>
            </div>
          ) : null}
        </AppCard>
      ))}

      <div style={{ height: 12 }} />
      <AppButton label="Review Attempt" variant="secondary" onClick={() => navigate(`/mock-exam/review/${attemptId}`)} />
      <div style={{ height: 12 }} />
      <AppButton label="Back to Mock Exams" onClick={() => navigate('/mock-exam')} />
    </div>
  );
}
