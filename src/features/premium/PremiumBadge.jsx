import { Lock, Star } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
export default function PremiumBadge({ locked = false }) {
  const Icon = locked ? Lock : Star;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: colors.premiumGoldSoft }}>
      <Icon size={11} color={colors.premiumGold} />
      <span style={{ ...textStyles.meta(colors.premiumGold), fontWeight: 700, fontSize: 10 }}>PREMIUM</span>
    </span>
  );
}
