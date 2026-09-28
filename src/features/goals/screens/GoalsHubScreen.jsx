import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import { useAppState } from '../../../state/AppStateContext';
import { currentBandFor } from '../../../core/utils/bandUtils';
import AppCard from '../../../shared/components/AppCard';
import AppProgressBar from '../../../shared/components/AppProgressBar';
import { goalTemplates } from '../data/goalTemplates';
import { buildGoalContext, loadAllGoalsWithFreshCompletionCheck, createGoalFromTemplate, deleteGoal } from '../data/goalsService';
import { computeGoalProgress, goalProgressFraction } from '../engines/goalProgressEngine';

export default function GoalsHubScreen() {
  const navigate = useNavigate();
  const { profile, progress } = useAppState();
  const [goals, setGoals] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const context = buildGoalContext({
    practiceSessionsCompleted: progress.practiceSessionsCompleted,
    streak: progress.streak,
    currentBand: currentBandFor(profile?.level),
  });

  const refresh = () => setGoals(loadAllGoalsWithFreshCompletionCheck(context));

  useEffect(refresh, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = goals.filter((g) => !g.completed);
  const completed = goals.filter((g) => g.completed);

  const handleCreate = (template) => {
    createGoalFromTemplate(template);
    setShowTemplates(false);
    refresh();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this goal? This cannot be undone.')) {
      deleteGoal(id);
      refresh();
    }
  };

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
            <ChevronLeft color={colors.text} />
          </button>
          <h1 style={{ ...textStyles.heading(), margin: 0 }}>Goals</h1>
        </div>
        <button onClick={() => setShowTemplates((s) => !s)} aria-label="Add a new goal" style={{ padding: 8 }}>
          <Plus color={colors.violet} />
        </button>
      </div>
      <div style={{ height: 16 }} />

      {showTemplates ? (
        <AppCard style={{ marginBottom: 16 }}>
          <div style={{ ...textStyles.label(), marginBottom: 10 }}>CHOOSE A GOAL</div>
          {goalTemplates.map((t) => (
            <button
              key={t.title}
              onClick={() => handleCreate(t)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}
            >
              <span style={textStyles.body()}>{t.title}</span>
            </button>
          ))}
        </AppCard>
      ) : null}

      {active.length === 0 && completed.length === 0 ? (
        <AppCard>
          <span style={textStyles.bodyDim()}>No active goals yet. Tap + to set one based on real activity you can measure.</span>
        </AppCard>
      ) : null}

      {active.map((goal) => {
        const value = computeGoalProgress(goal, context);
        const fraction = goalProgressFraction(goal, value);
        return (
          <div key={goal.id} style={{ marginBottom: 12 }}>
            <AppCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>{goal.title}</h2>
                <button onClick={() => handleDelete(goal.id)} aria-label={`Delete goal: ${goal.title}`} style={{ padding: 4 }}>
                  <Trash2 size={16} color={colors.textFaint} />
                </button>
              </div>
              <div style={{ height: 10 }} />
              <AppProgressBar value={fraction * 100} color={colors.violet} height={7} />
              <div style={{ height: 6 }} />
              <span style={textStyles.meta()}>
                {value.toFixed(goal.type === 'targetBand' ? 1 : 0)} / {goal.targetValue}
              </span>
            </AppCard>
          </div>
        );
      })}

      {completed.length > 0 ? (
        <>
          <div style={{ ...textStyles.label(), margin: '20px 0 10px' }}>COMPLETED</div>
          {completed.map((goal) => (
            <div key={goal.id} style={{ marginBottom: 10 }}>
              <AppCard padding={14}>
                <span style={textStyles.body(colors.emerald)}>✓ {goal.title}</span>
              </AppCard>
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}
