import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import { readingPassagesCatalog } from '../data/readingPassagesCatalog';
import { loadAttemptedPassageIds } from '../data/readingRepository';

/**
 * Combined Hub/Library — with only 7 real passages, a separate landing
 * screen before the list would be an empty extra tap. Shows every
 * passage with its real title, difficulty, question count, and a real
 * "DONE" badge sourced from actual ReadingAttemptRecord data — never
 * fabricated. No passage here is Premium; the Flutter source registers
 * zero Premium Reading content, so no badge or lock ever appears.
 */
export default function ReadingHubScreen() {
  const navigate = useNavigate();
  const [attemptedIds, setAttemptedIds] = useState(new Set());

  useEffect(() => {
    setAttemptedIds(loadAttemptedPassageIds());
  }, []);

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Reading</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 20 }}>
        <span style={textStyles.bodyDim()}>{readingPassagesCatalog.length} original passages across topics and difficulty.</span>
      </div>

      {readingPassagesCatalog.map((passage) => {
        const attempted = attemptedIds.has(passage.id);
        return (
          <div key={passage.id} style={{ marginBottom: 12 }}>
            <AppCard onTap={() => navigate(`/practice/reading/preview/${passage.id}`)}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={textStyles.label()}>{passage.subtitle}</span>
                    {attempted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: colors.emeraldSoft }}>
                        <CheckCircle2 size={10} color={colors.emerald} aria-hidden="true" />
                        <span style={{ ...textStyles.meta(colors.emerald), fontWeight: 700, fontSize: 9 }}>DONE</span>
                      </span>
                    ) : null}
                  </div>
                  <div style={{ height: 4 }} />
                  <h2 style={{ ...textStyles.cardTitle(), margin: 0, fontSize: 15 }}>{passage.title}</h2>
                  <div style={{ height: 6 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={textStyles.meta(colors.violet)}>{passage.difficulty}</span>
                    <Dot />
                    <span style={textStyles.meta()}>{passage.questions.length} questions</span>
                    <Dot />
                    <span style={textStyles.meta()}>~{passage.estimatedReadingMinutes} min</span>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>
        );
      })}
    </div>
  );
}

function Dot() {
  return <div aria-hidden="true" style={{ width: 3, height: 3, borderRadius: '50%', background: colors.textFaint }} />;
}
