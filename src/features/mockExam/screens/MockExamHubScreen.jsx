import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileCheck } from 'lucide-react';
import { colors, heroGradient } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import { prepifyFullMockExam, totalEstimatedMinutes } from '../data/mockExamContent';
import { findInProgressAttempt, findCompletedAttempts } from '../data/mockExamRepository';

export default function MockExamHubScreen() {
  const navigate = useNavigate();
  const [inProgress, setInProgress] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    setInProgress(findInProgressAttempt(prepifyFullMockExam.id));
    setCompletedCount(findCompletedAttempts(prepifyFullMockExam.id).length);
  }, []);

  const handleTap = () => {
    if (inProgress) navigate(`/mock-exam/checklist/${inProgress.id}`);
    else navigate('/mock-exam/intro');
  };

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Mock Exams</h1>
      </div>
      <div style={{ height: 20 }} />

      <AppCard onTap={handleTap}>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: heroGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileCheck size={20} color={colors.white} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>{prepifyFullMockExam.title}</h2>
            <div style={{ height: 4 }} />
            <div style={textStyles.bodyDim()}>{prepifyFullMockExam.description}</div>
            <div style={{ height: 10 }} />
            <span style={textStyles.meta(colors.violet)}>~{totalEstimatedMinutes(prepifyFullMockExam)} minutes total</span>
            <div style={{ height: 10 }} />
            {inProgress ? (
              <StatusPill label="IN PROGRESS — tap to resume" bg={colors.amberSoft} fg={colors.amber} />
            ) : completedCount > 0 ? (
              <StatusPill label={`${completedCount} attempt${completedCount === 1 ? '' : 's'} completed`} bg={colors.emeraldSoft} fg={colors.emerald} />
            ) : (
              <StatusPill label="Not started" bg={colors.surfaceAlt} fg={colors.textDim} />
            )}
          </div>
        </div>
      </AppCard>
    </div>
  );
}

function StatusPill({ label, bg, fg }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, background: bg, ...textStyles.meta(fg) }}>
      {label}
    </span>
  );
}
