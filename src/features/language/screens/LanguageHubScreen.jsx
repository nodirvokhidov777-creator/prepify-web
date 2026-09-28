import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, Brain } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import { vocabularyCatalog } from '../data/vocabularyCatalog';
import { grammarTopicsCatalog } from '../data/grammarCatalog';

export default function LanguageHubScreen() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Vocabulary &amp; Grammar</h1>
      </div>
      <div style={{ height: 20 }} />

      <div style={{ marginBottom: 12 }}>
        <AppCard onTap={() => navigate('/practice/vocabulary/bank')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: colors.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bookmark size={20} color={colors.violet} aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>Vocabulary</h2>
              <div style={{ height: 3 }} />
              <div style={textStyles.bodyDim()}>{vocabularyCatalog.length} words with example sentences.</div>
            </div>
            <ChevronRight size={18} color={colors.textFaint} />
          </div>
        </AppCard>
      </div>

      <AppCard onTap={() => navigate('/practice/grammar/topics')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: colors.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Brain size={20} color={colors.blue} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>Grammar</h2>
            <div style={{ height: 3 }} />
            <div style={textStyles.bodyDim()}>{grammarTopicsCatalog.length} topics covering common structures.</div>
          </div>
          <ChevronRight size={18} color={colors.textFaint} />
        </div>
      </AppCard>
    </div>
  );
}
