import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import AppCard from './AppCard';
export function EmptyState({ message, icon: Icon }) {
  return (
    <AppCard>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: '12px 0' }}>
        {Icon ? <Icon size={28} color={colors.textFaint} /> : null}
        <span style={textStyles.bodyDim()}>{message}</span>
      </div>
    </AppCard>
  );
}
export function LoadingState({ label = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 0' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `3px solid ${colors.surfaceAlt}`, borderTopColor: colors.violet, animation: 'prepify-spin 0.8s linear infinite' }} />
      <span style={textStyles.meta()}>{label}</span>
      <style>{`@keyframes prepify-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
export function ErrorState({ message = "Something didn't load correctly.", onRetry }) {
  return (
    <AppCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={textStyles.body(colors.error)}>{message}</span>
        {onRetry ? <button onClick={onRetry} style={textStyles.meta(colors.violet)}>Try again</button> : null}
      </div>
    </AppCard>
  );
}
