import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { StorageService } from '../core/storage/storageService';
import { todayIso, isoDaysAgo } from '../core/utils/dateUtils';
import { todayMissionFor } from '../core/utils/missionEngine';

export const AppPhase = { LOADING: 'loading', SPLASH: 'splash', ONBOARDING: 'onboarding', MAIN: 'main' };
export const AppTab = { TODAY: 'today', PRACTICE: 'practice', PROGRESS: 'progress', DNA: 'dna', PROFILE: 'profile' };

const defaultProgress = {
  streak: 0,
  lastStreakDate: null,
  completedDates: {},
  todayTaskDate: null,
  todayCompletedTaskIds: [],
  skillBoosts: {},
  practiceSessionsCompleted: {},
};

const initialState = { phase: AppPhase.LOADING, activeTab: AppTab.TODAY, profile: null, progress: defaultProgress };

function reducer(state, action) {
  switch (action.type) {
    case 'ENTER_SPLASH':
      return { ...state, phase: AppPhase.SPLASH, profile: action.profile, progress: action.progress ?? defaultProgress };
    case 'SPLASH_DONE':
      return { ...state, phase: state.profile ? AppPhase.MAIN : AppPhase.ONBOARDING };
    case 'COMPLETE_ONBOARDING':
      return { ...state, phase: AppPhase.MAIN, profile: action.profile };
    case 'UPDATE_PROFILE':
      return { ...state, profile: action.profile };
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'TOGGLE_TASK': {
      const today = todayIso();
      const currentIds = state.progress.todayTaskDate === today ? state.progress.todayCompletedTaskIds : [];
      const hasIt = currentIds.includes(action.taskId);
      const nextIds = hasIt ? currentIds.filter((id) => id !== action.taskId) : [...currentIds, action.taskId];
      const mission = todayMissionFor(state.profile);
      const allDone = mission.length > 0 && mission.every((t) => nextIds.includes(t.id));
      const completedDates = { ...state.progress.completedDates };
      let streak = state.progress.streak;
      let lastStreakDate = state.progress.lastStreakDate;
      if (allDone) {
        completedDates[today] = true;
        if (lastStreakDate !== today) {
          streak = lastStreakDate === isoDaysAgo(1) ? streak + 1 : 1;
          lastStreakDate = today;
        }
      } else {
        delete completedDates[today];
      }
      return { ...state, progress: { ...state.progress, todayTaskDate: today, todayCompletedTaskIds: nextIds, completedDates, streak, lastStreakDate } };
    }
    case 'RECORD_PRACTICE_SESSION': {
      const boosts = { ...state.progress.skillBoosts };
      boosts[action.skillKey] = Math.min(0.5, Math.max(0, (boosts[action.skillKey] ?? 0) + action.accuracy * 0.1));
      const sessionsCompleted = { ...state.progress.practiceSessionsCompleted };
      sessionsCompleted[action.skillKey] = (sessionsCompleted[action.skillKey] ?? 0) + 1;
      let nextProgress = { ...state.progress, skillBoosts: boosts, practiceSessionsCompleted: sessionsCompleted };

      const today = todayIso();
      const mission = todayMissionFor(state.profile);
      const hasTask = mission.some((t) => t.skill === action.skillKey);
      const currentIds = state.progress.todayTaskDate === today ? state.progress.todayCompletedTaskIds : [];
      const alreadyDone = currentIds.includes(action.skillKey);
      if (hasTask && !alreadyDone) {
        const nextIds = [...currentIds, action.skillKey];
        const allDone = mission.length > 0 && mission.every((t) => nextIds.includes(t.id));
        const completedDates = { ...nextProgress.completedDates };
        let streak = nextProgress.streak;
        let lastStreakDate = nextProgress.lastStreakDate;
        if (allDone) {
          completedDates[today] = true;
          if (lastStreakDate !== today) {
            streak = lastStreakDate === isoDaysAgo(1) ? streak + 1 : 1;
            lastStreakDate = today;
          }
        }
        nextProgress = { ...nextProgress, todayTaskDate: today, todayCompletedTaskIds: nextIds, completedDates, streak, lastStreakDate };
      }
      return { ...state, progress: nextProgress };
    }
    case 'RESET_ALL':
      return { ...initialState, phase: AppPhase.ONBOARDING };
    default:
      return state;
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const profileJson = StorageService.readJson(StorageService.keys.profile);
    const progressJson = StorageService.readJson(StorageService.keys.progress);
    let progress = progressJson ? { ...defaultProgress, ...progressJson } : defaultProgress;
    if (progress.todayTaskDate !== todayIso()) {
      progress = { ...progress, todayTaskDate: todayIso(), todayCompletedTaskIds: [] };
    }
    dispatch({ type: 'ENTER_SPLASH', profile: profileJson, progress });
    // Matches the Flutter splash screen's own animation timing (logo ->
    // tagline -> progress line) so it's never cut off mid-beat.
    const timer = setTimeout(() => dispatch({ type: 'SPLASH_DONE' }), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state.phase === AppPhase.LOADING) return;
    if (state.profile) StorageService.writeJson(StorageService.keys.profile, state.profile);
  }, [state.phase, state.profile]);

  useEffect(() => {
    if (state.phase === AppPhase.LOADING) return;
    StorageService.writeJson(StorageService.keys.progress, state.progress);
  }, [state.phase, state.progress]);

  const completeOnboarding = useCallback((profile) => dispatch({ type: 'COMPLETE_ONBOARDING', profile }), []);
  const updateProfile = useCallback((profile) => dispatch({ type: 'UPDATE_PROFILE', profile }), []);
  const setTab = useCallback((tab) => dispatch({ type: 'SET_TAB', tab }), []);
  const toggleTask = useCallback((taskId) => dispatch({ type: 'TOGGLE_TASK', taskId }), []);

  const recordPracticeSession = useCallback(({ skillKey, storageKey, attemptRecords, correctCount, totalCount }) => {
    const existing = StorageService.readJsonList(storageKey);
    const combined = [...existing, ...attemptRecords];
    const trimmed = combined.length > 500 ? combined.slice(combined.length - 500) : combined;
    StorageService.writeJsonList(storageKey, trimmed);
    const accuracy = totalCount === 0 ? 0 : correctCount / totalCount;
    dispatch({ type: 'RECORD_PRACTICE_SESSION', skillKey, accuracy });
  }, []);

  const resetAll = useCallback(() => {
    StorageService.clearAll();
    dispatch({ type: 'RESET_ALL' });
  }, []);

  const value = {
    ...state,
    todayMission: todayMissionFor(state.profile),
    completeOnboarding,
    updateProfile,
    setTab,
    toggleTask,
    recordPracticeSession,
    resetAll,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}
