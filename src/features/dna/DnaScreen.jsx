import { useEffect, useState } from 'react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { useAppState } from '../../state/AppStateContext';
import AppCard from '../../shared/components/AppCard';
import { buildIntelligenceBundle } from '../intelligence/data/intelligenceBundle';
import { buildDnaSignal } from '../intelligence/engines/dnaSignalEngine';
import { computeConsistencySummary, studyPatternLabel } from '../intelligence/engines/consistencyEngine';
import { IntelligenceThresholds } from '../intelligence/engines/intelligenceThresholds';

/** A plain SVG radar/polygon — one axis per skill with real accuracy
 * data, real score (0-9 scale) per axis. No canvas library needed for a
 * shape this simple, and it stays inspectable/testable as plain SVG. */
function DnaPolygon({ signal }) {
  const size = 220;
  const center = size / 2;
  const maxRadius = size / 2 - 28;
  const n = signal.length;

  const pointFor = (i, value) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (value / 9) * maxRadius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };
  const labelPointFor = (i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = maxRadius + 18;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const polygonPoints = signal.map((s, i) => pointFor(i, s.score).join(',')).join(' ');
  const gridRings = [3, 6, 9];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 260, display: 'block', margin: '0 auto' }} role="img" aria-label="Skill accuracy signal chart">
      {gridRings.map((ring) => (
        <polygon key={ring} points={signal.map((_, i) => pointFor(i, ring).join(',')).join(' ')} fill="none" stroke={colors.border} strokeWidth={1} />
      ))}
      {signal.map((_, i) => {
        const [x, y] = pointFor(i, 9);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke={colors.border} strokeWidth={1} />;
      })}
      <polygon points={polygonPoints} fill={colors.violetSoft} stroke={colors.violet} strokeWidth={2} />
      {signal.map((s, i) => {
        const [x, y] = pointFor(i, s.score);
        return <circle key={s.skill} cx={x} cy={y} r={3.5} fill={colors.violet} />;
      })}
      {signal.map((s, i) => {
        const [x, y] = labelPointFor(i);
        return (
          <text key={s.skill} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={700} fill={colors.textDim}>
            {s.skill}
          </text>
        );
      })}
    </svg>
  );
}

export default function DnaScreen() {
  const { profile, progress } = useAppState();
  const [bundle, setBundle] = useState(null);

  useEffect(() => {
    setBundle(buildIntelligenceBundle({ progress, profile }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bundle) return null;
  const { profile: learningProfile, actions, dailyPlan } = bundle;

  const signal = buildDnaSignal(learningProfile.metrics);
  const pattern = studyPatternLabel(learningProfile.totalPracticeSessions, progress.streak);
  const consistency = computeConsistencySummary(progress.completedDates, progress.streak);
  const skillsWithData = Object.values(learningProfile.metrics).filter((m) => m.hasEnoughData).length;
  const topAction = actions[0];

  return (
    <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>Your PREPIFY DNA</h1>
      <div style={{ height: 4 }} />
      <div style={textStyles.bodyDim()}>A real snapshot of how you learn, based on your own activity.</div>
      <div style={{ height: 20 }} />

      <AppCard style={{ marginBottom: 16 }}>
        {signal ? (
          <DnaPolygon signal={signal} />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span style={textStyles.cardTitle()}>Building Your Signal</span>
            <div style={{ height: 8 }} />
            <span style={textStyles.bodyDim()}>
              Complete enough practice in at least {IntelligenceThresholds.minSkillsForDnaSignal} skills to see your real signal here.
            </span>
          </div>
        )}
        <div style={{ height: 16 }} />
        <Row label="Total practice sessions" value={String(learningProfile.totalPracticeSessions)} />
        <Row label="Skills with enough data" value={`${skillsWithData} of ${Object.keys(learningProfile.metrics).length}`} isLast />
      </AppCard>

      <AppCard style={{ marginBottom: 16 }}>
        <span style={textStyles.label()}>STUDY PATTERN</span>
        <div style={{ height: 6 }} />
        <span style={textStyles.cardTitle()}>{pattern}</span>
        <div style={{ height: 4 }} />
        <span style={textStyles.bodyDim()}>{consistency.message}</span>
      </AppCard>

      {topAction ? (
        <AppCard style={{ marginBottom: 16 }}>
          <span style={textStyles.label(colors.violet)}>RECOMMENDED FOR YOU</span>
          <div style={{ height: 6 }} />
          <span style={textStyles.cardTitle()}>{topAction.label}</span>
          <div style={{ height: 4 }} />
          <span style={textStyles.bodyDim()}>{topAction.reason}</span>
        </AppCard>
      ) : null}

      <AppCard>
        <Row label="Daily Study Goal" value={profile?.dailyTime ?? '—'} />
        <Row label="Today's plan" value={`${dailyPlan.items.length} step${dailyPlan.items.length === 1 ? '' : 's'} · ~${dailyPlan.estimatedMinutes} min`} isLast />
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
