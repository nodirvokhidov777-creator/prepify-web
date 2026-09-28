import { colors, heroGradient } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';

/** Matches the real Flutter splash's animation beats conceptually — logo,
 * tagline, progress line — timed against AppStateContext's 1.5s delay. */
export default function SplashScreen() {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: heroGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ ...textStyles.screenTitle(colors.white), fontSize: 28 }}>P</span>
      </div>
      <div style={textStyles.heading()}>PREPIFY</div>
      <div style={textStyles.bodyDim()}>Your IELTS prep, personalized.</div>
      <div style={{ width: 120, height: 4, borderRadius: 4, background: colors.surfaceAlt, overflow: 'hidden', marginTop: 8 }}>
        <div style={{ width: '60%', height: '100%', background: colors.violet, animation: 'prepify-loading 1.4s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes prepify-loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(220%); } }`}</style>
    </div>
  );
}
