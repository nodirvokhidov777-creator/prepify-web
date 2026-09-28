import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findReadingPassageById } from '../data/readingPassagesCatalog';

export default function ReadingPreviewScreen() {
  const { passageId } = useParams();
  const navigate = useNavigate();
  const passage = findReadingPassageById(passageId);

  if (!passage) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This passage is no longer available.</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0, fontSize: 17 }}>{passage.title}</h1>
      </div>
      <div style={{ height: 16 }} />

      <AppCard style={{ marginBottom: 16 }}>
        <span style={textStyles.label()}>{passage.subtitle}</span>
        <div style={{ height: 10 }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Stat label="Difficulty" value={passage.difficulty} />
          <Stat label="Questions" value={String(passage.questions.length)} />
          <Stat label="Est. time" value={`~${passage.estimatedReadingMinutes} min`} />
        </div>
      </AppCard>

      <AppButton label="Start Passage" onClick={() => navigate(`/practice/reading/session/${passage.id}`)} />
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
