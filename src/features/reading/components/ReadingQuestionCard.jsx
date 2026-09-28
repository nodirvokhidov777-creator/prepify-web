import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import { readingQuestionTypeLabel } from '../models/readingModels';

/**
 * Renders both question types the engine supports (trueFalseNotGiven,
 * multipleChoice) — both share the same options/correctAnswer shape, so
 * no type-specific rendering branch is needed.
 */
export default function ReadingQuestionCard({ question, index, selectedAnswer, onSelect, revealAnswer = false }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ ...textStyles.label(), margin: 0 }}>
        Question {index + 1} · {readingQuestionTypeLabel(question.type)}
      </h3>
      <div style={{ height: 8 }} />
      <p style={{ ...textStyles.body(), margin: 0 }}>{question.prompt}</p>
      <div style={{ height: 12 }} />
      <div role="radiogroup" aria-label={`Answer options for question ${index + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === question.correctAnswer;

          let bg = colors.surfaceAlt;
          let border = colors.border;
          let fg = colors.text;
          let statusLabel = '';

          if (revealAnswer) {
            if (isCorrectOption) {
              bg = colors.emeraldSoft;
              border = colors.emerald;
              fg = colors.emerald;
              statusLabel = ' (correct answer)';
            } else if (isSelected) {
              bg = colors.errorSoft;
              border = colors.error;
              fg = colors.error;
              statusLabel = ' (your answer, incorrect)';
            }
          } else if (isSelected) {
            bg = colors.violetSoft;
            border = colors.violet;
            fg = colors.violet;
          }

          return (
            <button
              key={option}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option}${statusLabel}`}
              onClick={() => !revealAnswer && onSelect(option)}
              disabled={revealAnswer}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 12,
                background: bg,
                border: `1.5px solid ${border}`,
                outlineOffset: 2,
                ...textStyles.body(fg),
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
      {revealAnswer ? (
        <div style={{ marginTop: 10, padding: 12, background: colors.surfaceAlt, borderRadius: 12 }}>
          <span style={textStyles.meta()}>{question.explanation}</span>
        </div>
      ) : null}
    </div>
  );
}
