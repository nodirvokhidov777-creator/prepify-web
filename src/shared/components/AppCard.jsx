import { colors } from '../../core/theme/colors';
import { radius, shadow } from '../../core/theme/spacing';
export default function AppCard({ children, onTap, padding = 20, style = {} }) {
  const isInteractive = typeof onTap === 'function';
  return (
    <div
      onClick={onTap}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onTap(e); } : undefined}
      style={{ background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}`, boxShadow: shadow.card, padding, cursor: isInteractive ? 'pointer' : 'default', transition: 'transform 120ms ease', ...style }}
      onMouseDown={(e) => { if (isInteractive) e.currentTarget.style.transform = 'scale(0.985)'; }}
      onMouseUp={(e) => { if (isInteractive) e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { if (isInteractive) e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </div>
  );
}
