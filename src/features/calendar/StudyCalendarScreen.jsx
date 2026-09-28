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
import { buildActivityCalendar } from './calendarEngine';
import { isoDate } from '../../core/utils/dateUtils';

export default function StudyCalendarScreen() {
  const navigate = useNavigate();
  const { progress } = useAppState();
  const [calendar, setCalendar] = useState({});

  useEffect(() => {
    setCalendar(
      buildActivityCalendar({
        completedDates: progress.completedDates,
        readingAttempts: loadReadingAttempts(),
        listeningAttempts: loadListeningAttempts(),
        writingResponses: loadAllResponses(),
        speakingAttempts: loadAllSpeakingAttempts(),
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Last 35 days, oldest first — a simple honest grid rather than a full
  // month-picker calendar widget.
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return isoDate(d);
  });

  const activeDays = Object.keys(calendar).length;

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Study Calendar</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 16 }}>
        <span style={textStyles.bodyDim()}>
          {activeDays} active day{activeDays === 1 ? '' : 's'} recorded.
        </span>
      </div>

      <AppCard>
        <div role="img" aria-label={`Activity grid: ${activeDays} active days in the last 35 days`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {days.map((date) => {
            const day = calendar[date];
            const hasActivity = !!day;
            return (
              <div
                key={date}
                title={hasActivity ? `${date}: ${day.sessionsCount} session${day.sessionsCount === 1 ? '' : 's'}` : `${date}: no activity`}
                style={{ aspectRatio: '1', borderRadius: 6, background: hasActivity ? (day.missionCompleted ? colors.emerald : colors.violetSoft) : colors.surfaceAlt }}
              />
            );
          })}
        </div>
        <div style={{ height: 14 }} />
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Legend color={colors.emerald} label="Mission completed" />
          <Legend color={colors.violetSoft} label="Practiced" />
          <Legend color={colors.surfaceAlt} label="No activity" />
        </div>
      </AppCard>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <span style={textStyles.meta()}>{label}</span>
    </div>
  );
}
