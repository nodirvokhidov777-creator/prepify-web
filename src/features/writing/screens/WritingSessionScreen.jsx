import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import AppButton from '../../../shared/components/AppButton';
import { isContentAccessible, isPremiumContent } from '../../premium/contentAccess';
import { useEntitlements } from '../../premium/EntitlementContext';
import { LoadingState } from '../../../shared/components/StateViews';
import { findWritingTaskById } from '../data/writingTaskCatalog';
import { findDraftForTask, saveResponse } from '../data/writingRepository';

function countWords(text) {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

export default function WritingSessionScreen() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const task = findWritingTaskById(promptId);

  const [responseId] = useState(() => `writing_${promptId}_${Date.now()}`);
  const [text, setText] = useState('');
  const [startedAt] = useState(() => new Date());
  const [savedAt, setSavedAt] = useState(null);

  // Gate on stable booleans (not the context object) so a background
  // entitlement refresh can never re-run the draft restore and overwrite text
  // the user is typing. Free prompts never wait on the entitlement check.
  const entitlements = useEntitlements();
  const accessPending = !!task && isPremiumContent(task.id) && entitlements.loading;
  const locked = !!task && !accessPending && !isContentAccessible(task.id, entitlements);
  useEffect(() => {
    if (locked) navigate('/pro', { replace: true });
  }, [locked, navigate]);

  useEffect(() => {
    if (!task || accessPending || locked) return;
    const draft = findDraftForTask(task.id);
    if (draft) setText(draft.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, accessPending, locked]);

  const wordCount = useMemo(() => countWords(text), [text]);
  const meetsMinimum = task ? wordCount >= task.minimumWordCount : false;

  useEffect(() => {
    if (!task || accessPending || locked) return;
    const handle = setTimeout(() => {
      saveResponse({
        id: responseId,
        taskId: task.id,
        taskTitle: task.title,
        taskType: task.taskType,
        text,
        wordCount,
        startedAt: startedAt.toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        completedAt: null,
        status: 'draft',
        timeSpentSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
      });
      setSavedAt(new Date());
    }, 1200);
    return () => clearTimeout(handle);
  }, [text, task, responseId, wordCount, startedAt, accessPending, locked]);

  if (!task) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This prompt is no longer available.</span>
      </div>
    );
  }

  if (accessPending || locked) return <LoadingState label="Checking your access…" />;

  const handleComplete = () => {
    const now = new Date();
    saveResponse({
      id: responseId,
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.taskType,
      text,
      wordCount,
      startedAt: startedAt.toISOString(),
      lastUpdatedAt: now.toISOString(),
      completedAt: now.toISOString(),
      status: 'completed',
      timeSpentSeconds: Math.round((now.getTime() - startedAt.getTime()) / 1000),
    });
    navigate(`/practice/writing/results/${task.id}`, { state: { wordCount, completedAt: now.toISOString() } });
  };

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0, fontSize: 16 }}>{task.title}</h1>
      </div>
      <div style={{ height: 16 }} />

      <AppCard style={{ marginBottom: 16 }}>
        <span style={textStyles.meta()}>{task.instructions}</span>
        <div style={{ height: 10 }} />
        <div style={{ ...textStyles.body(), whiteSpace: 'pre-line' }}>{task.prompt}</div>
        {task.dataTable ? (
          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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

      <label htmlFor="writing-response" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        Your written response
      </label>
      <textarea
        id="writing-response"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start writing your response here…"
        style={{
          width: '100%',
          minHeight: 300,
          padding: 16,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          resize: 'vertical',
          ...textStyles.body(),
          lineHeight: 1.6,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 20 }}>
        <span role="status" style={textStyles.meta(meetsMinimum ? colors.emerald : colors.textDim)}>
          {wordCount} / {task.minimumWordCount} words
        </span>
        <span style={textStyles.meta()}>{savedAt ? 'Draft saved' : ''}</span>
      </div>

      <AppButton label="Mark as Complete" onClick={handleComplete} disabled={wordCount === 0} />
    </div>
  );
}
