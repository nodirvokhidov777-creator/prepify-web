import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileBarChart2, Mail, PenSquare, CheckCircle2, Lock } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import PracticeFilterChip from '../../../shared/components/PracticeFilterChip';
import PremiumBadge from '../../premium/PremiumBadge';
import { ContentTier, tierOf, isContentAccessible } from '../../premium/contentAccess';
import { loadEntitlements } from '../../premium/premiumRegistry';
import { writingTaskCatalog } from '../data/writingTaskCatalog';
import { loadAttemptedTaskIds } from '../data/writingRepository';
import { WritingTaskType, writingTaskBadge } from '../models/writingModels';

const FILTERS = { ALL: 'all', TASK1: 'task1', TASK2: 'task2', BASIC: 'basic', PREMIUM: 'premium' };

const typeIcon = { [WritingTaskType.ACADEMIC_TASK1]: FileBarChart2, [WritingTaskType.GENERAL_TASK1]: Mail, [WritingTaskType.ESSAY_TASK2]: PenSquare };
const typeAccent = { [WritingTaskType.ACADEMIC_TASK1]: colors.blue, [WritingTaskType.GENERAL_TASK1]: colors.emerald, [WritingTaskType.ESSAY_TASK2]: colors.violet };
const typeAccentSoft = { [WritingTaskType.ACADEMIC_TASK1]: colors.blueSoft, [WritingTaskType.GENERAL_TASK1]: colors.emeraldSoft, [WritingTaskType.ESSAY_TASK2]: colors.violetSoft };

export default function WritingHubScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [entitlements, setEntitlements] = useState({ isPro: false });

  useEffect(() => {
    setAttemptedIds(loadAttemptedTaskIds());
    setEntitlements(loadEntitlements());
  }, []);

  const task1Count = writingTaskCatalog.filter((t) => t.taskType !== WritingTaskType.ESSAY_TASK2).length;
  const task2Count = writingTaskCatalog.filter((t) => t.taskType === WritingTaskType.ESSAY_TASK2).length;
  const basicCount = writingTaskCatalog.filter((t) => tierOf(t.id) === ContentTier.BASIC).length;
  const premiumCount = writingTaskCatalog.filter((t) => tierOf(t.id) === ContentTier.PREMIUM).length;

  const visible = writingTaskCatalog.filter((t) => {
    if (filter === FILTERS.TASK1) return t.taskType !== WritingTaskType.ESSAY_TASK2;
    if (filter === FILTERS.TASK2) return t.taskType === WritingTaskType.ESSAY_TASK2;
    if (filter === FILTERS.BASIC) return tierOf(t.id) === ContentTier.BASIC;
    if (filter === FILTERS.PREMIUM) return tierOf(t.id) === ContentTier.PREMIUM;
    return true;
  });

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Writing</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 14 }}>
        <span style={textStyles.bodyDim()}>{writingTaskCatalog.length} original prompts across every task type.</span>
      </div>

      <div role="group" aria-label="Filter prompts" style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <PracticeFilterChip label={`All (${writingTaskCatalog.length})`} selected={filter === FILTERS.ALL} onClick={() => setFilter(FILTERS.ALL)} />
        <PracticeFilterChip label={`Task 1 (${task1Count})`} selected={filter === FILTERS.TASK1} onClick={() => setFilter(FILTERS.TASK1)} />
        <PracticeFilterChip label={`Task 2 (${task2Count})`} selected={filter === FILTERS.TASK2} onClick={() => setFilter(FILTERS.TASK2)} />
        <PracticeFilterChip label={`Basic (${basicCount})`} selected={filter === FILTERS.BASIC} onClick={() => setFilter(FILTERS.BASIC)} />
        <PracticeFilterChip label={`Premium (${premiumCount})`} selected={filter === FILTERS.PREMIUM} onClick={() => setFilter(FILTERS.PREMIUM)} />
      </div>

      {visible.map((task) => {
        const Icon = typeIcon[task.taskType];
        const accent = typeAccent[task.taskType];
        const accentSoft = typeAccentSoft[task.taskType];
        const isPremium = tierOf(task.id) === ContentTier.PREMIUM;
        const accessible = isContentAccessible(task.id, entitlements);
        const attempted = attemptedIds.has(task.id);
        return (
          <div key={task.id} style={{ marginBottom: 12 }}>
            <AppCard onTap={() => navigate(`/practice/writing/preview/${task.id}`)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={accent} aria-hidden="true" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 999, background: accentSoft, ...textStyles.meta(accent) }}>{writingTaskBadge(task.taskType)}</span>
                    {isPremium ? <PremiumBadge locked={!accessible} /> : null}
                    {attempted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: colors.emeraldSoft }}>
                        <CheckCircle2 size={10} color={colors.emerald} aria-hidden="true" />
                        <span style={{ ...textStyles.meta(colors.emerald), fontWeight: 700, fontSize: 9 }}>DONE</span>
                      </span>
                    ) : null}
                  </div>
                  <div style={{ height: 6 }} />
                  <h2 style={{ ...textStyles.cardTitle(), margin: 0, fontSize: 15 }}>{task.title}</h2>
                  <div style={{ height: 8 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={textStyles.meta(accent)}>{task.minimumWordCount}+ words</span>
                    <span style={textStyles.meta(accent)}>{task.recommendedMinutes} min</span>
                  </div>
                </div>
                {accessible ? null : <Lock size={16} color={colors.textFaint} aria-label="Locked, Premium content" />}
              </div>
            </AppCard>
          </div>
        );
      })}
    </div>
  );
}
