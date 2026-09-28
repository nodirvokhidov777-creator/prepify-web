import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { prepifyFullMockExam, sectionTypeLabel, totalEstimatedMinutes } from '../data/mockExamContent';
import { startNewAttempt } from '../data/mockExamService';

export default function MockExamIntroScreen() {
  const navigate = useNavigate();

  const handleStart = () => {
    const attempt = startNewAttempt(prepifyFullMockExam);
    navigate(`/mock-exam/checklist/${attempt.id}`, { replace: true });
  };

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>{prepifyFullMockExam.title}</h1>
      </div>
      <div style={{ height: 16 }} />

      <AppCard style={{ marginBottom: 16 }}>
        <div style={{ background: colors.surfaceAlt, borderRadius: 12, padding: 10, marginBottom: 14 }}>
          <span style={textStyles.meta()}>PREPIFY Mock Exam — a practice estimate, not an official IELTS result.</span>
        </div>
        <p style={{ ...textStyles.body(), margin: 0 }}>{prepifyFullMockExam.description}</p>
      </AppCard>

      <div style={{ ...textStyles.label(), marginBottom: 10 }}>SECTION ORDER</div>
      <AppCard style={{ marginBottom: 20 }}>
        {prepifyFullMockExam.sections.map((s, i) => (
          <div key={s.contentId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < prepifyFullMockExam.sections.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
            <span style={textStyles.body()}>
              {i + 1}. {sectionTypeLabel(s.type)}
            </span>
            <span style={textStyles.meta()}>~{s.estimatedMinutes} min</span>
          </div>
        ))}
        <div style={{ paddingTop: 10 }}>
          <span style={textStyles.meta(colors.violet)}>Total: ~{totalEstimatedMinutes(prepifyFullMockExam)} minutes</span>
        </div>
      </AppCard>

      <AppButton label="Start Exam" onClick={handleStart} />
    </div>
  );
}
