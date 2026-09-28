import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, HelpCircle, Lightbulb } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { useAppState } from '../../state/AppStateContext';
import AppCard from '../../shared/components/AppCard';
import { buildIntelligenceBundle } from '../intelligence/data/intelligenceBundle';
import { TrendDirection, trendLabel } from '../intelligence/engines/trendEngine';

const skillOrder = ['Reading', 'Listening', 'Writing', 'Speaking', 'Vocabulary', 'Grammar'];
const trendIcon = { [TrendDirection.IMPROVING]: TrendingUp, [TrendDirection.DECLINING]: TrendingDown, [TrendDirection.STABLE]: Minus, [TrendDirection.NEEDS_MORE_DATA]: HelpCircle };
const trendColor = { [TrendDirection.IMPROVING]: colors.emerald, [TrendDirection.DECLINING]: colors.error, [TrendDirection.STABLE]: colors.blue, [TrendDirection.NEEDS_MORE_DATA]: colors.textFaint };
const priorityColor = { high: colors.error, medium: colors.amber, low: colors.blue };

export default function ProgressScreen() {
  const { profile, progress } = useAppState();
  const [bundle, setBundle] = useState(null);

  useEffect(() => {
    setBundle(buildIntelligenceBundle({ progress, profile }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bundle) return null;
  const { profile: learningProfile, actions } = bundle;

  return (
    <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>Progress</h1>
      <div style={{ height: 4 }} />
      <div style={textStyles.bodyDim()}>{learningProfile.totalPracticeSessions} practice sessions completed.</div>
      <div style={{ height: 20 }} />

      {learningProfile.strengths.length > 0 || learningProfile.focusAreas.length > 0 ? (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {learningProfile.strengths.length > 0 ? (
            <AppCard style={{ flex: 1 }} padding={14}>
              <span style={textStyles.label(colors.emerald)}>STRENGTHS</span>
              <div style={{ height: 6 }} />
              <span style={textStyles.body()}>{learningProfile.strengths.join(', ')}</span>
            </AppCard>
          ) : null}
          {learningProfile.focusAreas.length > 0 ? (
            <AppCard style={{ flex: 1 }} padding={14}>
              <span style={textStyles.label(colors.amber)}>FOCUS AREAS</span>
              <div style={{ height: 6 }} />
              <span style={textStyles.body()}>{learningProfile.focusAreas.join(', ')}</span>
            </AppCard>
          ) : null}
        </div>
      ) : null}

      <div style={{ ...textStyles.label(), marginBottom: 10 }}>SKILL BREAKDOWN</div>
      {skillOrder.map((skill) => {
        const m = learningProfile.metrics[skill];
        const TrendIcon = trendIcon[m.trend];
        return (
          <div key={skill} style={{ marginBottom: 10 }}>
            <AppCard padding={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>{skill}</h2>
                {m.hasEnoughData ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TrendIcon size={14} color={trendColor[m.trend]} aria-hidden="true" />
                    <span style={textStyles.meta(trendColor[m.trend])}>{trendLabel(m.trend)}</span>
                  </div>
                ) : null}
              </div>
              <div style={{ height: 6 }} />
              {m.hasEnoughData ? (
                <span style={textStyles.bodyDim()}>
                  {m.accuracy != null
                    ? `${Math.round(m.accuracy * 100)}% accuracy over ${m.activityCount} questions`
                    : m.completionRate != null
                      ? `${Math.round(m.completionRate * 100)}% completion rate, ${m.activityCount} completed`
                      : `${m.activityCount} completed`}
                </span>
              ) : (
                <span style={textStyles.meta()}>Not enough data yet ({m.activityCount} so far)</span>
              )}
            </AppCard>
          </div>
        );
      })}

      {learningProfile.insights.length > 0 ? (
        <>
          <div style={{ ...textStyles.label(), margin: '20px 0 10px' }}>INSIGHTS</div>
          {learningProfile.insights.map((insight) => (
            <div key={insight.id} style={{ marginBottom: 10 }}>
              <AppCard padding={14}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor[insight.priority], marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <span style={textStyles.cardTitle()}>{insight.title}</span>
                    <div style={{ height: 4 }} />
                    <span style={textStyles.bodyDim()}>{insight.description}</span>
                    <div style={{ height: 4 }} />
                    <span style={textStyles.meta()}>{insight.evidence}</span>
                  </div>
                </div>
              </AppCard>
            </div>
          ))}
        </>
      ) : null}

      <div style={{ ...textStyles.label(), margin: '20px 0 10px' }}>RECOMMENDED STUDY ACTIONS</div>
      {actions.slice(0, 4).map((action, i) => (
        <div key={`${action.type}_${action.skill}_${i}`} style={{ marginBottom: 10 }}>
          <AppCard padding={14}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Lightbulb size={16} color={colors.violet} style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
              <div>
                <span style={textStyles.cardTitle()}>{action.label}</span>
                <div style={{ height: 3 }} />
                <span style={textStyles.bodyDim()}>{action.reason}</span>
                <div style={{ height: 3 }} />
                <span style={textStyles.meta()}>
                  ~{action.estimatedMinutes} min · {action.evidence}
                </span>
              </div>
            </div>
          </AppCard>
        </div>
      ))}
    </div>
  );
}
