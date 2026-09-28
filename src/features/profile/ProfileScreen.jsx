import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Target, Trophy, Calendar, TrendingUp, Compass, Settings, BadgeCheck, Star } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { useAppState } from '../../state/AppStateContext';
import AppCard from '../../shared/components/AppCard';
import { loadEntitlements } from '../premium/premiumRegistry';

export default function ProfileScreen() {
  const { profile, resetAll } = useAppState();
  const navigate = useNavigate();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setIsPro(loadEntitlements().isPro);
  }, []);

  const handleReset = () => {
    if (window.confirm('This permanently deletes all your data and returns you to onboarding. Continue?')) resetAll();
  };

  const links = [
    { path: '/goals', label: 'Goals', icon: Target, color: colors.violet },
    { path: '/achievements', label: 'Achievements', icon: Trophy, color: colors.premiumGold },
    { path: '/calendar', label: 'Study Calendar', icon: Calendar, color: colors.blue },
    { path: '/weekly-review', label: 'Weekly Review', icon: TrendingUp, color: colors.emerald },
    { path: '/journey', label: 'Your Journey', icon: Compass, color: colors.violet },
    { path: '/settings', label: 'Settings', icon: Settings, color: colors.textDim },
  ];

  return (
    <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>
      <div style={textStyles.screenTitle()}>Profile</div>
      <div style={{ height: 20 }} />

      <div style={{ marginBottom: 16 }}>
        <AppCard onTap={isPro ? undefined : () => navigate('/pro')} padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isPro ? <BadgeCheck size={20} color={colors.premiumGold} aria-hidden="true" /> : <Star size={20} color={colors.textFaint} aria-hidden="true" />}
            <div style={{ flex: 1 }}>
              <span style={textStyles.cardTitle(isPro ? colors.premiumGold : colors.text)}>{isPro ? 'PREPIFY PRO' : 'Free Plan'}</span>
              <div style={{ height: 2 }} />
              <span style={textStyles.meta()}>{isPro ? 'All Premium features unlocked' : 'Upgrade for full access'}</span>
            </div>
            {!isPro ? <ChevronRight size={16} color={colors.textFaint} /> : null}
          </div>
        </AppCard>
      </div>

      {links.map((link) => (
        <div key={link.path} style={{ marginBottom: 10 }}>
          <AppCard onTap={() => navigate(link.path)} padding={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <link.icon size={18} color={link.color} aria-hidden="true" />
              <span style={{ ...textStyles.cardTitle(), flex: 1 }}>{link.label}</span>
              <ChevronRight size={16} color={colors.textFaint} />
            </div>
          </AppCard>
        </div>
      ))}
      <div style={{ height: 6 }} />

      <AppCard style={{ marginBottom: 16 }}>
        <Row label="Level" value={profile?.level} />
        <Row label="Target band" value={profile?.target} />
        <Row label="Exam timing" value={profile?.examDate} />
        <Row label="Daily study time" value={profile?.dailyTime} />
        <Row label="Weak skills" value={profile?.weakSkills?.join(', ') || 'None selected'} isLast />
      </AppCard>
      <button onClick={handleReset} style={{ ...textStyles.body(colors.error), padding: '8px 0' }}>Reset all data</button>
    </div>
  );
}
function Row({ label, value, isLast }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: isLast ? 'none' : `1px solid ${colors.border}` }}>
      <span style={textStyles.bodyDim()}>{label}</span>
      <span style={textStyles.cardTitle()}>{value || '—'}</span>
    </div>
  );
}
