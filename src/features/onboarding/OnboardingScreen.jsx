import { useState } from 'react';
import { Sparkles, ChevronLeft, ArrowRight } from 'lucide-react';
import { colors, heroGradient } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { radius } from '../../core/theme/spacing';
import { useAppState } from '../../state/AppStateContext';
import AppCard from '../../shared/components/AppCard';
import { onboardSteps, OnboardStepKind } from './onboardingData';

/**
 * Direct port of onboarding_flow.dart's 7-step experience — replacing
 * the earlier single-page substitute. Note: the real Flutter source has
 * no "skip" affordance anywhere (only Continue/Back, gated by real
 * per-step validation), so none is invented here either.
 */
export default function OnboardingScreen() {
  const { completeOnboarding } = useAppState();
  const [index, setIndex] = useState(0);
  const [level, setLevel] = useState('');
  const [target, setTarget] = useState('');
  const [examDate, setExamDate] = useState('');
  const [weakSkills, setWeakSkills] = useState([]);
  const [dailyTime, setDailyTime] = useState('');

  const step = onboardSteps[index];

  const valueFor = (key) => {
    switch (key) {
      case 'level': return level;
      case 'target': return target;
      case 'examDate': return examDate;
      case 'dailyTime': return dailyTime;
      default: return '';
    }
  };

  const canAdvance = (() => {
    switch (step.key) {
      case 'welcome':
      case 'summary': return true;
      case 'level': return level !== '';
      case 'target': return target !== '';
      case 'examDate': return examDate !== '';
      case 'weakSkills': return weakSkills.length > 0;
      case 'dailyTime': return dailyTime !== '';
      default: return false;
    }
  })();

  const select = (key, option, multi) => {
    if (multi) {
      setWeakSkills((prev) => (prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]));
      return;
    }
    if (key === 'level') setLevel(option);
    else if (key === 'target') setTarget(option);
    else if (key === 'examDate') setExamDate(option);
    else if (key === 'dailyTime') setDailyTime(option);
  };

  const handleNext = () => {
    if (index === onboardSteps.length - 1) {
      completeOnboarding({ level, target, examDate, weakSkills, dailyTime, onboarded: true });
      return;
    }
    setIndex((i) => i + 1);
  };
  const handleBack = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
  };

  const buttonLabel = step.key === 'welcome' ? "Let's Begin" : step.key === 'summary' ? 'Create My Plan' : 'Continue';

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <ProgressBar step={index} total={onboardSteps.length} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 16px', maxWidth: 520, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {step.kind === OnboardStepKind.WELCOME ? (
          <WelcomeStep />
        ) : step.kind === OnboardStepKind.SUMMARY ? (
          <SummaryStep level={level} target={target} weakSkills={weakSkills} dailyTime={dailyTime} />
        ) : (
          <SelectStep step={step} multi={step.kind === OnboardStepKind.MULTI_SELECT} value={valueFor(step.key)} weakSkills={weakSkills} onSelect={select} />
        )}
      </div>

      <div style={{ padding: '8px 24px 24px', maxWidth: 520, margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', gap: 12 }}>
        {index > 0 ? (
          <button onClick={handleBack} aria-label="Go back to the previous step" style={{ padding: '15px 18px', borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <ChevronLeft color={colors.textDim} />
          </button>
        ) : null}
        <button
          onClick={canAdvance ? handleNext : undefined}
          disabled={!canAdvance}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '15px 20px',
            borderRadius: radius.lg,
            background: colors.violet,
            opacity: canAdvance ? 1 : 0.4,
            cursor: canAdvance ? 'pointer' : 'not-allowed',
          }}
        >
          <span style={textStyles.buttonLabel()}>{buttonLabel}</span>
          {step.key !== 'summary' ? <ArrowRight size={17} color={colors.white} /> : null}
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ step, total }) {
  const fraction = (step + 1) / total;
  return (
    <div role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total} aria-label={`Onboarding step ${step + 1} of ${total}`} style={{ padding: '16px 24px 0' }}>
      <div style={{ height: 5, borderRadius: 5, background: colors.surfaceAlt, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${fraction * 100}%`, background: colors.violet, transition: 'width 250ms ease' }} />
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: heroGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={26} color={colors.white} aria-hidden="true" />
      </div>
      <div style={{ height: 24 }} />
      <h1 style={{ ...textStyles.screenTitle(), fontSize: 24, lineHeight: 1.3, margin: 0 }}>Your IELTS journey starts here.</h1>
      <div style={{ height: 12 }} />
      <p style={{ ...textStyles.bodyDim(), margin: 0 }}>PREPIFY will personalize your preparation based on your goals and current level.</p>
    </div>
  );
}

function SelectStep({ step, multi, value, weakSkills, onSelect }) {
  return (
    <div>
      <h1 style={{ ...textStyles.heading(), fontSize: 20, margin: 0 }}>{step.question}</h1>
      <div style={{ height: 20 }} />
      <div role={multi ? 'group' : 'radiogroup'} aria-label={step.question}>
        {step.options.map((opt) => {
          const selected = multi ? weakSkills.includes(opt) : value === opt;
          return (
            <div key={opt} style={{ marginBottom: 10 }}>
              <button
                role={multi ? 'checkbox' : 'radio'}
                aria-checked={selected}
                onClick={() => onSelect(step.key, opt, multi)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px 18px',
                  borderRadius: radius.lg,
                  background: selected ? colors.violetSoft : colors.surface,
                  border: `1.5px solid ${selected ? colors.violet : colors.border}`,
                }}
              >
                <span style={textStyles.body(selected ? colors.violet : colors.text)}>{opt}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStep({ level, target, weakSkills, dailyTime }) {
  const rows = [
    ['Current Level', level || '—'],
    ['Target', target],
    ['Focus', weakSkills.slice(0, 2).join(' + ') || 'General review'],
    ['Daily Goal', dailyTime],
  ];
  return (
    <div>
      <h1 style={{ ...textStyles.heading(), fontSize: 20, margin: 0 }}>Your Prepify Profile</h1>
      <div style={{ height: 4 }} />
      <p style={{ ...textStyles.bodyDim(), margin: 0 }}>We'll use this to build your daily plan.</p>
      <div style={{ height: 20 }} />
      <AppCard padding={0}>
        {rows.map(([label, value], i) => (
          <div key={label} style={{ padding: '16px 20px', borderBottom: i < rows.length - 1 ? `1px solid ${colors.border}` : 'none', display: 'flex', justifyContent: 'space-between' }}>
            <span style={textStyles.bodyDim()}>{label}</span>
            <span style={textStyles.cardTitle()}>{value}</span>
          </div>
        ))}
      </AppCard>
    </div>
  );
}
