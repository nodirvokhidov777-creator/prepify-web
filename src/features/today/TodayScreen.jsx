import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { colors, heroGradient } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { currentBandFor, targetBandFor } from '../../core/utils/bandUtils';
import { greeting, currentWeekDates, todayIso } from '../../core/utils/dateUtils';
import { skillMeta } from '../../core/constants/skillCatalog';
import { useAppState } from '../../state/AppStateContext';
import AppCard from '../../shared/components/AppCard';
import { loadExamDate, daysUntilExam, examCountdownMessage } from '../examCountdown/examCountdownEngine';

export default function TodayScreen() {
  const navigate = useNavigate();
  const { profile, progress, todayMission, toggleTask } = useAppState();
  const [examDate, setExamDateState] = useState(null);

  useEffect(() => {
    setExamDateState(loadExamDate());
  }, []);

  const currentBand = currentBandFor(profile?.level);
  const targetBand = targetBandFor(profile?.target);
  const span = Math.max(0.5, Math.min(9, Math.abs(targetBand - currentBand)));
  const weekDates = currentWeekDates();
  const weekDone = weekDates.map((d) => progress.completedDates[d] === true);
  const doneThisWeek = weekDone.filter(Boolean).length;
  const todayCompletedIds = progress.todayTaskDate === todayIso() ? progress.todayCompletedTaskIds : [];

  return (
    <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>
      <div style={textStyles.screenTitle()}>{greeting()} 👋</div>
      <div style={{ height: 4 }} />
      <div style={textStyles.bodyDim()}>Small progress today. Big results tomorrow.</div>
      <div style={{ height: 20 }} />
      <div style={{ background: heroGradient, borderRadius: 24, padding: 24, color: colors.white }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ ...textStyles.label(), color: 'rgba(255,255,255,0.7)' }}>CURRENT ESTIMATE</div>
            <div style={{ ...textStyles.bandDisplay(colors.white) }}>{currentBand.toFixed(1)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...textStyles.label(), color: 'rgba(255,255,255,0.7)' }}>TARGET</div>
            <div style={{ ...textStyles.bandDisplayMedium('rgba(255,255,255,0.85)') }}>{targetBand.toFixed(1)}</div>
          </div>
        </div>
        <div style={{ height: 16 }} />
        <div style={{ ...textStyles.body('rgba(255,255,255,0.92)') }}>You're {span.toFixed(1)} band{span === 1 ? '' : 's'} away from your target.</div>
      </div>
      <div style={{ height: 24 }} />
      <div style={textStyles.label()}>TODAY'S PREP</div>
      <div style={{ height: 10 }} />
      <AppCard>
        {todayMission.map((task, i) => {
          const meta = skillMeta(task.skill);
          const done = todayCompletedIds.includes(task.id);
          return (
            <button key={task.id} onClick={() => toggleTask(task.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 0', borderBottom: i < todayMission.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
              {done ? <CheckCircle2 size={20} color={colors.emerald} /> : <Circle size={20} color={colors.textFaint} />}
              <div style={{ flex: 1, textAlign: 'left' }}><span style={textStyles.body(done ? colors.textDim : colors.text)}>{meta?.missionLabel ?? task.skill}</span></div>
              <span style={textStyles.meta()}>{task.minutes} min</span>
            </button>
          );
        })}
      </AppCard>
      <div style={{ height: 24 }} />
      <AppCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Flame size={22} color={colors.amber} />
            <div>
              <div style={textStyles.cardTitle()}>{progress.streak} Day Streak</div>
              <div style={textStyles.bodyDim()}>Weekly Goal · {doneThisWeek} / 7 days</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {weekDone.map((done, i) => <div key={i} style={{ width: 6, height: 24, borderRadius: 3, background: done ? colors.emerald : colors.surfaceAlt }} />)}
          </div>
        </div>
      </AppCard>

      <div style={{ height: 16 }} />
      <AppCard onTap={() => navigate('/settings')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calendar size={20} color={colors.blue} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <span style={textStyles.body()}>{examCountdownMessage(daysUntilExam(examDate))}</span>
            {!examDate ? (
              <>
                <div style={{ height: 2 }} />
                <span style={textStyles.meta(colors.blue)}>Set it in Settings</span>
              </>
            ) : null}
          </div>
        </div>
      </AppCard>
    </div>
  );
}
