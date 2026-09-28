import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { radius } from '../../core/theme/spacing';
export default function AppButton({ label, onClick, variant = 'primary', trailingIcon: TrailingIcon, fullWidth = true, disabled = false }) {
  let bg = colors.violet, fg = colors.white, border = 'none';
  if (variant === 'secondary') { bg = colors.surfaceRaised; fg = colors.text; border = `1px solid ${colors.borderStrong}`; }
  else if (variant === 'ghost') { bg = 'transparent'; fg = colors.textDim; border = `1px solid ${colors.border}`; }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ width: fullWidth ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px 20px', borderRadius: radius.lg, background: bg, border, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'transform 120ms ease' }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <span style={textStyles.buttonLabel(fg)}>{label}</span>
      {TrailingIcon ? <TrailingIcon size={17} color={fg} /> : null}
    </button>
  );
}
