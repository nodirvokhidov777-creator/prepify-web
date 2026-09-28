import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import PracticeFilterChip from '../../../shared/components/PracticeFilterChip';
import { vocabularyCatalog } from '../data/vocabularyCatalog';
import { loadAllVocabularyProgress } from '../data/vocabularyRepository';
import { VocabularyLearningState, VocabularyFilter, learningStateLabel } from '../models/vocabularyModels';
import { searchVocabulary, filterVocabularyByState } from '../engines/vocabularyEngine';

const stateColor = {
  [VocabularyLearningState.NEW]: colors.textFaint,
  [VocabularyLearningState.LEARNING]: colors.blue,
  [VocabularyLearningState.FAMILIAR]: colors.amber,
  [VocabularyLearningState.MASTERED]: colors.emerald,
};

const filterOptions = [
  { value: VocabularyFilter.ALL, label: 'All' },
  { value: VocabularyFilter.NEEDS_REVIEW, label: 'Needs Review' },
  { value: VocabularyFilter.NEW, label: 'New' },
  { value: VocabularyFilter.LEARNING, label: 'Learning' },
  { value: VocabularyFilter.FAMILIAR, label: 'Familiar' },
  { value: VocabularyFilter.MASTERED, label: 'Mastered' },
];

export default function VocabularyBankScreen() {
  const navigate = useNavigate();
  const [progressMap, setProgressMap] = useState({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(VocabularyFilter.ALL);

  useEffect(() => {
    setProgressMap(loadAllVocabularyProgress());
  }, []);

  const masteredCount = vocabularyCatalog.filter((w) => progressMap[w.id]?.learningState === VocabularyLearningState.MASTERED).length;

  const visible = useMemo(() => {
    const searched = searchVocabulary(vocabularyCatalog, query);
    return filterVocabularyByState(searched, filter, progressMap);
  }, [query, filter, progressMap]);

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Vocabulary Bank</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 16 }}>
        <span style={textStyles.bodyDim()}>
          {masteredCount} of {vocabularyCatalog.length} words mastered.
        </span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <AppButton label="Practice Session" onClick={() => navigate('/practice/vocabulary/practice')} />
      </div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={16} color={colors.textFaint} style={{ position: 'absolute', left: 12, top: 12 }} aria-hidden="true" />
        <label htmlFor="vocab-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          Search vocabulary
        </label>
        <input
          id="vocab-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words, definitions, tags…"
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.surfaceAlt, ...textStyles.body() }}
        />
      </div>

      <div role="group" aria-label="Filter by learning state" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {filterOptions.map((opt) => (
          <PracticeFilterChip key={opt.value} label={opt.label} selected={filter === opt.value} onClick={() => setFilter(opt.value)} />
        ))}
      </div>

      {visible.length === 0 ? (
        <AppCard>
          <span style={textStyles.bodyDim()}>No words match this search/filter.</span>
        </AppCard>
      ) : (
        visible.map((word) => {
          const progress = progressMap[word.id];
          const state = progress?.learningState ?? VocabularyLearningState.NEW;
          return (
            <div key={word.id} style={{ marginBottom: 10 }}>
              <AppCard padding={14}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>{word.word}</h2>
                      <span style={textStyles.meta()}>{word.partOfSpeech}</span>
                    </div>
                    <div style={{ height: 3 }} />
                    <div style={{ ...textStyles.bodyDim(), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{word.definition}</div>
                  </div>
                  <span style={{ padding: '3px 9px', borderRadius: 999, background: `${stateColor[state]}1F`, ...textStyles.meta(stateColor[state]) }}>{learningStateLabel(state)}</span>
                </div>
              </AppCard>
            </div>
          );
        })
      )}
    </div>
  );
}
