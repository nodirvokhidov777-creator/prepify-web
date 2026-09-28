import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Lock } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import PracticeFilterChip from '../../../shared/components/PracticeFilterChip';
import PremiumBadge from '../../premium/PremiumBadge';
import { ContentTier, tierOf, isContentAccessible } from '../../premium/contentAccess';
import { loadEntitlements } from '../../premium/premiumRegistry';
import { listeningSessionsCatalog } from '../data/listeningSessionsCatalog';
import { loadAttemptedSessionIds } from '../data/listeningRepository';

const FILTERS = { ALL: 'all', BASIC: 'basic', PREMIUM: 'premium' };

export default function ListeningHubScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [entitlements, setEntitlements] = useState({ isPro: false });

  useEffect(() => {
    setAttemptedIds(loadAttemptedSessionIds());
    setEntitlements(loadEntitlements());
  }, []);

  const basicCount = listeningSessionsCatalog.filter((s) => tierOf(s.id) === ContentTier.BASIC).length;
  const premiumCount = listeningSessionsCatalog.filter((s) => tierOf(s.id) === ContentTier.PREMIUM).length;

  const visible = listeningSessionsCatalog.filter((s) => {
    const tier = tierOf(s.id);
    if (filter === FILTERS.BASIC) return tier === ContentTier.BASIC;
    if (filter === FILTERS.PREMIUM) return tier === ContentTier.PREMIUM;
    return true;
  });

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Listening</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 14 }}>
        <span style={textStyles.bodyDim()}>{listeningSessionsCatalog.length} original listening scenarios.</span>
      </div>

      <div role="group" aria-label="Filter sessions by tier" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <PracticeFilterChip label={`All (${listeningSessionsCatalog.length})`} selected={filter === FILTERS.ALL} onClick={() => setFilter(FILTERS.ALL)} />
        <PracticeFilterChip label={`Basic (${basicCount})`} selected={filter === FILTERS.BASIC} onClick={() => setFilter(FILTERS.BASIC)} />
        <PracticeFilterChip label={`Premium (${premiumCount})`} selected={filter === FILTERS.PREMIUM} onClick={() => setFilter(FILTERS.PREMIUM)} />
      </div>

      {visible.map((session) => {
        const isPremium = tierOf(session.id) === ContentTier.PREMIUM;
        const accessible = isContentAccessible(session.id, entitlements);
        const attempted = attemptedIds.has(session.id);
        return (
          <div key={session.id} style={{ marginBottom: 12 }}>
            <AppCard onTap={() => navigate(`/practice/listening/preview/${session.id}`)}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={textStyles.label()}>{session.difficulty}</span>
                    {isPremium ? <PremiumBadge locked={!accessible} /> : null}
                    {attempted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: colors.emeraldSoft }}>
                        <CheckCircle2 size={10} color={colors.emerald} aria-hidden="true" />
                        <span style={{ ...textStyles.meta(colors.emerald), fontWeight: 700, fontSize: 9 }}>DONE</span>
                      </span>
                    ) : null}
                  </div>
                  <div style={{ height: 4 }} />
                  <h2 style={{ ...textStyles.cardTitle(), margin: 0, fontSize: 15 }}>{session.title}</h2>
                  <div style={{ height: 4 }} />
                  <div style={{ ...textStyles.bodyDim(), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.subtitle}</div>
                  <div style={{ height: 6 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={textStyles.meta()}>{session.questions.length} questions</span>
                    <span aria-hidden="true" style={{ width: 3, height: 3, borderRadius: '50%', background: colors.textFaint }} />
                    <span style={textStyles.meta()}>~{session.durationMinutes} min</span>
                  </div>
                </div>
                {accessible ? null : <Lock size={16} color={colors.textFaint} aria-label="Locked, Premium content" />}
              </div>
            </AppCard>
          </div>
        );
      })}
    </div>
  );
}
