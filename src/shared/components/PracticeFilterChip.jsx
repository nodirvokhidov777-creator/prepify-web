import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
export default function PracticeFilterChip({ label, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '9px 16px', borderRadius: 999, background: selected ? colors.violet : colors.surfaceAlt, border: `1px solid ${selected ? colors.violet : colors.border}`, ...textStyles.meta(selected ? colors.white : colors.textDim) }}>
      {label}
    </button>
  );
}
