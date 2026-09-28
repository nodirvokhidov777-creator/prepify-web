import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, Trophy } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import { useAppState } from '../../../state/AppStateContext';
import AppCard from '../../../shared/components/AppCard';
import { loadAchievementStatuses } from '../data/achievementsService';

export default function AchievementsGalleryScreen() {
  const navigate = useNavigate();
  const { progress } = useAppState();
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    setStatuses(loadAchievementStatuses({ practiceSessionsCompleted: progress.practiceSessionsCompleted, streak: progress.streak }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockedCount = statuses.filter((s) => s.unlocked).length;

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Achievements</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 16 }}>
        <span style={textStyles.bodyDim()}>
          {unlockedCount} of {statuses.length} unlocked.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {statuses.map(({ achievement, unlocked }) => (
          <AppCard key={achievement.id} padding={14} style={{ opacity: unlocked ? 1 : 0.55 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: unlocked ? colors.premiumGoldSoft : colors.surfaceAlt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unlocked ? <Trophy size={18} color={colors.premiumGold} aria-hidden="true" /> : <Lock size={16} color={colors.textFaint} aria-hidden="true" />}
              </div>
              <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>{achievement.title}</h2>
              <span style={textStyles.meta()}>{achievement.description}</span>
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
