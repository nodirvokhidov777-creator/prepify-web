import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, VolumeX } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import PremiumBadge from '../../premium/PremiumBadge';
import { ContentTier, tierOf, isContentAccessible } from '../../premium/contentAccess';
import { loadEntitlements } from '../../premium/premiumRegistry';
import { findListeningSessionById, LISTENING_AUDIO_AVAILABLE } from '../data/listeningSessionsCatalog';

export default function ListeningPreviewScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const session = findListeningSessionById(sessionId);
  const [entitlements, setEntitlements] = useState({ isPro: false });

  useEffect(() => {
    setEntitlements(loadEntitlements());
  }, []);

  if (!session) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This session is no longer available.</span>
      </div>
    );
  }

  const isPremium = tierOf(session.id) === ContentTier.PREMIUM;
  const accessible = isContentAccessible(session.id, entitlements);

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0, fontSize: 17 }}>{session.title}</h1>
      </div>
      <div style={{ height: 16 }} />

      {!LISTENING_AUDIO_AVAILABLE ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: colors.surfaceAlt, borderRadius: 14, marginBottom: 16 }}>
          <VolumeX size={18} color={colors.textDim} aria-hidden="true" />
          <span style={textStyles.meta()}>Audio playback isn't available for this session yet. You can still read the material and answer the questions.</span>
        </div>
      ) : null}

      <AppCard style={{ marginBottom: 16 }}>
        {isPremium ? (
          <div style={{ marginBottom: 10 }}>
            <PremiumBadge locked={!accessible} />
          </div>
        ) : null}
        <span style={textStyles.label()}>{session.subtitle}</span>
        <div style={{ height: 10 }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Stat label="Difficulty" value={session.difficulty} />
          <Stat label="Questions" value={String(session.questions.length)} />
          <Stat label="Est. time" value={`~${session.durationMinutes} min`} />
        </div>
      </AppCard>

      {accessible ? (
        <AppButton label="Start Session" onClick={() => navigate(`/practice/listening/session/${session.id}`)} />
      ) : (
        <AppButton label="Unlock with PREPIFY PRO" onClick={() => navigate('/pro')} />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={textStyles.meta()}>{label}</div>
      <div style={{ height: 2 }} />
      <div style={textStyles.cardTitle(colors.violet)}>{value}</div>
    </div>
  );
}
