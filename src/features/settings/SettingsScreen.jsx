import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Download } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { useAppState } from '../../state/AppStateContext';
import AppCard from '../../shared/components/AppCard';
import AppButton from '../../shared/components/AppButton';
import { loadExamDate, setExamDate, daysUntilExam, examCountdownMessage } from '../examCountdown/examCountdownEngine';
import { loadNotificationPreferences, saveNotificationPreferences } from '../notifications/notificationPreferences';
import { exportDataAsDownload } from '../dataExport/dataExportService';

const weakSkillOptions = ['Listening', 'Reading', 'Writing', 'Speaking', 'Vocabulary', 'Grammar'];

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { profile, progress, updateProfile } = useAppState();
  const [examDate, setExamDateState] = useState(null);
  const [prefs, setPrefs] = useState(loadNotificationPreferences());
  const [exportMessage, setExportMessage] = useState(null);

  useEffect(() => {
    setExamDateState(loadExamDate());
  }, []);

  const toggleWeakSkill = (skill) => {
    const current = profile?.weakSkills ?? [];
    const next = current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill];
    updateProfile({ ...profile, weakSkills: next });
  };

  const handleExamDateChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    const date = new Date(value);
    setExamDate(date);
    setExamDateState(date);
  };

  const handlePrefChange = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveNotificationPreferences(next);
  };

  const handleExport = () => {
    const result = exportDataAsDownload(profile, progress);
    setExportMessage(result.message);
  };

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Settings</h1>
      </div>
      <div style={{ height: 16 }} />

      <AppCard style={{ marginBottom: 16 }}>
        <div style={{ ...textStyles.label(), marginBottom: 10 }}>WEAK SKILLS</div>
        <div role="group" aria-label="Select your weak skills" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {weakSkillOptions.map((skill) => {
            const selected = (profile?.weakSkills ?? []).includes(skill);
            return (
              <button
                key={skill}
                onClick={() => toggleWeakSkill(skill)}
                aria-pressed={selected}
                style={{ padding: '7px 12px', borderRadius: 999, background: selected ? colors.violetSoft : colors.surfaceAlt, ...textStyles.meta(selected ? colors.violet : colors.textDim) }}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </AppCard>

      <AppCard style={{ marginBottom: 16 }}>
        <div style={{ ...textStyles.label(), marginBottom: 10 }}>EXAM DATE</div>
        <label htmlFor="settings-exam-date" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          Set your exam date
        </label>
        <input
          id="settings-exam-date"
          type="date"
          value={examDate ? examDate.toISOString().slice(0, 10) : ''}
          onChange={handleExamDateChange}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.surfaceAlt, ...textStyles.body() }}
        />
        <div style={{ height: 8 }} />
        <span style={textStyles.meta()}>{examCountdownMessage(daysUntilExam(examDate))}</span>
      </AppCard>

      <AppCard style={{ marginBottom: 16 }}>
        <div style={{ ...textStyles.label(), marginBottom: 10 }}>NOTIFICATIONS</div>
        <Toggle label="Daily study reminder" checked={prefs.studyReminderEnabled} onChange={(v) => handlePrefChange('studyReminderEnabled', v)} />
        <Toggle label="Weekly review reminder" checked={prefs.weeklyReviewReminderEnabled} onChange={(v) => handlePrefChange('weeklyReviewReminderEnabled', v)} />
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <Info size={14} color={colors.textDim} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <span style={textStyles.meta()}>Notifications are not yet configured on this device. These preferences are saved for when real scheduling is added.</span>
        </div>
      </AppCard>

      <AppCard style={{ marginBottom: 16 }}>
        <div style={{ ...textStyles.label(), marginBottom: 6 }}>APPEARANCE</div>
        <span style={textStyles.bodyDim()}>PREPIFY currently uses a single premium light theme.</span>
      </AppCard>

      <AppCard style={{ marginBottom: 16 }}>
        <div style={{ ...textStyles.label(), marginBottom: 10 }}>YOUR DATA</div>
        <AppButton label="Export My Data (JSON)" variant="secondary" trailingIcon={Download} onClick={handleExport} />
        {exportMessage ? (
          <div style={{ marginTop: 10 }} role="status">
            <span style={textStyles.meta()}>{exportMessage}</span>
          </div>
        ) : null}
      </AppCard>

      <AppCard>
        <button onClick={() => navigate('/about')} style={{ display: 'block', width: '100%', textAlign: 'left' }}>
          <span style={textStyles.body()}>About &amp; Legal</span>
        </button>
      </AppCard>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <span style={textStyles.body()}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        style={{ width: 42, height: 24, borderRadius: 12, background: checked ? colors.violet : colors.surfaceAlt, position: 'relative', transition: 'background 150ms' }}
      >
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: colors.white, position: 'absolute', top: 3, left: checked ? 21 : 3, transition: 'left 150ms' }} />
      </button>
    </div>
  );
}
