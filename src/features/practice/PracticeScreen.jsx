import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { practiceOrder, skillMeta } from '../../core/constants/skillCatalog';
import { useAppState } from '../../state/AppStateContext';
import AppCard from '../../shared/components/AppCard';
import AppProgressBar from '../../shared/components/AppProgressBar';

export default function PracticeScreen() {
  const navigate = useNavigate();
  const { progress } = useAppState();
  return (
    <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>
      <div style={textStyles.screenTitle()}>Practice Hub</div>
      <div style={{ height: 4 }} />
      <div style={textStyles.bodyDim()}>Choose a skill to work on.</div>
      <div style={{ height: 20 }} />
      {practiceOrder.map((key) => {
        const meta = skillMeta(key);
        const Icon = meta.icon;
        const completedSessions = progress.practiceSessionsCompleted[key] ?? 0;
        const progressPct = completedSessions > 0 ? Math.min(100, 20 + completedSessions * 15) : 0;
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <AppCard onTap={() => navigate(`/practice/${key.toLowerCase()}`)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: colors.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={19} color={colors.violet} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={textStyles.cardTitle()}>{meta.shortLabel.toUpperCase()}</div>
                  <div style={{ height: 3 }} />
                  <div style={textStyles.bodyDim()}>{meta.description}</div>
                  <div style={{ height: 12 }} />
                  {progressPct > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}><AppProgressBar value={progressPct} color={colors.blue} height={6} /></div>
                      <span style={textStyles.meta()}>{progressPct}%</span>
                    </div>
                  ) : <span style={textStyles.meta()}>Not started yet</span>}
                </div>
                <ChevronRight size={18} color={colors.textFaint} />
              </div>
            </AppCard>
          </div>
        );
      })}
      <AppCard onTap={() => navigate('/mock-exam')} style={{ border: `1.5px solid ${colors.violet}55` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${colors.violet}, ${colors.blue})`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={textStyles.cardTitle()}>Mock Exams</div>
            <div style={{ height: 3 }} />
            <div style={textStyles.bodyDim()}>A full simulated exam across all four sections.</div>
          </div>
          <ChevronRight size={18} color={colors.textFaint} />
        </div>
      </AppCard>
    </div>
  );
}
