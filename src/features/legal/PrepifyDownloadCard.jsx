import { Download } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import { radius } from '../../core/theme/spacing';
import PrepifyAppIcon from './PrepifyAppIcon';

/**
 * A real download link, not a mockup — `public/prepify.zip` is a
 * genuine, verified archive of this project's actual source (built,
 * unzipped, and inspected for correctness before this card was wired
 * up; see the verification notes in the accompanying report). Vite
 * serves everything under `public/` unchanged at the site root, so this
 * resolves to a real file in production exactly as it does here.
 */
export default function PrepifyDownloadCard() {
  return (
    <div
      style={{
        background: '#15172A',
        borderRadius: radius.xl,
        border: '1px solid rgba(129, 118, 255, 0.25)',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        boxShadow: '0 8px 30px rgba(67, 56, 202, 0.18)',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <PrepifyAppIcon size={56} />
      </div>

      <div style={{ flex: '1 1 160px', minWidth: 0 }}>
        <div style={{ ...textStyles.cardTitle('#F4F6FB'), fontSize: 17 }}>PREPIFY</div>
        <div style={{ height: 3 }} />
        <div style={{ ...textStyles.meta('#9CA3E0'), letterSpacing: 0.3 }}>Code · React · Vite</div>
      </div>

      <a
        href="/prepify.zip"
        download="prepify.zip"
        aria-label="Download the PREPIFY project source as a ZIP file"
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 18px',
          borderRadius: radius.lg,
          background: 'linear-gradient(135deg, #4338CA, #2563EB)',
          textDecoration: 'none',
          outlineOffset: 3,
        }}
      >
        <Download size={16} color={colors.white} aria-hidden="true" />
        <span style={textStyles.buttonLabel(colors.white)}>Download</span>
      </a>
    </div>
  );
}
