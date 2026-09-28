import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, CheckCircle2, Send, BadgeCheck } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import AppCard from '../../shared/components/AppCard';
import AppButton from '../../shared/components/AppButton';
import { loadEntitlements, loadOrCreateDeviceRefId, PREMIUM_MONTHLY_PRICE_DISPLAY } from './premiumRegistry';
import { buildTelegramPurchaseUrl, TELEGRAM_HANDLE } from './telegramContact';

const proFeatures = [
  'Advanced Analytics — full per-skill breakdown and trends',
  'Unlimited Mock Exams',
  'Full PREPIFY Journey insights',
  'Data export',
];

/**
 * "Premium Access Required" surface. Note: this project has no modal
 * component for Premium gating — every locked Preview screen navigates
 * here as a full screen instead (e.g. Listening/Writing/Speaking
 * Preview's "Unlock with PREPIFY PRO" button). This screen is that
 * surface's existing home; its benefits list and layout are unchanged
 * from before this update — only the call-to-action below is new.
 */
export default function ProUpgradeScreen() {
  const navigate = useNavigate();
  const [isPro, setIsPro] = useState(false);
  const [deviceRefId, setDeviceRefId] = useState('');

  useEffect(() => {
    setIsPro(loadEntitlements().isPro);
    setDeviceRefId(loadOrCreateDeviceRefId());
  }, []);

  const handleUpgrade = () => {
    // Opens a real conversation with the approved manual-sales contact —
    // never completes or claims a payment. Premium is only ever turned
    // on later, out-of-band, once that conversation results in a real
    // payment being confirmed by a person, not by this button.
    window.open(buildTelegramPurchaseUrl(deviceRefId), '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>PREPIFY PRO</h1>
      </div>
      <div style={{ height: 20 }} />

      {isPro ? (
        <AppCard style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <BadgeCheck size={22} color={colors.premiumGold} aria-hidden="true" />
          <div>
            <div style={textStyles.cardTitle()}>You're already Premium</div>
            <div style={{ height: 2 }} />
            <span style={textStyles.bodyDim()}>All PRO features below are unlocked on this device.</span>
          </div>
        </AppCard>
      ) : null}

      <AppCard>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={textStyles.cardTitle()}>What PRO unlocks</div>
          {!isPro ? <span style={textStyles.cardTitle(colors.premiumGold)}>{PREMIUM_MONTHLY_PRICE_DISPLAY}</span> : null}
        </div>
        <div style={{ height: 14 }} />
        {proFeatures.map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <CheckCircle2 size={16} color={colors.violet} style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
            <span style={textStyles.body()}>{f}</span>
          </div>
        ))}
      </AppCard>

      {!isPro ? (
        <>
          <div style={{ height: 16 }} />
          <div style={{ background: colors.surfaceAlt, borderRadius: 14, padding: 14, display: 'flex', gap: 10 }}>
            <Info size={16} color={colors.textDim} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span style={textStyles.meta()}>
              PREPIFY PRO is {PREMIUM_MONTHLY_PRICE_DISPLAY}. Automated payment isn't set up yet, so upgrading opens
              a chat with {TELEGRAM_HANDLE} on Telegram to arrange payment directly — no charge happens in this
              app, and Premium is only turned on for your device after that's confirmed.
            </span>
          </div>

          <div style={{ height: 10 }} />
          <div style={{ padding: '10px 14px', borderRadius: 10, background: colors.surfaceAlt }}>
            <span style={textStyles.meta()}>
              Your PREPIFY ID (share this in the chat so your Premium can be linked to this device):
            </span>
            <div style={{ height: 4 }} />
            <span style={textStyles.cardTitle(colors.violet)}>{deviceRefId}</span>
          </div>

          <div style={{ height: 20 }} />
          <AppButton label={`Upgrade to Premium — ${PREMIUM_MONTHLY_PRICE_DISPLAY}`} trailingIcon={Send} onClick={handleUpgrade} />
          <div style={{ height: 10 }} />
          <AppButton label="Maybe Later" variant="ghost" onClick={() => navigate(-1)} />
        </>
      ) : (
        <>
          <div style={{ height: 20 }} />
          <AppButton label="Back" variant="secondary" onClick={() => navigate(-1)} />
        </>
      )}
    </div>
  );
}
