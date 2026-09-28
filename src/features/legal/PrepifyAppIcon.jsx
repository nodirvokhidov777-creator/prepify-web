import { colors } from '../../core/theme/colors';

/**
 * A custom-drawn icon (not a stock lucide glyph) combining an open book
 * with a small graduation-cap accent, rendered in the app's own real
 * hero gradient — reuses existing design tokens rather than inventing a
 * new palette.
 */
export default function PrepifyAppIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="PREPIFY app icon">
      <defs>
        <linearGradient id="prepify-icon-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.violet} />
          <stop offset="100%" stopColor={colors.blue} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#prepify-icon-gradient)" />
      {/* Open book */}
      <path
        d="M14 22c5-2.5 10-2.5 14 0v18c-4-2.5-9-2.5-14 0V22Z"
        fill="rgba(255,255,255,0.95)"
      />
      <path
        d="M50 22c-5-2.5-10-2.5-14 0v18c4-2.5 9-2.5 14 0V22Z"
        fill="rgba(255,255,255,0.75)"
      />
      <path d="M32 22v18" stroke={colors.violet} strokeWidth="1.5" opacity="0.4" />
      {/* Small graduation-cap accent, top right */}
      <g transform="translate(40, 10)">
        <path d="M9 0 L18 4 L9 8 L0 4 Z" fill={colors.premiumGold} />
        <path d="M4.5 5.8 V10 C4.5 11.4 6.5 12.5 9 12.5 C11.5 12.5 13.5 11.4 13.5 10 V5.8" stroke={colors.premiumGold} strokeWidth="1.4" fill="none" />
      </g>
    </svg>
  );
}
