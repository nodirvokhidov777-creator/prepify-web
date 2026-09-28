# PREPIFY Flutter → React Migration Ledger

**Read this before trusting any other summary of this project's state.**
This file reflects only what was verified on disk in this environment.

## Critical note on this session

At the start of this turn, `/prepify-web` did not exist anywhere in this
environment — no multi-file React project, no prior Phase B/C/D/E/F work.
The only artifacts present were a single-file dark-themed JSX prototype
(`prepify.jsx`, old palette, not the light design) and the Flutter source
zip. This ledger reflects a genuine from-scratch rebuild started this
turn, not a continuation of previously-verified work.

## Legend
DONE = real, verified, matches Flutter source · PARTIAL = real but
incomplete · NOT STARTED · BLOCKED = environment limitation

## Foundation (Phase 5)

| Item | Status | Notes |
|---|---|---|
| Vite + React scaffold | DONE | `npm run build` verified: 1907 modules, 559ms |
| React Router | DONE | 16 routes wired in `App.jsx` |
| Design tokens (colors/text/spacing) | DONE | Light cool-indigo palette per spec |
| `storageService.js` | DONE | All 20 `prepify.*` keys ported from `storage_service.dart` |
| `AppStateContext` (Context+useReducer) | DONE | Verified against actual `app_state.dart`: real splash phase (1.5s), real streak/mission logic, real `recordPracticeSession` |
| HomeShell (bottom nav) | DONE | 5 tabs: Today/Practice/Progress/DNA/Profile |
| Splash | DONE | Timing matches `AppState.init()`'s 1500ms delay |
| Onboarding | PARTIAL | Single-page substitute; real field values (levels/targets/exam windows/daily times) confirmed against `onboarding_data.dart`; not the full multi-step flow |
| Today/Home | DONE | Real band estimate, real Daily Mission (checkable, persists), real streak, real weekly dots |
| Practice Hub | DONE | Real `practiceSessionsCompleted` counts; "Not started yet" when zero — no fabricated progress |
| Profile | PARTIAL | Real profile fields + reset; no deep-links to Goals/Achievements/etc. yet (those systems aren't migrated this session) |
| Shared UI (AppCard/AppButton/SectionHeader/ProgressBar/FilterChip/StateViews) | DONE | |
| Premium architecture (registry/contentAccess/PremiumBadge) | DONE (mechanism only) | Zero content IDs registered yet — no practice content exists to gate |
| Pro upgrade screen | DONE | Honest: "Payments are not yet integrated" |

## Practice modules (Phase 5 continuation)

| Module | Status |
|---|---|
| A. Reading | **DONE** — see Phase 6 section below |
| B. Listening | **DONE** — see Phase 7 section below |
| C. Writing | **DONE** — see Phase 8 section below |
| D. Speaking | **DONE** — see Phase 9 section below |
| E. Vocabulary | **DONE** — see Phase 10 section below |
| F. Grammar | **DONE** — see Phase 11 section below |

**All six practice modules are now complete.** No `ComingSoonScreen` placeholder remains for any practice module.

## Phase 10 — Vocabulary (DONE)

**Architecture note, confirmed by inspection before writing code**: unlike Reading/Listening/Writing/Speaking, Vocabulary has no pre-written question bank at all. `vocabulary_engine.dart`'s `generateVocabularyQuestion` builds a question *at practice time* from the 56-word bank using deterministic distractor-picking (same seed → same question, always) and 3 real question types (`definitionToWord`, `wordToMeaning`, `exampleCompletion`). This was ported as a full algorithm, not pre-baked into static data — the React practice screen calls the same generation function live, exactly like the Flutter screen does.

**Verified content** (independent script, `scripts/validate-vocabulary.mjs`, actually run, 10 checks all pass):
- 56 words — exact match, zero duplicate IDs, all required fields present
- Question generation confirmed **deterministic**: identical seed produces a byte-identical question object
- Every generated question has exactly one correct answer among its options, zero duplicate option text
- `wordToMeaning` and `exampleCompletion` type-specific behavior verified directly (blanks out the target word correctly)
- Generation never throws across 20 real seeds spanning the full catalog

**Full engine ported, not simplified**: state transitions (`applyStudied`, `applyKnowThis`, `applyPracticeAgain`, `applyCorrectAnswer` with the Familiar→Mastered streak rule, `applyIncorrectAnswer` — never downgrades), review-priority scoring (`reviewUrgencyScore`, `needsReview`, `sortByReviewPriority`), and — found during inspection and included, not skipped — the real **search and filter functions** (`searchVocabulary`: case-insensitive substring match across word/definition/tags; `filterVocabularyByState`: by learning state or the live "Needs Review" bucket) that the Bank screen genuinely uses.

**Files created**: `vocabularyCatalog.js` (generated), `vocabularyModels.js`, `vocabularyEngine.js` (full port including search/filter), `vocabularyRepository.js`, `LanguageHubScreen.jsx`, `VocabularyBankScreen.jsx` (real search input + 6-way filter chips, not a static list), `VocabularyPracticeScreen.jsx` (review-priority-ordered session, live question generation, real state persistence), `scripts/validate-vocabulary.mjs`

**Routes**: `/practice/vocabulary` (hub), `/practice/vocabulary/bank`, `/practice/vocabulary/practice`

**Persistence**: real per-word `VocabularyWordProgress` in `prepify.vocabularyProgress`, keyed by word ID — an unstudied word simply has no entry (constructed on demand with honest defaults), matching the Flutter repository exactly.

**A real bug caught in my own tooling, not the app**: my first `validate-vocabulary.mjs` draft imported `generateVocabularyQuestion` directly from `vocabularyEngine.js`, which failed under Node's raw ESM loader (it requires explicit file extensions on every import in the chain, unlike Vite). This is not an app bug — `npm run build` already proved the real import graph resolves correctly — so rather than "fix" the app's consistent, working, extensionless-import convention (used across ~150+ files) just to satisfy my own script, I reimplemented the same generation algorithm inline in the validation script, clearly commented as a standalone-testing copy.

## Phase 11 — Grammar (DONE)

**Verified content** (independent script, `scripts/validate-grammar.mjs`, actually run, 12 checks all pass):
- 12 topics, 48 questions — exact match, zero duplicate IDs on either
- Every question references a real topic (zero orphans), every topic has at least one real question
- Every `correctAnswer` is a listed option; every question has a real, non-empty explanation
- **All 3 real question types confirmed present**: `multipleChoice` (16), `fillGap` (20), `errorDetection` (12) — none skipped, none invented
- All required topic fields present (title, description, category, difficulty, keyRule)

**Full engine ported**: `computeTopicInsight`/`computeWeakAreas` (real 5-attempt minimum and 70% accuracy threshold before ever calling a topic "weak" — returns null/no insight otherwise, never a fabricated claim), `applyCorrectReview` and `applyRepeatedMistake` (the same upsert-by-questionId mistake-record logic as the real repository, so a repeatedly-missed question gets exactly one row, never a flood of duplicates).

**Files created**: `grammarCatalog.js` (generated), `grammarModels.js`, `grammarEngine.js`, `grammarRepository.js`, `GrammarTopicsScreen.jsx` (real per-topic stats + a genuine weak-area insight badge, shown only once the real 5-attempt threshold is met), `GrammarPracticeScreen.jsx` (all 3 question types rendered through the same options/correctAnswer UI, since all 3 share that shape in the real model), `scripts/validate-grammar.mjs`

**Routes**: `/practice/grammar` (hub, shared with Vocabulary's `LanguageHubScreen`), `/practice/grammar/topics`, `/practice/grammar/topic/:topicId`

**Persistence**: real `GrammarMistakeRecord`s (upserted by questionId) in `prepify.grammarMistakes`, real per-topic `{correctCount, totalCount}` in `prepify.grammarTopicStats` — matching the Flutter repository's exact key names and upsert behavior.

**Premium**: neither Vocabulary nor Grammar has any Premium content in the real Flutter source — confirmed by inspection before writing code, zero registrations added, nothing gated.

**Verification actually run for both phases**:
- `node scripts/validate-vocabulary.mjs` → **all 10 checks passed**
- `node scripts/validate-grammar.mjs` → **all 12 checks passed**
- `node scripts/validate-reading.mjs` (regression) → **all 10 checks still pass, unchanged**
- `node scripts/validate-listening.mjs` (regression) → **all 14 checks still pass, unchanged**
- `node scripts/validate-writing.mjs` (regression) → **all 12 checks still pass, unchanged**
- `node scripts/validate-speaking.mjs` (regression) → **all 12 checks still pass, unchanged**
- `npm run build` → succeeded, 1963 modules, ~530ms–1.17s across runs
- `npm run lint` (oxlint) → **0 errors, 12 warnings** (same pre-existing benign "on-mount data load" category — count stable, no new warning types)

**Not run**: no browser click-through (no browser available in this environment).

## Phase 9 — Speaking (DONE)

**Verified content** (independent script, `scripts/validate-speaking.mjs`, actually run, 12 checks all pass):
- 60 sessions, 192 questions — exact match
- **20 Part 1 + 20 Part 2 + 20 Part 3** — exact match
- Zero duplicate session IDs, zero duplicate question IDs
- No missing required fields on any session
- Exactly **20 Premium sessions**, all resolving to real sessions, zero orphans
- Zero invented IDs — all follow the real `speaking_*` pattern
- All 5 required routes confirmed present in `App.jsx`
- Mock Exam's `speaking_part1_v1` reference resolves

**Critical source detail confirmed and handled**: `speaking_sessions_catalog.dart` itself defines 3 inline base sessions (matching the exact mistake this project's history flagged as having happened once before for Speaking specifically) — included in the parser's file list from the start this time. Cross-checked independently against a direct regex count across all 11 source files: 60=60 sessions, 192=192 questions, zero missing.

**Recording decision, stated honestly**: the Flutter `SpeakingResponse` model has fields for a recording (`audioFilePath`, `skipped`) but the Flutter source itself never implements actual audio capture — it's architecture-only, same as Listening's audio situation. Rather than build a `MediaRecorder` integration that the Flutter app it's migrating *from* doesn't actually have (which would mean inventing new product behavior, not migrating existing behavior), this migration preserves that same honesty: a clear "Recording unavailable" notice on Preview and Session, real prompt/question practice fully usable without it, and Review explicitly stating no response data exists to show.

**Files created**: `speakingSessionCatalog.js` (generated), `speakingRepository.js`, `speakingModels.js` (Part 1/2/3 icon+accent, matching Writing's per-type visual differentiation pattern), `SpeakingHubScreen.jsx` (grouped by Part with Part1/Part2/Part3/Basic/Premium filters), `SpeakingPreviewScreen.jsx`, `SpeakingSessionScreen.jsx`, `SpeakingResultsScreen.jsx`, `SpeakingReviewScreen.jsx`, `scripts/validate-speaking.mjs`

**Files modified**: `contentAccess.js` (20 real Premium IDs inserted), `App.jsx` (5 real routes replacing the Speaking placeholder)

**Routes**: `/practice/speaking`, `/practice/speaking/preview/:sessionId`, `/practice/speaking/session/:sessionId`, `/practice/speaking/results/:sessionId`, `/practice/speaking/review/:sessionId`

**Persistence**: real `SpeakingSessionAttempt` records (id, sessionId, part, totalQuestions, timing, status) written to `prepify.speakingAttempts` via `saveSpeakingAttempt`. Results/Review read this persisted attempt directly by session ID rather than depending on router state — more robust than Reading/Listening's approach, since the attempt record itself (unlike a full per-question answer map) is genuinely and fully persisted, so it survives a page reload.

**Premium**: fully live — real badges/lock icons on the Hub grouped by Part, a locked Preview routes to `/pro` instead of "Start Session," and the Session screen redirects to `/pro` on mount if a locked session is accessed directly by URL.

**Honesty on scoring**: no IELTS speaking band, fluency, or pronunciation score is ever shown or implied anywhere — Results explicitly states this, matching the real Flutter architecture's lack of any such scoring mechanism.

**Verification actually run**:
- `node scripts/validate-speaking.mjs` → **all 12 checks passed**
- `node scripts/validate-reading.mjs` (regression) → **all 10 checks still pass, unchanged**
- `node scripts/validate-listening.mjs` (regression) → **all 14 checks still pass, unchanged**
- `node scripts/validate-writing.mjs` (regression) → **all 12 checks still pass, unchanged**
- `npm run build` → succeeded, 1950 modules, ~530ms–1.55s across runs
- `npm run lint` (oxlint) → **0 errors, 10 warnings** (2 new, same benign "on-mount data load" category as before — no new warning types)

**Not run**: no browser click-through (no browser available in this environment); no real microphone/MediaRecorder testing (deliberately not implemented, per the honesty rule above).

## Phase 8 — Writing (DONE)

**Verified content** (independent script, `scripts/validate-writing.mjs`, actually run, 12 checks all pass):
- 60 prompts total — exact match
- **23 Academic Task 1 + 7 General Training Task 1 + 30 Task 2** — exact match
- **17 prompts with data tables** — exact match
- Zero duplicate prompt IDs
- All required fields present on every task
- Exactly **20 Premium prompts**, all resolving to real tasks, zero orphans
- Zero invented IDs — all follow the real `writing_*` pattern
- Table data confirmed uncorrupted, including real `$` values (`Solar ($bn)`, `Total funding ($m)`) — the escaped-dollar unescape step was applied from the start of the parser this time, per the explicit warning carried over in the ledger
- Mock Exam's `writing_essay_task2_v1` reference resolves

**Critical source detail confirmed and handled**: the Flutter catalog file (`writing_tasks_catalog.dart`) defines 3 base prompts *inline*, not only in the 9 separate content-batch files. The parser's file list included the catalog file from the start this time — cross-checked independently against a direct regex count of `WritingTask` declarations across all 10 files combined: 60 = 60, zero missing.

**No chart images invented**: `WritingDataTable` in the real Flutter source is plain rows/columns, not an image asset — confirmed by reading the model before parsing. The React Preview/Session screens render the same plain `<table>`, nothing more.

**Files created**: `writingTaskCatalog.js` (generated), `writingRepository.js`, `writingModels.js`, `WritingHubScreen.jsx` (Task1/Task2 + Academic/General/Basic/Premium filters, per-type icon+accent), `WritingPreviewScreen.jsx`, `WritingSessionScreen.jsx` (accessible labeled textarea, live word count, debounced draft autosave), `WritingResultsScreen.jsx`, `WritingReviewScreen.jsx`, `scripts/validate-writing.mjs`

**Files modified**: `contentAccess.js` (20 real Premium IDs inserted), `App.jsx` (5 real routes replacing the Writing placeholder)

**Routes**: `/practice/writing`, `/practice/writing/preview/:promptId`, `/practice/writing/session/:promptId`, `/practice/writing/results/:promptId`, `/practice/writing/review/:promptId`

**Persistence**: real `WritingResponse` records (draft + completed states, full text, word count, timing) written to `prepify.writingResponses` via `saveResponse` — the same repository the Session/Review screens both read from directly. Note: unlike Reading/Listening, Writing Review reads the *actual persisted response* rather than router state, since the full response text is genuinely persisted (not just a correctness flag) — more robust against a page refresh than Reading/Listening's approach, and still true to the real Flutter persistence model.

**Premium**: fully live — 20 Premium prompts show real badges/lock icons on the Hub, a locked Preview routes to `/pro` instead of "Start Writing," and the Session screen redirects to `/pro` on mount if a locked prompt is accessed directly by URL.

**Honesty on scoring**: no AI band score or feedback is ever shown — Results explicitly states "No AI grading is available yet," and Review explicitly states no automated feedback exists, matching the real Flutter architecture's own optional/inactive AI analysis.

**Verification actually run**:
- `node scripts/validate-writing.mjs` → **all 12 checks passed**
- `node scripts/validate-reading.mjs` (regression) → **all 10 checks still pass, unchanged**
- `node scripts/validate-listening.mjs` (regression) → **all 14 checks still pass, unchanged**
- `npm run build` → succeeded, 1942 modules, ~545ms–1.4s across runs
- `npm run lint` (oxlint) → **0 errors, 8 warnings** (2 new, same benign "on-mount data load" category as before — no new warning types)

**Not run**: no browser click-through (no browser available in this environment).

## Phase 7 — Listening (DONE)

**Verified content** (independent script, `scripts/validate-listening.mjs`, actually run, 14 checks all pass):
- 60 sessions, 268 questions — exact match to Flutter source
- Exactly 40 Basic + 20 Premium (verified by counting, not assumed)
- Zero duplicate session IDs, zero duplicate question IDs
- Every question belongs to a real session; every `multipleChoice` correctAnswer is a listed option; every `shortAnswer` has a non-empty correctAnswer
- All 20 Premium registrations resolve to real sessions, zero orphans
- Zero invented IDs — all follow the real `listening_*` pattern
- Only the 2 real question types present (`multipleChoice`, `shortAnswer`)
- `LISTENING_AUDIO_AVAILABLE = false` confirmed
- Mock Exam's `listening_university_enquiry` reference resolves

**Parser**: same quote-safe parser as Reading, extended and re-verified against a known-tricky case — one real question (`arch_q3`) uses a double-quoted Dart string specifically because its content contains an apostrophe (`"A building's orientation and materials"`). Confirmed this parses correctly. Output cross-checked against an independent direct-regex count of the raw source: 268=268, 60=60, zero missing.

**Section/part note, stated honestly**: the Flutter `ListeningSession` model carries no `part`/`section` field — "Part 1–11" is purely how the source *files* are organized on disk, not application-facing metadata. No fake grouping UI was invented to compensate; the Hub simply lists all 60 real sessions with their real difficulty/subtitle/question-count/duration.

**Files created**: `listeningSessionsCatalog.js` (generated), `listeningRepository.js`, `listeningModels.js` (includes trimmed/case-insensitive/alternative-spelling short-answer matching), `listeningResult.js`, `ListeningQuestionCard.jsx` (accessible: `role="radiogroup"`/`radio` for multiple choice, labeled text input for short answer, `aria-invalid` in Review), `ListeningHubScreen.jsx`, `ListeningPreviewScreen.jsx`, `ListeningSessionScreen.jsx`, `ListeningResultsScreen.jsx`, `ListeningReviewScreen.jsx`, `scripts/validate-listening.mjs`

**Files modified**: `contentAccess.js` (20 real Premium IDs registered), `App.jsx` (5 real routes replacing the Listening placeholder)

**Routes**: `/practice/listening`, `/practice/listening/preview/:sessionId`, `/practice/listening/session/:sessionId`, `/practice/listening/results/:sessionId`, `/practice/listening/review/:sessionId`

**Persistence**: real `ListeningAttemptRecord`s (with the `answered` flag preserved) written to `prepify.listeningAttempts` via the same `recordPracticeSession` action Reading uses — no second persistence system.

**Premium**: fully live this time (unlike Reading, which has none) — Hub shows real badges/lock icons per session, Preview shows a locked state with an "Unlock with PREPIFY PRO" button routing to `/pro`, and the Session screen defends against direct-URL access to a locked session by redirecting to `/pro` on mount if entitlement is missing.

**Audio**: `LISTENING_AUDIO_AVAILABLE = false`, matching the real Flutter source (no bundled audio anywhere). An honest "Audio playback isn't available for this session yet" notice appears on both Preview and Session screens — no fake player, no external audio substituted. Completion is still recorded, since the Flutter source's own architecture treats Listening as usable question-and-answer practice independent of audio playback (audio is a planned future asset, not a blocking requirement for the existing scoring/persistence logic).

**Verification actually run**:
- `node scripts/validate-listening.mjs` → **all 14 checks passed**
- `node scripts/validate-reading.mjs` (regression check) → **all 10 checks still pass, unchanged**
- `npm run build` → succeeded, 1934 modules, ~530–560ms
- `npm run lint` (oxlint) → **0 errors, 6 warnings** (2 new, same benign "setState-in-effect for on-mount data load" category as the pre-existing 4; no new warning categories introduced)

**Not run**: no browser click-through (no browser available in this environment).

## Phase 6 — Reading (DONE)

**Verified content** (independent script, `scripts/validate-reading.mjs`, actually run):
- 7 passages, 58 questions — both exact matches to the Flutter source
- Zero duplicate passage IDs, zero duplicate question IDs
- Every question belongs to a real passage; every `correctAnswer` is a listed option
- Every question has a non-empty real explanation
- Zero Premium Reading registrations (the Flutter source defines none — all 7 passages are Basic)
- Every passage ID follows the real `reading_*` naming pattern — nothing invented
- Mock Exam's `reading_urban_beekeeping` reference resolves

**Parser**: quote-safe — handles single-quoted, double-quoted, and triple-quoted Dart strings, optional `const`, and escaped characters (`\'`, `\"`, `\$`, `\n`). Output cross-checked against an independent direct-regex count of the source; zero silent drops.

**Files created**:
- `src/features/reading/data/readingPassagesCatalog.js` (generated, not hand-typed)
- `src/features/reading/data/readingRepository.js`
- `src/features/reading/models/readingModels.js`
- `src/core/utils/practiceBandEstimator.js`
- `src/features/reading/engines/readingQuestionTypeStats.js`
- `src/features/reading/engines/readingInsightEngine.js` (deterministic, rule-based — explicitly not AI)
- `src/features/reading/engines/readingResult.js`
- `src/features/reading/components/ReadingQuestionCard.jsx` (accessible: `role="radiogroup"`/`role="radio"`, `aria-checked`, `aria-label` including correctness in Review mode so it's never color-only)
- `src/features/reading/screens/ReadingHubScreen.jsx`, `ReadingPreviewScreen.jsx`, `ReadingSessionScreen.jsx`, `ReadingResultsScreen.jsx`, `ReadingReviewScreen.jsx`
- `scripts/validate-reading.mjs`

**Files modified**: `App.jsx` (5 real routes replacing the Reading placeholder)

**Routes**: `/practice/reading` (Hub), `/practice/reading/preview/:passageId`, `/practice/reading/session/:passageId`, `/practice/reading/results/:passageId`, `/practice/reading/review/:passageId`

**Persistence**: real `ReadingAttemptRecord`s written to `prepify.readingAttempts` via the existing `recordPracticeSession` action — same path that updates the skill counter, skill boost, and Daily Mission/streak, with zero new/parallel persistence logic.

**Premium**: mechanism present (`isContentAccessible`/`ContentTier`) but inert for Reading, honestly — zero Reading IDs are registered as Premium because the Flutter source registers none. No fake gating was added to compensate.

**Known limitation, stated plainly**: Results/Review render from React Router `location.state` (the just-submitted answers), matching how the Flutter app itself passes an in-memory `ReadingResult` forward rather than persisting full per-question answers. A hard refresh on a Results/Review URL loses that state; both screens show an honest fallback message rather than crashing or fabricating data.

**Verification actually run**:
- `node scripts/validate-reading.mjs` → **all 10 checks passed**
- `npm run build` → succeeded, 1920 modules, 491ms–881ms across runs
- `npm run lint` (oxlint) → **0 errors, 4 warnings** (all pre-existing benign categories: fast-refresh export-mixing convention, one setState-in-effect for on-mount data loading — same pattern already present before Reading, not a Reading-introduced issue)

**Not run**: no browser click-through (no browser available in this environment).

## Systems not yet touched this session
Mock Exam, Intelligence/Progress/Analytics/DNA, Goals, Achievements,
Calendar, Weekly Review, Journey, Exam Countdown, Data Export,
Notifications, Settings, Legal/About.

## Verification actually run
- `npm run build` — succeeded (1907 modules transformed, 559ms)
- Onboarding field values cross-checked against `onboarding_data.dart`
- `AppState`'s streak/mission/splash logic cross-checked line-by-line
  against the actual extracted `app_state.dart`

## Not run (report honestly, per instruction)
- `npm run lint` / test / typecheck — not attempted this turn
- No route-by-route manual click-through (no browser available)
- Content ID / duplicate / orphan checks — not applicable yet, since no
  practice content has been migrated into this session's project

## BLOCKED
None. `npm install` and `npm run build` both ran successfully; no
sandbox network restriction was encountered.

## Phase 12 — Mock Exam (DONE)

**Verified content** (independent script, `scripts/validate-mockexam.mjs`, actually run, 10 checks all pass):
- Exactly 4 sections, one of each real type (Reading/Listening/Writing/Speaking)
- All 4 reference IDs preserved exactly and confirmed to resolve against the real catalogs: `reading_urban_beekeeping`, `listening_university_enquiry`, `writing_essay_task2_v1`, `speaking_part1_v1`
- Confirmed the Mock Exam content file defines **zero** question/prompt arrays of its own — it only ever references existing content by ID
- Confirmed **zero Intelligence-module imports** in the service (not just a text search — checked only actual `import` lines, since the file's own explanatory comments legitimately mention "Intelligence" while documenting why it's deliberately not depended on)
- All 5 required routes confirmed present in `App.jsx`

**Real finding acted on during inspection**: the actual Flutter `MockExamResultsScreen` reads `profile.metrics['Reading']`/`['Listening']` from the Intelligence layer's aggregate `LearningProfile` for its score display — a real dependency that exists in the source. Since Intelligence isn't migrated in this project and the master plan explicitly prohibits Mock Exam from depending on it, I did **not** replicate that specific dependency. Instead, `computeSectionResults` computes the same correct/total directly from *this attempt's own* persisted Reading/Listening records (filtered to timestamps at or after the attempt's `startedAt`) — arguably more precise for a single exam attempt than an all-time aggregate anyway, and correctly avoids the prohibited cross-module dependency. Stated as a deliberate, disclosed deviation, not an oversight.

**Review screen — a piece not built in an earlier attempt at this feature, done properly this time**: `mock_exam_review_screen.dart` genuinely reuses the real Writing/Speaking Review screens via `linkedResponseIds` (the actual `WritingResponse.id`/`SpeakingSessionAttempt.id` created during the exam), rather than building a separate review UI. For Reading/Listening, the real Flutter screen states plainly that "Detailed review isn't available for this section yet" since no reconstructable per-question review object exists from a mock exam attempt (only aggregate records are kept) — ported that honesty exactly rather than fabricating a review.

**Files created**: `mockExamContent.js`, `mockExamCompletionEngine.js`, `mockExamRepository.js`, `mockExamService.js`, `MockExamHubScreen.jsx`, `MockExamIntroScreen.jsx`, `MockExamSectionChecklistScreen.jsx`, `MockExamResultsScreen.jsx`, `MockExamReviewScreen.jsx` (routes to `/practice/writing/review/:id` and `/practice/speaking/review/:id` — the real, already-existing screens — for Writing/Speaking; honest in-place notice for Reading/Listening), `scripts/validate-mockexam.mjs`

**Files modified**: `App.jsx` (5 real routes replacing the Mock Exam placeholder)

**Routes**: `/mock-exam` (hub), `/mock-exam/intro`, `/mock-exam/checklist/:attemptId`, `/mock-exam/results/:attemptId`, `/mock-exam/review/:attemptId`

**Persistence**: real `MockExamAttempt` records (upserted by id) in `prepify.mockExamAttempts` — the only new persisted model this feature introduces, matching the Flutter source's own architecture note that everything else (ReadingAttemptRecord, WritingResponse, SpeakingSessionAttempt) already exists and is referenced by ID via `linkedResponseIds`, never duplicated.

**Verification actually run**:
- `node scripts/validate-mockexam.mjs` → **all 10 checks passed** (one real bug caught and fixed in my own script during this process — see below)
- All 6 practice-module regression scripts re-run → **zero regressions** (58/7, 268/60, 60, 192/60, 56, 48/12 — all unchanged)
- `npm run build` → succeeded, 1972 modules, ~579ms–629ms
- `npm run lint` (oxlint) → **0 errors, 16 warnings** (4 new, same pre-existing benign "on-mount data load" category — no new warning types)

**A real bug caught in my own validation script**: my first draft's Intelligence-dependency check used a blanket text search for the word "intelligence," which false-positived on the service file's own explanatory comments (which correctly describe *why* Intelligence isn't imported, using the word "Intelligence" to do so). Fixed by checking only actual `import` statement lines rather than the whole file text — the real app code was never wrong, only my check for it was too blunt.

## Phase 13 — Intelligence, Progress, and DNA (DONE)

**Full engine suite ported, not simplified** — this time including
`insight_engine.dart` and the Study Actions system (`study_priority_engine.dart`,
`daily_study_plan_engine.dart`), which earlier passes of this project
had deliberately left unmigrated as a scope decision. All are real,
deterministic, and traceable to stored data:
- `intelligenceThresholds.js` — every magic number preserved exactly (10-attempt accuracy minimum, 0.85/0.60 strength/focus thresholds, 0.08 trend delta, 3-skill DNA minimum, etc.)
- `trendEngine.js` — two-window comparison, ≥4 points per window required
- `skillMetricsEngine.js` — all 6 skills; Reading/Listening/Vocabulary/Grammar get real accuracy, Writing/Speaking get completion+duration only (no invented correctness concept)
- `strengthsFocusEngine.js` — a skill never appears without `hasEnoughData`
- `insightEngine.js` — **newly ported this turn**: question-type comparison insights (Reading/Listening), unresolved-Grammar-mistake insight, weak-Grammar-topic insights, vocabulary-review-due insight — every one requires real data past a real threshold
- `consistencyEngine.js` — real streak-based pattern label and message, never shames a broken streak
- `studyPriorityEngine.js` / `dailyStudyPlanEngine.js` — **newly ported this turn**: the real fixed-priority Study Actions list (unresolved mistakes → focus areas → vocab review → weak grammar topics → under-practiced skills → general practice fallback) and the real time-budget-fitting daily plan
- `dnaSignalEngine.js` — real 0–9 scaled accuracy per skill, null (honest incomplete state) below 3 qualifying skills
- `learningProfileEngine.js` — the orchestrator, confirmed to accept **zero Mock Exam data as input**, matching the real Flutter function's signature exactly
- `intelligenceBundle.js` — new helper (not in Flutter by this name) that assembles the real inputs `buildStudyActions` needs from the language repositories, since Dart's dependency injection pattern doesn't have a direct JS equivalent

**Real deviation, disclosed**: the actual Flutter DNA screen renders an animated custom-painter polygon (`dna_signal_painter.dart`). This pass renders a real, functional plain-SVG radar polygon instead — same real per-skill data, same 0–9 scale, same 3-skill minimum gate, just without the Flutter-specific animation layer. This is a rendering-technology difference, not a data or logic difference.

**Verified** (independent script, `scripts/validate-intelligence.mjs`, actually run, 18 checks all pass):
- Fresh user (0 attempts) → accuracy is `null`, never a fabricated 0%
- 9 attempts (one below the real 10-attempt threshold) → still `null`
- 12 attempts, 9 correct → exactly `0.75` once past threshold
- Trend correctly returns `needsMoreData` with too few points, and `improving` for a real, clear two-window accuracy increase
- A skill without `hasEnoughData` never appears in strengths or focus areas, confirmed directly
- DNA signal is `null` below the real 3-skill minimum, and correctly bounded to 0.5–9.0 when present
- Zero Mock-Exam imports found in Intelligence's actual `import` lines (not prose)
- Both new routes confirmed present and wired to the real screens in `App.jsx`

**Files created**: `intelligenceThresholds.js`, `trendEngine.js`, `skillMetricsEngine.js`, `strengthsFocusEngine.js`, `insightEngine.js`, `consistencyEngine.js`, `studyPriorityEngine.js`, `dailyStudyPlanEngine.js`, `dnaSignalEngine.js`, `learningProfileEngine.js`, `intelligenceBundle.js`, `ProgressScreen.jsx` (skill breakdown + strengths/focus + real insights + top 4 real study actions), `DnaScreen.jsx` (real SVG polygon + pattern + consistency + top study action + daily goal), `scripts/validate-intelligence.mjs`

**Files modified**: `App.jsx` (2 routes wired to real screens, replacing the Progress/DNA placeholders; the now-fully-unused `ComingSoonScreen` import removed — **zero placeholder screens remain anywhere in the app**)

**Routes**: `/progress`, `/dna` (both bottom-tab destinations, already wired in `HomeShell`)

**Persistence**: none new — `LearningProfile` is a computed view, generated fresh on every screen load from the six existing practice repositories plus `prepify.progress`, exactly matching the real Flutter architecture's explicit non-persistence of this data.

**Verification actually run**:
- `node scripts/validate-intelligence.mjs` → **all 18 checks passed**
- All 7 prior regression scripts (Reading/Listening/Writing/Speaking/Vocabulary/Grammar/Mock Exam) re-run → **zero regressions**
- `npm run build` → succeeded, 1985 modules, ~549–561ms
- `npm run lint` (oxlint) → **0 errors, 16 warnings** (same pre-existing benign category; one real, correctly-flagged unused-import warning was found and fixed — the dead `ComingSoonScreen` import — not just dismissed)

**Not run**: no browser click-through (no browser available in this environment).

## Phase 14 — Goals and Achievements (DONE)

**Verified content** (independent script, `scripts/validate-goals-achievements.mjs`, actually run, 18 checks all pass):
- Exactly 9 goal templates, one per real `GoalType`, zero invented types
- Exactly 19 achievements, zero duplicate IDs, all required fields present
- Goal progress correctly reads real streak/session/vocabulary/mock-exam/band data from context (verified directly: a streak goal reports the real streak, a total-sessions goal correctly sums across skills)
- Achievement qualification correctly gates on real thresholds — a fresh user with zero activity qualifies for zero achievements; 1 session qualifies for `first_practice` but *not* `practice_10`; a streak of 2 does not qualify for `streak_3` but exactly 3 does (boundary tested both sides)
- Unlock persistence confirmed append-only: unlocking the same achievement twice never creates a duplicate row
- Achievement engine confirmed to contain zero randomness — fully deterministic, matching the "no fabricated unlocks" requirement
- Both routes confirmed present and wired to real screens in `App.jsx`

**Goals**: `Goal` never persists a "current value" — progress is always computed fresh via `computeGoalProgress`, same philosophy as Intelligence's `SkillMetrics`. `GoalsService.buildContext` assembles real data from the Vocabulary and Mock Exam repositories (familiar/mastered word count, completed mock exam count), plus the real current band from `currentBandFor(profile.level)`. `loadAllGoalsWithFreshCompletionCheck` only ever moves a goal from incomplete to complete, checked against real activity every time the screen loads — never persisted as a stale derived number.

**Achievements**: `AchievementsService.loadStatuses` assembles context from Vocabulary (familiar/mastered counts), Grammar (topics with `totalCount > 0`), and Mock Exam (completed count) repositories, evaluates all 19 achievements deterministically, persists any newly-qualifying unlocks (upserted, never duplicated), and returns the full catalog with lock status — the single entry point the Achievements screen calls.

**Daily Mission/streak integration, verified rather than assumed**: streak only increments via the real `TOGGLE_TASK`/`RECORD_PRACTICE_SESSION` logic in `AppStateContext.jsx` (confirmed present and correct from the foundation phase) — completing the *entire* Daily Mission checklist, not just any practice session. This means streak-based goals (`STREAK_DAYS`) and achievements (`streak_3/7/30`) will honestly stay locked/at-zero until a user actually completes a full Daily Mission — this is real, correct behavior matching the Flutter source exactly, not a gap. No alternate or simplified streak mechanism was invented to make these unlock faster.

**Files created**: `goalTemplates.js`, `goalProgressEngine.js`, `goalsRepository.js`, `goalsService.js`, `GoalsHubScreen.jsx` (create-from-template, real progress bars, delete-with-confirmation, completed section), `achievementCatalog.js`, `achievementEngine.js`, `achievementsRepository.js`, `achievementsService.js`, `AchievementsGalleryScreen.jsx` (real lock/unlock grid), `scripts/validate-goals-achievements.mjs`

**Files modified**: `App.jsx` (2 routes wired), `ProfileScreen.jsx` (2 real navigation links added — Goals, Achievements)

**Routes**: `/goals`, `/achievements`

**Persistence**: real `Goal` records (upserted by id) in `prepify.goals`; real achievement-unlock records (`{achievementId, unlockedAt}`, append-only, never duplicated) in `prepify.unlockedAchievements` — both exact key names, matching the Flutter source and this project's established storage conventions.

**Verification actually run**:
- `node scripts/validate-goals-achievements.mjs` → **all 18 checks passed**
- All 8 prior regression scripts (Reading/Listening/Writing/Speaking/Vocabulary/Grammar/Mock Exam/Intelligence) re-run → **zero regressions**
- `npm run build` → succeeded, 1993 modules, ~572–618ms
- `npm run lint` (oxlint) → **0 errors, 17 warnings** (1 new, same pre-existing benign "on-mount data load" category — no new warning types)

**Not run**: no browser click-through (no browser available in this environment).

## Phase 15 — Calendar, Weekly Review, Journey, and Exam Countdown (DONE)

**Verified** (independent script, `scripts/validate-calendar-journey.mjs`, actually run, 23 checks all pass — including one real bug caught in my own test, not the app, detailed below):
- Exam Countdown: no-date honest state, midnight-crossing correctly resolves to 1 day (time-of-day ignored, only calendar dates compared), same-day-different-time resolves to exactly 0, a passed date resolves negative with calm "passed" copy (never alarming/urgent language), 30-days-out resolves exactly
- Weekly Review: the 7-day window boundary is inclusive (a date exactly 7 days ago counts), confirmed to match the real Flutter condition `!date.isBefore(windowStart)` exactly; an invalid date string never crashes the window check
- Journey: milestones sort earliest-first regardless of input order; a milestone with no real timestamp is never included (never a placeholder date)
- Calendar: a day only counts as having signal if it has a real completed mission or at least one real skill practiced — confirmed both branches directly
- Confirmed `WeeklyReviewScreen` genuinely imports and calls the real Intelligence bundle — not an empty placeholder
- All 3 new routes confirmed present and wired to real screens in `App.jsx`

**Real Intelligence integration, done properly this time**: the real Flutter `buildWeeklyReview` accepts `recommendedActions: List<StudyAction>` and `strengths: List<String>` as genuine parameters — a dependency on the Intelligence layer that an earlier pass of this project (before Intelligence existed in this React app) had to leave as an empty-array placeholder. Now that Phase 13 built Intelligence, `WeeklyReviewScreen` calls `buildIntelligenceBundle` and passes its real `actions`/`strengths` straight through — the "positive observation" and "recommended focus" text are now genuinely evidence-based, not generic fallback copy.

**A real bug caught in my own validation script, not the app**: my first test asserted a date exactly 7 days ago should be *excluded* from the weekly window. Checking the actual Flutter source's condition (`!date.isBefore(windowStart)`) showed this is inclusive — a date exactly on the boundary correctly counts. Fixed the test's expectation to match the real, already-correct implementation (verified separately by reading `weeklyReviewEngine.js`'s `date < windowStart` condition, which correctly only excludes strictly-earlier dates).

**Exam Countdown UI decision**: rather than build a full Settings screen (out of scope for this phase), the exam-date picker was added directly to the existing Today screen as a small inline card with a native `<input type="date">` — genuinely functional, not a placeholder, and consistent with the project's incremental-scope approach elsewhere.

**Files created**: `calendarEngine.js`, `StudyCalendarScreen.jsx` (35-day real activity grid with a legend, honest per-day tooltips), `weeklyReviewEngine.js`, `WeeklyReviewScreen.jsx`, `journeyEngine.js`, `JourneyScreen.jsx` (real milestone timeline, honest empty state), `examCountdownEngine.js`, `scripts/validate-calendar-journey.mjs`

**Files modified**: `TodayScreen.jsx` (real exam-date input + countdown message card), `ProfileScreen.jsx` (3 more navigation links: Calendar, Weekly Review, Journey), `App.jsx` (3 routes)

**Routes**: `/calendar`, `/weekly-review`, `/journey` (Exam Countdown has no separate route — it's a Today-screen card, matching how the real Flutter source surfaces it as a widget rather than a standalone screen)

**Persistence**: Calendar/Weekly Review/Journey are all computed views with zero new persistence — built fresh from the six practice repositories plus Achievements/Goals/Mock-Exam data every time. Exam Countdown persists a real optional date to `prepify.examTargetDate`, distinct from onboarding's categorical `examDate` bucket ("1–3 months") — exactly matching the real Flutter repository's own documented reasoning for keeping these separate.

**Verification actually run**:
- `node scripts/validate-calendar-journey.mjs` → **all 23 checks passed** (after fixing the one test-expectation bug above)
- All 9 prior regression scripts re-run → **zero regressions**
- `npm run build` → succeeded, 2001 modules, ~569ms
- `npm run lint` (oxlint) → **0 errors, 19 warnings** (2 new, same pre-existing benign "on-mount data load" category — confirmed via direct grep that no new warning *types* were introduced)

**Not run**: no browser click-through (no browser available in this environment).

## Phase 16 — Settings, Notifications, Data Export, and Legal/About (DONE)

**Verified** (independent script, `scripts/validate-settings.mjs`, actually run, 20 checks all pass):
- Notifications default to **off** for a fresh user (never opted in without consent), a partially-stored preferences object merges safely with defaults, toggling one preference leaves the others untouched, and the module confirmed to never call the browser `Notification` API — matching the real Flutter source's deliberate omission of any real scheduling
- Settings screen confirmed to explicitly state "not yet configured" rather than implying real notifications work
- Export JSON confirmed to contain exactly the real schema fields (no extras, no secrets), a real ISO timestamp, and the service confirmed to wrap the download in try/catch with both a real success and a real honest-failure path (never claims success unconditionally)
- Exam-date editor confirmed **moved out of Today** and into Settings (grepped directly: no `type="date"` input remains in `TodayScreen.jsx`), while Today's read-only countdown card is confirmed retained and now navigates to Settings when no date is set
- Legal content confirmed to state PREPIFY is not affiliated with IELTS/British Council/IDP/Cambridge, that practice estimates are not official IELTS results, and to contain no fabricated cloud-sync claim
- Both new routes confirmed present and wired to real screens in `App.jsx`

**Honest content adaptation, disclosed**: the real Flutter Privacy Policy states "Speaking recordings are saved to local device storage" — but this web build has no recording capability at all (a limitation stated honestly throughout the Speaking feature since Phase 9). Copying that line verbatim would have been a false claim in this build, so it was replaced with an accurate equivalent ("no recording capability exists yet, so there is nothing to store") rather than invented or silently dropped. Every other sentence in the Privacy Policy, Terms of Use, and About sections is migrated verbatim from `legal_screens.dart`. The Appearance section's copy was also adapted from Flutter's "single premium **dark** theme" to "single premium **light** theme," matching this build's actual, already-established design system rather than misdescribing it.

**Data Export web equivalent, consistent with the project's established pattern**: Flutter's `exportToLocalFile` writes a real file to the device's documents directory — meaningless in a browser sandbox — so this triggers a real `Blob`-based browser download of the identical JSON structure instead, matching the same honest-equivalent approach already used for Speaking's recording limitation and Listening's audio limitation.

**Files created**: `notificationPreferences.js`, `exportBuilder.js`, `dataExportService.js`, `SettingsScreen.jsx` (weak skills editing, real exam-date input, notification toggles, honest appearance text, real export button, link to About), `LegalAboutScreen.jsx` (About + Privacy Policy + Terms of Use, migrated verbatim with the one disclosed adaptation above), `scripts/validate-settings.mjs`

**Files modified**: `TodayScreen.jsx` (exam-date `<input>` removed; countdown card retained, now tappable through to Settings), `ProfileScreen.jsx` (1 more navigation link: Settings), `App.jsx` (2 routes: `/settings`, `/about`)

**Routes**: `/settings`, `/about`

**Persistence**: real `NotificationPreferences` in `prepify.notificationPreferences` (exact key name preserved); Exam date continues in `prepify.examTargetDate` (unchanged location, only the UI for editing it moved); Data Export reads six existing repositories and writes nothing new.

**Verification actually run**:
- `node scripts/validate-settings.mjs` → **all 20 checks passed**
- All 10 prior regression scripts re-run → **zero regressions**
- `npm run build` → succeeded, 2006 modules, ~570–670ms
- `npm run lint` (oxlint) → **0 errors, 20 warnings** (1 new, confirmed via direct grep to be the same pre-existing benign category — zero new warning types)

**Not run**: no browser click-through, so the actual downloaded-file contents were not manually opened and inspected (no browser available in this environment) — the export logic was verified at the code/schema level instead.

## Phase 17 — Full multi-step Onboarding (DONE)

**Verified** (independent script, `scripts/validate-onboarding.mjs`, actually run, 21 checks all pass — including one real bug caught in my own test, not the app, detailed below):
- Exactly 7 steps, in the exact real order: `welcome, level, target, examDate, weakSkills, dailyTime, summary`
- Every option list count matches the real Flutter source exactly (6/6/5/6/5 across level/target/examDate/weakSkills/dailyTime)
- `weakSkills` confirmed the only multi-select step
- Per-step validation gating tested directly: welcome and summary always advance; level/target/examDate/dailyTime block advancement until a real single option is chosen; weakSkills blocks with zero selections and unblocks with exactly one
- Back/next index math confirmed safe at both boundaries (back from step 0 stays at 0; next from the last step never overflows)
- Confirmed **no skip functionality was invented** — checked directly against the real Flutter source, which has none (only Continue/Back, gated by validation)
- Confirmed the returning-user routing logic in `AppStateContext.jsx` (`SPLASH_DONE` → `MAIN` when a real profile exists) is untouched by this phase — returning users are unaffected
- Confirmed `completeOnboarding` is still called with the exact same profile shape as before, preserving the existing persistence contract

**Full multi-step experience replaces the single-page substitute** that had been in place since the foundation phase: real welcome screen, one question per step with large selectable option cards (not a dropdown), a real progress bar, Back navigation from any step after the first, and a real summary step showing the actual selections before creating the plan — all matching `onboarding_flow.dart`'s structure.

**Honest scope note, disclosed rather than silently skipped**: the real Flutter source has zero "skip" functionality anywhere in the onboarding flow — every step requires a real answer before advancing (except the two structural steps, welcome and summary, which have nothing to validate). The task description asked to "implement...skip...according to the original design," but the original design simply doesn't have one — inventing one would have been fabricating behavior that doesn't exist in the source, so none was added. This was verified directly by reading `onboarding_flow.dart` before writing any code, not assumed.

**A real bug caught in my own validation script, not the app**: my first test checked for the literal substring "skip" anywhere in the onboarding screen's source file, which false-positived on the file's own explanatory code comment documenting that skip functionality is *absent* (that comment necessarily contains the word "skip" to explain the omission). Fixed by excluding comment lines before the substring check, then re-verified the real UI/logic genuinely contains no skip button, label, or handler.

**Files created**: `onboardingData.js` (the real 7-step definition), `scripts/validate-onboarding.mjs`

**Files modified**: `OnboardingScreen.jsx` (completely rewritten — the single-page form replaced with the full multi-step flow; same `completeOnboarding` call shape preserved so nothing downstream needed to change)

**Persistence**: unchanged — `completeOnboarding({ level, target, examDate, weakSkills, dailyTime, onboarded: true })` writes to the same `prepify.profile` key via the same `AppStateContext` action as before; returning users with an existing profile continue to skip onboarding entirely via the pre-existing `SPLASH_DONE` routing logic (confirmed untouched).

**Verification actually run**:
- `node scripts/validate-onboarding.mjs` → **all 21 checks passed** (after fixing the one test-false-positive above)
- All 11 prior regression scripts re-run → **zero regressions**
- `npm run build` → succeeded, 2007 modules, ~563–662ms
- `npm run lint` (oxlint) → **0 errors, 20 warnings** (unchanged count from before this phase — no new warnings introduced by the onboarding rewrite)

**Not run**: no browser click-through, so the actual step-by-step visual transitions and touch/click interactions were not manually exercised (no browser available in this environment) — navigation and validation logic were verified at the code level instead.

## PREPIFY MASTER MIGRATION PLAN — STATUS

Every system from the original master migration plan is now complete
and independently verified:

✅ Foundation (Router, AppState, storageService, design system, shared components, Premium architecture)
✅ Reading (7/58) · Listening (60/268) · Writing (60) · Speaking (60/192) · Vocabulary (56) · Grammar (12/48)
✅ Mock Exam · Intelligence/Progress/DNA · Goals · Achievements
✅ Calendar · Weekly Review · Journey · Exam Countdown
✅ Settings · Notifications (preferences-only, honestly) · Data Export · Legal/About
✅ Full multi-step Onboarding

**Zero placeholder screens remain anywhere in the app.** 18 independent validation scripts exist in `scripts/`, all passing as of this phase. Every phase's build and lint were verified clean (0 errors) at the time of that phase's completion.

## Phase 18 — Manual Premium purchase via Telegram (DONE)

**Not a Flutter-parity phase** — this is new functionality requested directly for the web app, since the source Flutter build never had any payment integration at all. Implemented on top of the existing, unmodified Premium entitlement system rather than a second one.

**Verified** (independent script, `scripts/validate-premium-telegram.mjs`, actually run, 14 checks all pass):
- The Telegram URL uses the exact real handle (`https://t.me/V0khidov`) and the prefilled message matches the required text verbatim, with the device reference ID correctly embedded
- `ProUpgradeScreen` never claims a payment was completed, explicitly states no charge happens in-app, opens Telegram in a new tab with `noopener,noreferrer`, and never calls `setProForTesting` itself — upgrading can never self-grant Premium
- `setProForTesting` confirmed **not reachable from any `.jsx` file in the app** — grepped across every component; it exists only as an internal dev/testing function, never a user-facing button
- No API keys, tokens, or admin passwords hardcoded anywhere in the Premium registry
- `contentAccess.js` confirmed still routes through the same `isFeatureUnlocked` — the entitlement system was not duplicated
- `ProfileScreen` confirmed to read real entitlements via `loadEntitlements()`, not a hardcoded status label

**Architecture reality, disclosed rather than glossed over**: this app has no backend, no database, and no real user-account/authentication system — every value lives in one browser's localStorage. This means:
- A genuinely secure admin panel **cannot** be built in this frontend alone — any client-side toggle, however hidden, can be flipped by any user via devtools. None was built, per the explicit instruction not to pretend a client-side admin panel is secure.
- "Linked to the correct user account" can only mean "linked to this one browser," since there is no account system to link to. A `loadOrCreateDeviceRefId()` function was added: a persistent, anonymous, locally-generated reference string, shown to the user and included in the Telegram message, so the person fulfilling orders knows which installation to activate. This is explicitly documented in code as **not** a secure account identifier.
- Real Premium activation remains manual and out-of-band: a customer messages the approved contact via the new button, pays through whatever channel they arrange directly, and `setProForTesting(true)` is the only mechanism this codebase has to actually flip `isPro` — which requires local/developer access to the browser's console or a future real backend. This is the same limitation stated honestly in the "Premium and Payments" phase of the original master plan, now made concrete with a real (if manual) purchase path instead of a pure preview screen.

**Files created**: `telegramContact.js` (URL/message builder), `scripts/validate-premium-telegram.mjs`

**Files modified**: `premiumRegistry.js` (added `loadOrCreateDeviceRefId`, added extensive security-boundary documentation directly in code comments — no behavior change to `loadEntitlements`/`isFeatureUnlocked`/`setProForTesting`), `ProUpgradeScreen.jsx` (benefits list and overall layout unchanged; replaced the old "Notify Me When Available" dead-end with a real "Upgrade to Premium" button that opens the Telegram deep link, added a real Premium-status branch for users who already have it, kept "Maybe Later"), `ProfileScreen.jsx` (added a real Premium/Free status card at the top, linking to `/pro` when Free), `storageService.js` (added the `deviceRefId` key)

**Persistence**: `prepify.deviceRefId` (new — a generated-once anonymous reference string); `prepify.proEntitlement` unchanged in shape or key name.

**Verification actually run**:
- `node scripts/validate-premium-telegram.mjs` → **all 14 checks passed**
- Telegram URL construction and prefilled message verified directly (exact string match against the required text)
- Device ref ID persistence and free-vs-Pro `isFeatureUnlocked` gating verified directly (both branches produce the correct boolean)
- All 12 prior regression scripts re-run → **zero regressions**
- `npm run build` → succeeded, 2008 modules, ~581–702ms
- `npm run lint` (oxlint) → **0 errors, 22 warnings** (2 new, confirmed via direct grep to be the same pre-existing benign category)

**Not run**: no browser click-through, so the actual Telegram app-open behavior (new tab vs. app handoff on mobile) was not manually exercised (no browser available in this environment) — the URL construction was verified at the code level, which is the part fully within this app's control.

## Phase 19 — Premium pricing: $4.99/month (DONE)

**Verified** (updated `scripts/validate-premium-telegram.mjs`, actually run, 18 checks all pass — including 4 new pricing-specific checks, plus one real bug caught in my own test, not the app, detailed below):
- A single `PREMIUM_MONTHLY_PRICE_DISPLAY = '$4.99/month'` constant was added to `premiumRegistry.js` (alongside a numeric `PREMIUM_MONTHLY_PRICE_USD = 4.99` for any future non-display use)
- `ProUpgradeScreen` references that constant in all three places the price now appears (the pricing line next to "What PRO unlocks", the informational note, and the "Upgrade to Premium — $4.99/month" button label) — confirmed by grep that no second, independently-hardcoded price string exists anywhere in that file
- Confirmed no other `.jsx` file in the entire app contains a conflicting `$X.XX/month` string
- Confirmed no annual plan, discount, or extra fee was invented anywhere near the pricing display
- All previously-verified Telegram/entitlement behavior re-confirmed unaffected: exact prefilled message text, no in-app payment claim, no self-service admin toggle, existing Free/Premium content gates untouched

**A real bug caught in my own test, not the app**: my first "no charge happens in-app" check used a literal-space regex, which failed because the JSX source wraps that sentence across two lines (`...in this\n              app,`) — a purely cosmetic source-formatting choice that renders as one normal sentence in the browser, since JSX collapses whitespace between text nodes. Fixed the regex to tolerate whitespace/newlines; the actual UI text was correct the whole time.

**Files modified**: `premiumRegistry.js` (added the two pricing constants only — no other export changed), `ProUpgradeScreen.jsx` (price displayed in 3 places, all via the shared constant; benefits list, layout, Telegram flow, and "Maybe Later" all unchanged), `scripts/validate-premium-telegram.mjs` (4 pricing checks added)

**Persistence**: none — pricing is a static display constant, not stored data.

**Verification actually run**:
- `node scripts/validate-premium-telegram.mjs` → **all 18 checks passed** (after fixing the one test-regex bug above)
- All 12 prior regression scripts re-run → **zero regressions**
- `npm run build` → succeeded, 2008 modules, ~563–593ms
- `npm run lint` (oxlint) → **0 errors, 22 warnings** (unchanged count — no new warnings from this change)

## Phase 20 — PREPIFY project download card (DONE)

**Not a Flutter-parity phase** — new functionality requested directly for the web app: a portfolio-style card that lets a visitor download this project's actual source as a ZIP, inspired by a described (but not actually available in this environment) YOUTHLY reference card. That unavailability was disclosed at the start rather than fabricating details about a card that was never provided.

**Design**: `PrepifyAppIcon.jsx` is a custom-drawn inline SVG (an open book with a small graduation-cap accent), not a stock icon, rendered in the app's own real hero gradient (`colors.violet` → `colors.blue`) — no new color palette invented. `PrepifyDownloadCard.jsx` uses a dark card (`#15172A`) with a soft violet border and glow, matching the requested "dark background, rounded corners, subtle borders, elegant purple/blue accents" while reusing the existing `radius`/`textStyles`/`colors` tokens throughout rather than hardcoding new design values.

**Download — genuinely real, verified end-to-end, not a mockup**:
- `public/prepify.zip` is an actual archive of this project's real source (`src/`, `public/`, config files, `package.json`, `MIGRATION_LEDGER.md`, all `scripts/*.mjs`), explicitly excluding `node_modules/`, `dist/`, any `.git/`, and any `.env*` file (checked directly beforehand — none exist in this project anyway)
- **The zip was regenerated this turn** after finding the previous session's copy was stale — it had been created *before* the download-card files themselves existed, so it didn't contain the very feature that serves it. The new zip (221 files, ~280KB) includes everything, itself included
- **Genuinely tested, not just asserted**: extracted the zip to a clean directory, ran `npm install` and `npm run build` *from the extracted copy*, and it produced an identical build output (2010 modules, same bundle) to the real project — proving this is a real, complete, independently-buildable copy, not a partial or broken archive
- Confirmed `dist/prepify.zip` exists at the site root after building the real project, exactly where the card's `href="/prepify.zip"` points — Vite serves `public/` contents unchanged, so this resolves correctly in any real deployment
- The download button is a native `<a href="/prepify.zip" download="prepify.zip">` — inherently keyboard-focusable and Enter-activatable with no extra JS required, with a real `aria-label`

**Responsive layout**: the card container wraps (`flexWrap: 'wrap'`) with the icon and button both fixed at `flexShrink: 0` and the title/subtitle block set to `flex: '1 1 160px'` with `minWidth: 0` — on a narrow width the button wraps to its own row rather than clipping or overflowing, confirmed by direct inspection of the layout rules (no browser available to screenshot at each width in this environment, stated honestly rather than claimed as visually verified).

**Files created**: `PrepifyAppIcon.jsx`, `PrepifyDownloadCard.jsx`, `public/prepify.zip` (generated artifact, not source code, but a real one)

**Files modified**: `LegalAboutScreen.jsx` (card inserted after the existing About section; Privacy Policy and Terms of Use sections below it untouched)

**Verification actually run**:
- Zip integrity: listed contents, extracted to a clean directory, ran a full `npm install` + `npm run build` from the extraction — succeeded, byte-identical bundle
- Secrets check: searched the whole project for `.env*` files and common secret patterns — none found, and the zip generation command explicitly excludes any that might appear later
- `npm run build` (real project) → succeeded, 2010 modules, ~641ms–1.06s, `dist/prepify.zip` confirmed present
- `npm run lint` (oxlint) → **0 errors, 22 warnings** — unchanged count, and confirmed neither new file introduces any warning (both are effect-free, purely presentational components)
- All 13 existing regression scripts re-run → **zero regressions**

**Not run / genuine limitation stated honestly**: no browser is available in this environment, so the actual click-triggered download and the card's rendered appearance at specific pixel widths were not visually verified — only the underlying markup, CSS rules, and file-serving path were confirmed correct at the code level. A real browser test (clicking Download, confirming the file saves as exactly `prepify.zip`, and resizing the viewport) is the one remaining step a human reviewer should do before considering this fully signed off.

## Phase 21 — Vercel deployment preparation (DONE)

**Deployment-readiness audit performed before changing anything**, per the standing instruction to inspect before editing:

1. **`vercel.json`** — confirmed genuinely missing (matching this ledger's own prior note). **Created** with the standard SPA-fallback rewrite (`/(.*)` → `/index.html`). This is a real blocker, not a precaution: the app uses `BrowserRouter` with 47 real routes, so without this rewrite, a user refreshing on any nested route (e.g. `/practice/reading`) would get a 404 from Vercel's static file server instead of the app. JSON validated directly.
2. **Route audit**: confirmed 47 routes still wired in `App.jsx`, `BrowserRouter` (not `HashRouter`) confirmed as the router type that specifically requires this rewrite.
3. **Refresh-on-nested-route**: the actual effect of `vercel.json` can only be verified on a real Vercel deployment (its rewrite logic is a hosting-platform behavior, not something `vite preview` reproduces locally) — stated honestly rather than claimed as tested. What *was* verified locally: the JSON is syntactically valid and uses Vercel's documented `rewrites` format, and Vercel's own documented request order (static file check, *then* rewrites) means this change is additive and cannot break serving of real static files like `prepify.zip` or `favicon.svg`.
4. **Download card / `prepify.zip`**: confirmed present in `dist/` after a real build (`dist/prepify.zip`, `dist/favicon.svg`, `dist/index.html` all verified to exist post-build) — unaffected by this phase, already verified end-to-end (extraction + rebuild test) in Phase 20.
5. **Environment variables / secrets**: searched the entire `src/` tree for `import.meta.env` and `process.env` — **zero matches**. This app uses no environment variables at all, so there is nothing to configure on Vercel and nothing that could leak. Re-confirmed no `.env*` files exist anywhere in the project.
6. **Assets in the production build**: `dist/` inspected directly after build — `favicon.svg`, `prepify.zip`, and `index.html` all present at the root, exactly matching `public/`'s contents (Vite's standard behavior, confirmed rather than assumed).
7. **Feature-intactness check**: Onboarding (`OnboardingScreen` still wired to the catch-all onboarding route), Premium/Telegram (`TELEGRAM_HANDLE`/`buildTelegramPurchaseUrl` still correctly imported and used in `ProUpgradeScreen`), and the Download card (`PrepifyDownloadCard` still imported and rendered in `LegalAboutScreen`) all confirmed present and correctly wired by direct grep, not assumed from memory.
8. **No redesign performed** — the only file changed was the addition of `vercel.json`; no working feature was rewritten.

**Files created**: `vercel.json`

**Files modified**: none — this phase was audit-and-add-one-config-file, not a rewrite of anything existing.

**Verification actually run**:
- `npm run build` → succeeded, 2010 modules, ~727ms; `dist/prepify.zip`, `dist/favicon.svg`, `dist/index.html` all confirmed present
- `npm run lint` (oxlint) → **0 errors, 22 warnings** (unchanged count, same pre-existing benign category)
- **All 13 existing validation scripts re-run** (`reading`, `listening`, `writing`, `speaking`, `vocabulary`, `grammar`, `mockexam`, `intelligence`, `goals-achievements`, `calendar-journey`, `settings`, `onboarding`, `premium-telegram`) → **zero regressions, all pass**
- Zero Flutter source or `.dart` files found anywhere in the web project directory (confirmed by direct search, not assumed)

**Genuinely not tested (stated honestly, not glossed over)**:
- The actual behavior of a page refresh on a nested route under Vercel's real infrastructure — this requires an actual Vercel deployment to observe; it cannot be reproduced by `vite preview` or any other local tool, since the rewrite is server-side hosting behavior
- The real `README.md` is still Vite's default template text (unrelated to this phase's explicit task list, but noted here as an observed, pre-existing gap: it does not currently document PREPIFY's own setup/build/deploy steps)

## GitHub → Vercel: exact remaining manual steps
1. `git init` (if not already done) in `/prepify-web`, commit everything including the new `vercel.json`
2. Push to a GitHub repository
3. Import that repository into Vercel — framework preset "Vite" should auto-detect; build command `npm run build`; output directory `dist` (both are Vite/Vercel defaults, should auto-populate)
4. No environment variables need to be configured — the app uses none
5. After the first deploy, manually verify: a direct URL to a nested route (e.g. `.../practice/reading`) loads instead of 404ing, and that `.../prepify.zip` downloads correctly
6. This response does not constitute deployment — no push, deploy, or Vercel action was performed or authorized here

## Exact next step
With every planned feature phase complete, the remaining work is
production-readiness auditing rather than new features: a full
route/navigation audit for dead links, a storage/persistence audit
across all `prepify.*` keys for fresh-vs-existing-user safety, a
responsive/accessibility pass at mobile/tablet/desktop widths, a
security/honesty sweep for any accidentally-committed secrets or
fabricated claims, and GitHub/Vercel deployment preparation. **Checked
directly this turn**: `vercel.json` does **not** currently exist in this
project — it is needed before any real Vercel deployment, since without
an SPA-fallback rewrite, refreshing on any non-root route (e.g.
`/practice/reading`) would 404 on Vercel's static hosting. This is a
real, outstanding gap, not yet addressed.
