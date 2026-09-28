import { loadAllGoals } from '../goals/data/goalsRepository';
import { loadAllVocabularyProgress } from '../language/data/vocabularyRepository';
import { loadGrammarTopicStats } from '../language/data/grammarRepository';
import { loadAllUnlocked } from '../achievements/data/achievementsRepository';
import { buildExportJson } from './exportBuilder';

/**
 * Web equivalent of DataExportService.exportToLocalFile — a real local
 * file write isn't meaningful in a browser sandbox, so this triggers an
 * actual browser download of the same JSON structure instead. If
 * anything fails, this returns success:false with an honest message —
 * it never claims a download happened when it didn't.
 */
export function exportDataAsDownload(profile, progress) {
  try {
    const goals = loadAllGoals();
    const vocabularyProgress = loadAllVocabularyProgress();
    const grammarProgress = loadGrammarTopicStats();
    const achievements = loadAllUnlocked();

    const json = buildExportJson({
      profile, goals, progress, vocabularyProgress, grammarProgress, achievements,
      practiceSummary: progress.practiceSessionsCompleted,
      generatedAt: new Date(),
    });

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prepify_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Your data was downloaded as a JSON file.' };
  } catch {
    return { success: false, message: 'Export failed: the file could not be generated in this browser.' };
  }
}
