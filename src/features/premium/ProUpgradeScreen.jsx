import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, CheckCircle2, Send, BadgeCheck, RefreshCw } from 'lucide-react';
import { colors } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import AppCard from '../../shared/components/AppCard';
import AppButton from '../../shared/components/AppButton';
import { PREMIUM_MONTHLY_PRICE_DISPLAY } from './premiumRegistry';
import { useEntitlements } from './EntitlementContext';
import { buildTelegramPurchaseUrl, TELEGRAM_HANDLE } from './telegramContact';

const proFeatures = [
  'Advanced Analytics — full per-skill breakdown and trends',
  'Unlimited Mock Exams',
  'Full PREPIFY Journey insights',
  'Data export',
];

const RESTORE_MESSAGES = {
  invalid_id: "That doesn't look like a PREPIFY ID. It looks like PRP-XXXXXXXX-XXXXXX.",
  not_found: 'No PRO access was found for that ID.',
  expired: 'That ID had monthly PRO, but it has expired.',
  revoked: 'PRO access for that ID is no longer active.',
  unavailable: "We couldn't reach the access service. Please try again in a moment.",
  rate_limited: 'Too many attempts. Please wait a minute and try again.',
};

/**
 * "Premium Access Required" surface. This project has no modal for it —
 * every locked Preview screen navigates here as a full screen (e.g. the
 * "Unlock with PREPIFY PRO" button). PRO status shown here comes from the
 * server, never from anything stored in the browser.
 */
export default function ProUpgradeScreen() {
  const navigate = useNavigate();
  const { isPro, plan, expiresAt, accessStatus, loading, unavailable, customerId, refresh, restore } = useEntitlements();
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreMessage, setRestoreMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleUpgrade = () => {
    // Opens a real conversation with the approved manual-sales contact —
    // it never completes or claims a payment. PRO is only ever switched on
    // by the server, after that conversation results in a confirmed payment.
    window.open(buildTelegramPurchaseUrl(customerId), '_blank', 'noopener,noreferrer');
  };

  const handleRestore = async () => {
    setBusy(true);
    setRestoreMessage('');
    const outcome = await restore(restoreInput);
    setBusy(false);
    if (outcome.ok) {
      setRestoreInput('');
      setRestoreMessage('PRO access restored on this device.');
    } else {
      setRestoreMessage(RESTORE_MESSAGES[outcome.reason] ?? RESTORE_MESSAGES.unavailable);
    }
  };

  const handleRetry = async () => {
    setBusy(true);
    await refresh();
    setBusy(false);
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
            <span style={textStyles.bodyDim()}>
              {plan === 'lifetime'
                ? 'Lifetime access — all PRO features are unlocked.'
                : `Monthly PRO — active until ${new Date(expiresAt).toLocaleDateString()}.`}
            </span>
          </div>
        </AppCard>
      ) : null}

      {!isPro && unavailable ? (
        <div role="status" style={{ background: colors.surfaceAlt, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <span style={textStyles.meta()}>
            We couldn't verify your access right now, so you're on the free plan for the moment. Everything free still
            works. If you already have PRO, try again shortly.
          </span>
          <div style={{ height: 10 }} />
          <AppButton label="Try again" variant="secondary" trailingIcon={RefreshCw} onClick={handleRetry} disabled={busy} fullWidth={false} />
        </div>
      ) : null}

      {!isPro && !unavailable && accessStatus === 'expired' ? (
        <div role="status" style={{ background: colors.surfaceAlt, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <span style={textStyles.meta()}>Your monthly PRO access has expired. You can renew it below.</span>
        </div>
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

      {!loading && customerId ? (
        <>
          <div style={{ height: 10 }} />
          <div style={{ padding: '10px 14px', borderRadius: 10, background: colors.surfaceAlt }}>
            <span style={textStyles.meta()}>
              {isPro
                ? 'Your PREPIFY ID — keep it somewhere safe. You can use it to restore PRO on another device:'
                : 'Your PREPIFY ID (share this in the chat so your Premium can be linked to this device):'}
            </span>
            <div style={{ height: 4 }} />
            <span style={textStyles.cardTitle(colors.violet)}>{customerId}</span>
          </div>
        </>
      ) : null}

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

          <div style={{ height: 20 }} />
          <AppButton label={`Upgrade to Premium — ${PREMIUM_MONTHLY_PRICE_DISPLAY}`} trailingIcon={Send} onClick={handleUpgrade} />
          <div style={{ height: 10 }} />
          <AppButton label="Maybe Later" variant="ghost" onClick={() => navigate(-1)} />

          <div style={{ height: 28 }} />
          <AppCard>
            <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>Already purchased? Restore access</h2>
            <div style={{ height: 6 }} />
            <span style={textStyles.bodyDim()}>
              Using a new device or cleared your browser data? Enter the PREPIFY ID you used when you bought PRO.
            </span>
            <div style={{ height: 12 }} />
            <label htmlFor="restore-id" style={{ ...textStyles.label(), display: 'block', marginBottom: 6 }}>PREPIFY ID</label>
            <input
              id="restore-id"
              type="text"
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              placeholder="PRP-XXXXXXXX-XXXXXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="restore-feedback"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.surfaceAlt, ...textStyles.body() }}
            />
            <div id="restore-feedback" role="status" style={{ minHeight: 20, marginTop: 8 }}>
              {restoreMessage ? <span style={textStyles.meta(restoreMessage.startsWith('PRO access restored') ? colors.emerald : colors.textDim)}>{restoreMessage}</span> : null}
            </div>
            <div style={{ height: 6 }} />
            <AppButton label={busy ? 'Checking…' : 'Restore access'} variant="secondary" onClick={handleRestore} disabled={busy || restoreInput.trim() === ''} />
          </AppCard>
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
