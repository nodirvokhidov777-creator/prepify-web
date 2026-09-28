import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import PremiumBadge from '../../premium/PremiumBadge';
import { ContentTier, tierOf, isContentAccessible } from '../../premium/contentAccess';
import { loadEntitlements } from '../../premium/premiumRegistry';
import { findWritingTaskById } from '../data/writingTaskCatalog';
import { writingTaskBadge } from '../models/writingModels';

export default function WritingPreviewScreen() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const task = findWritingTaskById(promptId);
  const [entitlements, setEntitlements] = useState({ isPro: false });

  useEffect(() => {
    setEntitlements(loadEntitlements());
  }, []);

  if (!task) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This prompt is no longer available.</span>
      </div>
    );
  }

  const isPremium = tierOf(task.id) === ContentTier.PREMIUM;
  const accessible = isContentAccessible(task.id, entitlements);

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0, fontSize: 17 }}>{task.title}</h1>
      </div>
      <div style={{ height: 16 }} />

      <AppCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={textStyles.label()}>{writingTaskBadge(task.taskType)}</span>
          {isPremium ? <PremiumBadge locked={!accessible} /> : null}
        </div>
        <span style={textStyles.meta()}>{task.instructions}</span>
        <div style={{ height: 10 }} />
        <div style={{ ...textStyles.body(), whiteSpace: 'pre-line' }}>{task.prompt}</div>

        {task.dataTable ? (
          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <caption style={{ textAlign: 'left', ...textStyles.meta(), marginBottom: 6 }}>Data for this task</caption>
              <thead>
                <tr>
                  {task.dataTable.headers.map((h) => (
                    <th key={h} scope="col" style={{ textAlign: 'left', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...textStyles.label() }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {task.dataTable.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...textStyles.body() }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AppCard>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <Stat label="Minimum words" value={`${task.minimumWordCount}+`} />
        <Stat label="Recommended time" value={`${task.recommendedMinutes} min`} />
      </div>

      {accessible ? (
        <AppButton label="Start Writing" onClick={() => navigate(`/practice/writing/session/${task.id}`)} />
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
