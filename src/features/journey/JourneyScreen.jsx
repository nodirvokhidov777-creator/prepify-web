import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import AppCard from '../../shared/components/AppCard';
import { EmptyState } from '../../shared/components/StateViews';
import { loadReadingAttempts } from '../reading/data/readingRepository';
import { loadListeningAttempts } from '../listening/data/listeningRepository';
import { loadAllResponses } from '../writing/data/writingRepository';
import { loadAllSpeakingAttempts } from '../speaking/data/speakingRepository';
import { loadAllAttempts as loadMockExamAttempts } from '../mockExam/data/mockExamRepository';
import { loadAllUnlocked } from '../achievements/data/achievementsRepository';
import { loadAllGoals } from '../goals/data/goalsRepository';
import { buildJourneyMilestones } from './journeyEngine';

export default function JourneyScreen() {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    setMilestones(
      buildJourneyMilestones({
        readingAttempts: loadReadingAttempts(),
        listeningAttempts: loadListeningAttempts(),
        writingResponses: loadAllResponses(),
        speakingAttempts: loadAllSpeakingAttempts(),
        mockExamAttempts: loadMockExamAttempts(),
        unlockedAchievements: loadAllUnlocked(),
        completedGoals: loadAllGoals().filter((g) => g.completed),
      })
    );
  }, []);

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Your Journey</h1>
      </div>
      <div style={{ height: 16 }} />

      {milestones.length === 0 ? (
        <EmptyState message="Your journey will appear here as you complete real practice, achievements, and goals." />
      ) : (
        <AppCard>
          {milestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < milestones.length - 1 ? 16 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: colors.violet, marginTop: 4 }} />
                {i < milestones.length - 1 ? <div aria-hidden="true" style={{ width: 1, flex: 1, background: colors.border, marginTop: 4 }} /> : null}
              </div>
              <div>
                <span style={textStyles.body()}>{m.title}</span>
                <div style={{ height: 2 }} />
                <span style={textStyles.meta()}>{m.timestamp.toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </AppCard>
      )}
    </div>
  );
}
