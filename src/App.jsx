import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppStateProvider, useAppState, AppPhase } from './state/AppStateContext';
import { colors } from './core/theme/colors';
import SplashScreen from './features/splash/SplashScreen';
import OnboardingScreen from './features/onboarding/OnboardingScreen';
import HomeShell from './features/homeShell/HomeShell';
import TodayScreen from './features/today/TodayScreen';
import PracticeScreen from './features/practice/PracticeScreen';
import ProfileScreen from './features/profile/ProfileScreen';
import ProUpgradeScreen from './features/premium/ProUpgradeScreen';
import ReadingHubScreen from './features/reading/screens/ReadingHubScreen';
import ReadingPreviewScreen from './features/reading/screens/ReadingPreviewScreen';
import ReadingSessionScreen from './features/reading/screens/ReadingSessionScreen';
import ReadingResultsScreen from './features/reading/screens/ReadingResultsScreen';
import ReadingReviewScreen from './features/reading/screens/ReadingReviewScreen';
import ListeningHubScreen from './features/listening/screens/ListeningHubScreen';
import ListeningPreviewScreen from './features/listening/screens/ListeningPreviewScreen';
import ListeningSessionScreen from './features/listening/screens/ListeningSessionScreen';
import ListeningResultsScreen from './features/listening/screens/ListeningResultsScreen';
import ListeningReviewScreen from './features/listening/screens/ListeningReviewScreen';
import WritingHubScreen from './features/writing/screens/WritingHubScreen';
import WritingPreviewScreen from './features/writing/screens/WritingPreviewScreen';
import WritingSessionScreen from './features/writing/screens/WritingSessionScreen';
import WritingResultsScreen from './features/writing/screens/WritingResultsScreen';
import WritingReviewScreen from './features/writing/screens/WritingReviewScreen';
import SpeakingHubScreen from './features/speaking/screens/SpeakingHubScreen';
import SpeakingPreviewScreen from './features/speaking/screens/SpeakingPreviewScreen';
import SpeakingSessionScreen from './features/speaking/screens/SpeakingSessionScreen';
import SpeakingResultsScreen from './features/speaking/screens/SpeakingResultsScreen';
import SpeakingReviewScreen from './features/speaking/screens/SpeakingReviewScreen';
import LanguageHubScreen from './features/language/screens/LanguageHubScreen';
import VocabularyBankScreen from './features/language/screens/VocabularyBankScreen';
import VocabularyPracticeScreen from './features/language/screens/VocabularyPracticeScreen';
import GrammarTopicsScreen from './features/language/screens/GrammarTopicsScreen';
import GrammarPracticeScreen from './features/language/screens/GrammarPracticeScreen';
import MockExamHubScreen from './features/mockExam/screens/MockExamHubScreen';
import MockExamIntroScreen from './features/mockExam/screens/MockExamIntroScreen';
import MockExamSectionChecklistScreen from './features/mockExam/screens/MockExamSectionChecklistScreen';
import MockExamResultsScreen from './features/mockExam/screens/MockExamResultsScreen';
import MockExamReviewScreen from './features/mockExam/screens/MockExamReviewScreen';
import ProgressScreen from './features/progress/ProgressScreen';
import DnaScreen from './features/dna/DnaScreen';
import GoalsHubScreen from './features/goals/screens/GoalsHubScreen';
import AchievementsGalleryScreen from './features/achievements/screens/AchievementsGalleryScreen';
import StudyCalendarScreen from './features/calendar/StudyCalendarScreen';
import WeeklyReviewScreen from './features/weeklyReview/WeeklyReviewScreen';
import JourneyScreen from './features/journey/JourneyScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import LegalAboutScreen from './features/legal/LegalAboutScreen';

