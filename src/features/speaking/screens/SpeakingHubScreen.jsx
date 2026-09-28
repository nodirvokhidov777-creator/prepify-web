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
import { speakingSessionCatalog } from '../data/speakingSessionCatalog';
import { loadAttemptedSessionIds } from '../data/speakingRepository';
import { SpeakingPart, speakingPartLabel, speakingPartIcon, speakingPartAccent } from '../models/speakingModels';

const FILTERS = { ALL: 'all', PART1: 'part1', PART2: 'part2', PART3: 'part3', BASIC: 'basic', PREMIUM: 'premium' };

export default function SpeakingHubScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [entitlements, setEntitlements] = useState({ isPro: false });

  useEffect(() => {
    setAttemptedIds(loadAttemptedSessionIds());
    setEntitlements(loadEntitlements());
  }, []);

  const counts = {
    part1: speakingSessionCatalog.filter((s) => s.part === SpeakingPart.PART1).length,
    part2: speakingSessionCatalog.filter((s) => s.part === SpeakingPart.PART2).length,
    part3: speakingSessionCatalog.filter((s) => s.part === SpeakingPart.PART3).length,
    basic: speakingSessionCatalog.filter((s) => tierOf(s.id) === ContentTier.BASIC).length,
    premium: speakingSessionCatalog.filter((s) => tierOf(s.id) === ContentTier.PREMIUM).length,
  };

  const visible = speakingSessionCatalog.filter((s) => {
    if (filter === FILTERS.PART1) return s.part === SpeakingPart.PART1;
    if (filter === FILTERS.PART2) return s.part === SpeakingPart.PART2;
    if (filter === FILTERS.PART3) return s.part === SpeakingPart.PART3;
    if (filter === FILTERS.BASIC) return tierOf(s.id) === ContentTier.BASIC;
    if (filter === FILTERS.PREMIUM) return tierOf(s.id) === ContentTier.PREMIUM;
    return true;
  });

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Speaking</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 14 }}>
        <span style={textStyles.bodyDim()}>{speakingSessionCatalog.length} sessions across Parts 1–3.</span>
      </div>

      <div role="group" aria-label="Filter sessions" style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <PracticeFilterChip label={`All (${speakingSessionCatalog.length})`} selected={filter === FILTERS.ALL} onClick={() => setFilter(FILTERS.ALL)} />
        <PracticeFilterChip label={`Part 1 (${counts.part1})`} selected={filter === FILTERS.PART1} onClick={() => setFilter(FILTERS.PART1)} />
        <PracticeFilterChip label={`Part 2 (${counts.part2})`} selected={filter === FILTERS.PART2} onClick={() => setFilter(FILTERS.PART2)} />
        <PracticeFilterChip label={`Part 3 (${counts.part3})`} selected={filter === FILTERS.PART3} onClick={() => setFilter(FILTERS.PART3)} />
        <PracticeFilterChip label={`Basic (${counts.basic})`} selected={filter === FILTERS.BASIC} onClick={() => setFilter(FILTERS.BASIC)} />
        <PracticeFilterChip label={`Premium (${counts.premium})`} selected={filter === FILTERS.PREMIUM} onClick={() => setFilter(FILTERS.PREMIUM)} />
      </div>

      {[SpeakingPart.PART1, SpeakingPart.PART2, SpeakingPart.PART3].map((part) => {
        const sessions = visible.filter((s) => s.part === part);
        if (sessions.length === 0) return null;
        const Icon = speakingPartIcon(part);
        const accent = speakingPartAccent(part);
        return (
          <div key={part} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Icon size={13} color={accent} aria-hidden="true" />
              <h2 style={{ ...textStyles.label(accent), margin: 0 }}>{speakingPartLabel(part)}</h2>
            </div>
            {sessions.map((session) => {
              const isPremium = tierOf(session.id) === ContentTier.PREMIUM;
              const accessible = isContentAccessible(session.id, entitlements);
              const attempted = attemptedIds.has(session.id);
              return (
                <div key={session.id} style={{ marginBottom: 12 }}>
                  <AppCard onTap={() => navigate(`/practice/speaking/preview/${session.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ ...textStyles.cardTitle(), margin: 0 }}>{session.title}</h3>
                          {isPremium ? <PremiumBadge locked={!accessible} /> : null}
                          {attempted ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: colors.emeraldSoft }}>
                              <CheckCircle2 size={10} color={colors.emerald} aria-hidden="true" />
                              <span style={{ ...textStyles.meta(colors.emerald), fontWeight: 700, fontSize: 9 }}>DONE</span>
                            </span>
                          ) : null}
                        </div>
                        <div style={{ height: 4 }} />
                        <div style={textStyles.bodyDim()}>{session.subtitle}</div>
                        <div style={{ height: 6 }} />
                        <span style={textStyles.meta()}>
                          {session.questions.length} question{session.questions.length === 1 ? '' : 's'} · {session.difficulty}
                        </span>
                      </div>
                      {accessible ? null : <Lock size={16} color={colors.textFaint} aria-label="Locked, Premium content" />}
                    </div>
                  </AppCard>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
