/** Builds the export JSON structure from real data only. Pure: no I/O,
 * no secrets, no invented fields. Direct port of export_builder.dart. */
export function buildExportJson({ profile, goals, progress, vocabularyProgress, grammarProgress, achievements, practiceSummary, generatedAt }) {
  return { exportVersion: 1, generatedAt: generatedAt.toISOString(), profile, goals, progress, vocabularyProgress, grammarProgress, achievements, practiceSummary };
}