function RootRouter() {
  const { phase } = useAppState();

  if (phase === AppPhase.LOADING) {
    return <div style={{ minHeight: '100vh', background: colors.bg }} />;
  }
  if (phase === AppPhase.SPLASH) {
    return <SplashScreen />;
  }
  if (phase === AppPhase.ONBOARDING) {
    return <Routes><Route path="*" element={<OnboardingScreen />} /></Routes>;
  }

  return (
    <Routes>
      <Route element={<HomeShell />}>
        <Route path="/today" element={<TodayScreen />} />
        <Route path="/practice" element={<PracticeScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/dna" element={<DnaScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/" element={<Navigate to="/today" replace />} />
      </Route>

      <Route path="/practice/reading" element={<ReadingHubScreen />} />
      <Route path="/practice/reading/preview/:passageId" element={<ReadingPreviewScreen />} />
      <Route path="/practice/reading/session/:passageId" element={<ReadingSessionScreen />} />
      <Route path="/practice/reading/results/:passageId" element={<ReadingResultsScreen />} />
      <Route path="/practice/reading/review/:passageId" element={<ReadingReviewScreen />} />
      <Route path="/practice/listening" element={<ListeningHubScreen />} />
      <Route path="/practice/listening/preview/:sessionId" element={<ListeningPreviewScreen />} />
      <Route path="/practice/listening/session/:sessionId" element={<ListeningSessionScreen />} />
      <Route path="/practice/listening/results/:sessionId" element={<ListeningResultsScreen />} />
      <Route path="/practice/listening/review/:sessionId" element={<ListeningReviewScreen />} />
      <Route path="/practice/writing" element={<WritingHubScreen />} />
      <Route path="/practice/writing/preview/:promptId" element={<WritingPreviewScreen />} />
      <Route path="/practice/writing/session/:promptId" element={<WritingSessionScreen />} />
      <Route path="/practice/writing/results/:promptId" element={<WritingResultsScreen />} />
      <Route path="/practice/writing/review/:promptId" element={<WritingReviewScreen />} />
      <Route path="/practice/speaking" element={<SpeakingHubScreen />} />
      <Route path="/practice/speaking/preview/:sessionId" element={<SpeakingPreviewScreen />} />
      <Route path="/practice/speaking/session/:sessionId" element={<SpeakingSessionScreen />} />
      <Route path="/practice/speaking/results/:sessionId" element={<SpeakingResultsScreen />} />
      <Route path="/practice/speaking/review/:sessionId" element={<SpeakingReviewScreen />} />
      <Route path="/practice/vocabulary" element={<LanguageHubScreen />} />
      <Route path="/practice/vocabulary/bank" element={<VocabularyBankScreen />} />
      <Route path="/practice/vocabulary/practice" element={<VocabularyPracticeScreen />} />
      <Route path="/practice/grammar" element={<LanguageHubScreen />} />
      <Route path="/practice/grammar/topics" element={<GrammarTopicsScreen />} />
      <Route path="/practice/grammar/topic/:topicId" element={<GrammarPracticeScreen />} />
      <Route path="/mock-exam" element={<MockExamHubScreen />} />
      <Route path="/mock-exam/intro" element={<MockExamIntroScreen />} />
      <Route path="/mock-exam/checklist/:attemptId" element={<MockExamSectionChecklistScreen />} />
      <Route path="/mock-exam/results/:attemptId" element={<MockExamResultsScreen />} />
      <Route path="/mock-exam/review/:attemptId" element={<MockExamReviewScreen />} />
      <Route path="/goals" element={<GoalsHubScreen />} />
      <Route path="/achievements" element={<AchievementsGalleryScreen />} />
      <Route path="/calendar" element={<StudyCalendarScreen />} />
      <Route path="/weekly-review" element={<WeeklyReviewScreen />} />
      <Route path="/journey" element={<JourneyScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/about" element={<LegalAboutScreen />} />
      <Route path="/pro" element={<ProUpgradeScreen />} />

      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <RootRouter />
      </AppStateProvider>
    </BrowserRouter>
  );
}
