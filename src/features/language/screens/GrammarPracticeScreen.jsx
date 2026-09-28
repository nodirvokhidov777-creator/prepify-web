import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { findTopicById, questionsForTopic } from '../data/grammarCatalog';
import { recordMistake, recordAttempt } from '../data/grammarRepository';
import { grammarQuestionTypeLabel } from '../models/grammarModels';

export default function GrammarPracticeScreen() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = findTopicById(topicId);
  const [questions] = useState(() => questionsForTopic(topicId));

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!topic || questions.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This topic is no longer available.</span>
      </div>
    );
  }

  const question = questions[index];

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === question.correctAnswer;
    recordAttempt(topic.id, isCorrect);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      recordMistake({ questionId: question.id, topicId: topic.id, selectedAnswer: option, correctAnswer: question.correctAnswer });
    }
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) setFinished(true);
    else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (finished) {
    return (
      <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ ...textStyles.screenTitle(), margin: 0 }}>Topic Complete</h1>
        <div style={{ height: 4 }} />
        <div style={textStyles.bodyDim()}>{topic.title}</div>
        <div style={{ height: 16 }} />
        <AppCard style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={textStyles.label()}>SCORE</div>
          <div style={{ ...textStyles.bandDisplay(), marginTop: 6 }}>
            {correctCount}/{questions.length}
          </div>
        </AppCard>
        <AppButton label="Back to Topics" onClick={() => navigate('/practice/grammar/topics')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0, fontSize: 16 }}>{topic.title}</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 16 }}>
        <span style={textStyles.meta()}>
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <AppCard style={{ marginBottom: 16 }}>
        <h2 style={{ ...textStyles.label(), margin: 0 }}>KEY RULE</h2>
        <div style={{ height: 6 }} />
        <span style={textStyles.bodyDim()}>{topic.keyRule}</span>
      </AppCard>

      <AppCard>
        <span style={textStyles.label()}>{grammarQuestionTypeLabel(question.type)}</span>
        <div style={{ height: 8 }} />
        <p style={{ ...textStyles.body(), margin: 0 }}>{question.prompt}</p>
        <div style={{ height: 14 }} />
        <div role="radiogroup" aria-label="Answer options" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map((option) => {
            const isSelected = selected === option;
            const isCorrectOption = option === question.correctAnswer;
            let bg = colors.surfaceAlt, border = colors.border, fg = colors.text;
            if (selected) {
              if (isCorrectOption) { bg = colors.emeraldSoft; border = colors.emerald; fg = colors.emerald; }
              else if (isSelected) { bg = colors.errorSoft; border = colors.error; fg = colors.error; }
            }
            return (
              <button
                key={option}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleAnswer(option)}
                disabled={!!selected}
                style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: bg, border: `1.5px solid ${border}`, ...textStyles.body(fg) }}
              >
                {option}
              </button>
            );
          })}
        </div>
        {selected ? (
          <div style={{ marginTop: 14, padding: 12, background: colors.surfaceAlt, borderRadius: 12 }}>
            <span style={textStyles.meta()}>{question.explanation}</span>
          </div>
        ) : null}
      </AppCard>

      <div style={{ height: 20 }} />
      {selected ? <AppButton label={index + 1 >= questions.length ? 'Finish' : 'Next Question'} onClick={handleNext} /> : null}
    </div>
  );
}
