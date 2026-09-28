import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import { grammarTopicsCatalog } from '../data/grammarCatalog';
import { loadGrammarTopicStats, loadGrammarMistakes } from '../data/grammarRepository';
import { computeTopicInsight } from '../engines/grammarEngine';

export default function GrammarTopicsScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [mistakes, setMistakes] = useState([]);

  useEffect(() => {
    setStats(loadGrammarTopicStats());
    setMistakes(loadGrammarMistakes());
  }, []);

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Grammar Topics</h1>
      </div>
      <div style={{ height: 16 }} />

      {grammarTopicsCatalog.map((topic) => {
        const stat = stats[topic.id];
        // Null means "not enough data yet" — computeTopicInsight itself
        // enforces the 5-attempt minimum before ever calling a topic weak.
        const insight = stat ? computeTopicInsight(stat, mistakes) : null;
        return (
          <div key={topic.id} style={{ marginBottom: 12 }}>
            <AppCard onTap={() => navigate(`/practice/grammar/topic/${topic.id}`)}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={textStyles.label()}>{topic.category}</span>
                  <div style={{ height: 4 }} />
                  <h2 style={{ ...textStyles.cardTitle(), margin: 0 }}>{topic.title}</h2>
                  <div style={{ height: 4 }} />
                  <div style={textStyles.bodyDim()}>{topic.description}</div>
                  <div style={{ height: 6 }} />
                  <span style={textStyles.meta(colors.violet)}>{stat ? `${stat.correctCount}/${stat.totalCount} correct` : 'Not started yet'}</span>
                  {insight ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <AlertCircle size={12} color={colors.amber} aria-hidden="true" />
                      <span style={textStyles.meta(colors.amber)}>Worth reviewing — {Math.round(insight.accuracy * 100)}% accuracy so far</span>
                    </div>
                  ) : null}
                </div>
                <ChevronRight size={18} color={colors.textFaint} />
              </div>
            </AppCard>
          </div>
        );
      })}
    </div>
  );
}
