import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { prepifyFullMockExam, sectionTypeLabel, sectionPracticeRoute } from '../data/mockExamContent';
import { findAttemptById } from '../data/mockExamRepository';
import { refreshCompletionStatus } from '../data/mockExamService';

export default function MockExamSectionChecklistScreen() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);

  // Re-checks real Reading/Listening/Writing/Speaking data every time
  // this screen is shown — e.g. after returning from completing a
  // section — so the checklist always reflects real, current activity.
  useEffect(() => {
    const stored = findAttemptById(attemptId);
    if (!stored) return;
    setAttempt(refreshCompletionStatus(stored, prepifyFullMockExam));
  }, [attemptId]);

  if (!attempt) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This attempt is no longer available.</span>
      </div>
    );
  }

  if (attempt.status === 'completed') {
    return (
      <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>All Sections Complete</h1>
        <div style={{ height: 20 }} />
        <AppButton label="View Results" onClick={() => navigate(`/mock-exam/results/${attempt.id}`)} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Section Checklist</h1>
      </div>
      <div style={{ height: 16 }} />

      {prepifyFullMockExam.sections.map((section) => {
        const done = attempt.completedSectionContentIds.includes(section.contentId);
        return (
          <div key={section.contentId} style={{ marginBottom: 12 }}>
            <AppCard onTap={() => navigate(sectionPracticeRoute(section))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {done ? <CheckCircle2 size={20} color={colors.emerald} aria-hidden="true" /> : <Circle size={20} color={colors.textFaint} aria-hidden="true" />}
                <div style={{ flex: 1 }}>
                  <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>{sectionTypeLabel(section.type)}</h2>
                  <div style={{ height: 2 }} />
                  <span style={textStyles.meta(done ? colors.emerald : colors.textDim)}>{done ? 'Completed' : 'Not started'}</span>
                </div>
                <ChevronRight size={18} color={colors.textFaint} />
              </div>
            </AppCard>
          </div>
        );
      })}
    </div>
  );
}
