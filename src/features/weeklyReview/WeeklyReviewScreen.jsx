import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { useAppState } from '../../state/AppStateContext';
import AppCard from '../../shared/components/AppCard';
import { loadReadingAttempts } from '../reading/data/readingRepository';
import { loadListeningAttempts } from '../listening/data/listeningRepository';
import { loadAllResponses } from '../writing/data/writingRepository';
import { loadAllSpeakingAttempts } from '../speaking/data/speakingRepository';
import { loadAllVocabularyProgress } from '../language/data/vocabularyRepository';
import { loadGrammarMistakes } from '../language/data/grammarRepository';
import { buildActivityCalendar } from '../calendar/calendarEngine';
import { buildWeeklyReview } from './weeklyReviewEngine';
import { buildIntelligenceBundle } from '../intelligence/data/intelligenceBundle';

export default function WeeklyReviewScreen() {
  const navigate = useNavigate();
  const { profile, progress } = useAppState();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const activityByDate = buildActivityCalendar({
      completedDates: progress.completedDates,
      readingAttempts: loadReadingAttempts(),
      listeningAttempts: loadListeningAttempts(),
      writingResponses: loadAllResponses(),
      speakingAttempts: loadAllSpeakingAttempts(),
    });
    // Real Intelligence integration: strengths and the top recommended
    // study action both come from the actual Intelligence bundle, not
    // an empty placeholder — matching the real Flutter source's own
    // dependency on the Intelligence layer for this screen.
    const bundle = buildIntelligenceBundle({ progress, profile });
    setSummary(
      buildWeeklyReview({
        activityByDate,
        streak: progress.streak,
        vocabularyProgress: Object.values(loadAllVocabularyProgress()),
        grammarMistakes: loadGrammarMistakes(),
        recommendedActions: bundle.actions,
        strengths: bundle.profile.strengths,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!summary) return null;

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Weekly Review</h1>
      </div>
      <div style={{ height: 16 }} />

      <AppCard style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={textStyles.label()}>SESSIONS THIS WEEK</div>
        <div style={{ ...textStyles.bandDisplay(), marginTop: 6 }}>{summary.sessionsThisWeek}</div>
      </AppCard>

      <AppCard style={{ marginBottom: 16 }}>
        <span style={textStyles.body()}>{summary.positiveObservation}</span>
      </AppCard>

      <AppCard style={{ marginBottom: 16 }}>
        <Row label="Strongest this week" value={summary.strongestSkill ?? 'Not enough data yet'} />
        <Row label="Least practiced" value={summary.leastPracticedSkill ?? 'All major skills touched'} />
        <Row label="Vocabulary activity" value={`${summary.vocabularyActivityCount} words reviewed`} />
        <Row label="Grammar activity" value={`${summary.grammarActivityCount} mistakes logged`} isLast />
      </AppCard>

      <AppCard>
        <div style={textStyles.label()}>RECOMMENDED FOCUS</div>
        <div style={{ height: 6 }} />
        <span style={textStyles.body()}>{summary.recommendedFocus}</span>
      </AppCard>
    </div>
  );
}

function Row({ label, value, isLast }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: isLast ? 'none' : `1px solid ${colors.border}` }}>
      <span style={textStyles.bodyDim()}>{label}</span>
      <span style={textStyles.cardTitle()}>{value}</span>
    </div>
  );
}
