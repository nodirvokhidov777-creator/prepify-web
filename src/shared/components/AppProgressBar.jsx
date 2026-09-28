import { colors } from '../../core/theme/colors';
export default function AppProgressBar({ value, max = 100, color = colors.violet, track = colors.surfaceAlt, height = 8 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ height, borderRadius: height, background: track, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct * 100}%`, background: color, transition: 'width 400ms ease' }} />
    </div>
  );
}
