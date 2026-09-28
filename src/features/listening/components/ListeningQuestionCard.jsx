import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import { ListeningQuestionType, listeningQuestionTypeLabel, isAnswerCorrect } from '../models/listeningModels';

export default function ListeningQuestionCard({ question, index, userAnswer, onChange, revealAnswer = false }) {
  const correct = revealAnswer && isAnswerCorrect(userAnswer, question);

  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ ...textStyles.label(), margin: 0 }}>
        Question {index + 1} · {listeningQuestionTypeLabel(question.type)}
      </h3>
      <div style={{ height: 8 }} />
      <p style={{ ...textStyles.body(), margin: 0 }}>{question.prompt}</p>
      <div style={{ height: 12 }} />

      {question.type === ListeningQuestionType.MULTIPLE_CHOICE ? (
        <div role="radiogroup" aria-label={`Answer options for question ${index + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map((option) => {
            const isSelected = userAnswer === option;
            const isCorrectOption = option === question.correctAnswer;
            let bg = colors.surfaceAlt, border = colors.border, fg = colors.text, statusLabel = '';
            if (revealAnswer) {
              if (isCorrectOption) { bg = colors.emeraldSoft; border = colors.emerald; fg = colors.emerald; statusLabel = ' (correct answer)'; }
              else if (isSelected) { bg = colors.errorSoft; border = colors.error; fg = colors.error; statusLabel = ' (your answer, incorrect)'; }
            } else if (isSelected) { bg = colors.violetSoft; border = colors.violet; fg = colors.violet; }
            return (
              <button
                key={option}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${option}${statusLabel}`}
                onClick={() => !revealAnswer && onChange(option)}
                disabled={revealAnswer}
                style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: bg, border: `1.5px solid ${border}`, outlineOffset: 2, ...textStyles.body(fg) }}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <label htmlFor={`answer-${question.id}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
            Your answer for question {index + 1}
          </label>
          <input
            id={`answer-${question.id}`}
            type="text"
            value={userAnswer ?? ''}
            onChange={(e) => !revealAnswer && onChange(e.target.value)}
            disabled={revealAnswer}
            placeholder="Type your answer"
            aria-invalid={revealAnswer && !correct}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: `1.5px solid ${revealAnswer ? (correct ? colors.emerald : colors.error) : colors.border}`,
              background: revealAnswer ? (correct ? colors.emeraldSoft : colors.errorSoft) : colors.surfaceAlt,
              ...textStyles.body(),
            }}
          />
          {revealAnswer && !correct ? (
            <div style={{ marginTop: 6 }}>
              <span style={textStyles.meta(colors.emerald)}>Correct answer: {question.correctAnswer}</span>
            </div>
          ) : null}
        </div>
      )}

      {revealAnswer ? (
        <div style={{ marginTop: 10, padding: 12, background: colors.surfaceAlt, borderRadius: 12 }}>
          <span style={textStyles.meta()}>{question.explanation}</span>
        </div>
      ) : null}
    </div>
  );
}
