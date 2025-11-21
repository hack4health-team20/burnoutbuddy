"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { buildRecommendation } from "@/lib/recommendation";
import { downloadJson, readLocalData, writeLocalData, clearLocalData } from "@/lib/storage";
import { buildWeeklySummary, emptyBurnoutData } from "@/lib/analytics";
import { fetchBurnoutData, persistBurnoutData } from "@/lib/firebase/firestore";
import { useAuth } from "./auth-context";
import {
  AppSettings,
  BurnoutData,
  MoodCheckIn,
  MoodFormState,
  MoodValue,
  Practice,
  RecommendationResult,
  ResetLog,
  SessionType,
  TimerSession,
} from "@/types";
import { isFirebaseConfigured } from "@/lib/firebase/client";

interface AppStateContextValue {
  data: BurnoutData;
  hydrated: boolean;
  moodForm: MoodFormState;
  recommendation: RecommendationResult | null;
  timerSession: TimerSession | null;
  settings: AppSettings;
  updateMoodForm: (updates: Partial<MoodFormState>) => void;
  commitMoodSelection: () => RecommendationResult | null;
  rotateRecommendation: () => void;
  startTimerForPractice: (practice: Practice) => void;
  completeTimer: (options: { logReset: boolean; postMood?: "better" | "same" }) => void;
  skipTimer: () => void;
  setReducedMotion: (value: boolean) => void;
  clearAllData: () => Promise<void>;
  exportData: () => void;
  weeklySummary: ReturnType<typeof buildWeeklySummary>;
}

const defaultMoodForm: MoodFormState = {
  mood: undefined,
  shift: false,
  timeAvailable: "2m",
};

interface InternalState {
  data: BurnoutData;
  hydrated: boolean;
  moodForm: MoodFormState;
  recommendation: RecommendationResult | null;
  activeCheckInId: string | null;
  timerSession: TimerSession | null;
}

const initialState: InternalState = {
  data: emptyBurnoutData,
  hydrated: false,
  moodForm: defaultMoodForm,
  recommendation: null,
  activeCheckInId: null,
  timerSession: null,
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const maybePersist = async (
  sessionType: SessionType | null,
  uid: string | undefined,
  data: BurnoutData
) => {
  if (sessionType === "demo") {
    writeLocalData(data);
    return;
  }

  if (sessionType === "firebase" && uid && isFirebaseConfigured) {
    try {
      await persistBurnoutData(uid, data);
    } catch (error) {
      console.warn("Unable to persist Burnout Buddy data to Firestore.", error);
    }
  }
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<InternalState>(initialState);
  const { sessionType, user } = useAuth();
  const router = useRouter();
  const hasSyncedFirebase = useRef(false);

  // Hydrate from storage or Firestore when session changes.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!sessionType) {
        hasSyncedFirebase.current = false;
        setState({ ...initialState, data: emptyBurnoutData, hydrated: true });
        return;
      }

      if (sessionType === "demo") {
        hasSyncedFirebase.current = false;
        const stored = readLocalData();
        setState({
          data: stored ?? emptyBurnoutData,
          hydrated: true,
          moodForm: defaultMoodForm,
          recommendation: null,
          activeCheckInId: null,
          timerSession: null,
        });
        return;
      }

      if (sessionType === "firebase" && user && isFirebaseConfigured) {
        hasSyncedFirebase.current = false;
        try {
          const data = await fetchBurnoutData(user.uid);
          if (!cancelled) {
            hasSyncedFirebase.current = true;
            setState({
              data,
              hydrated: true,
              moodForm: defaultMoodForm,
              recommendation: null,
              activeCheckInId: null,
              timerSession: null,
            });
          }
        } catch (error) {
          console.error("Unable to fetch data from Firestore", error);
          if (!cancelled) {
            hasSyncedFirebase.current = true;
            setState({ ...initialState, data: emptyBurnoutData, hydrated: true });
          }
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [sessionType, user]);

  // Persist data when it changes after hydration.
  useEffect(() => {
    if (!state.hydrated) return;
    if (sessionType === "firebase" && !hasSyncedFirebase.current) return;
    void maybePersist(sessionType, user?.uid, state.data);
  }, [state.data, state.hydrated, sessionType, user?.uid]);

  const updateMoodForm = useCallback((updates: Partial<MoodFormState>) => {
    setState((prev) => ({
      ...prev,
      moodForm: {
        ...prev.moodForm,
        ...updates,
      },
    }));
  }, []);

  const commitMoodSelection = useCallback(() => {
    if (!state.moodForm.mood) {
      return null;
    }

    const recommendation = buildRecommendation(
      state.moodForm.mood,
      state.moodForm.timeAvailable,
      state.moodForm.shift,
      state.data // Pass historical data for ML recommendations
    );

    const checkIn: MoodCheckIn = {
      id: createId(),
      mood: state.moodForm.mood,
      shift: state.moodForm.shift,
      timeAvailable: state.moodForm.timeAvailable,
      timestamp: new Date().toISOString(),
      practiceId: recommendation.primary.id,
    };

    setState((prev) => ({
      ...prev,
      recommendation,
      activeCheckInId: checkIn.id,
      data: {
        ...prev.data,
        checkIns: [...prev.data.checkIns, checkIn],
      },
    }));

    return recommendation;
  }, [state.moodForm.mood, state.moodForm.shift, state.moodForm.timeAvailable, state.data]);

  const rotateRecommendation = useCallback(() => {
    setState((prev) => {
      if (!prev.recommendation || !prev.moodForm.mood) return prev;
      
      // Build new recommendation with current form state and historical data
      const newRecommendation = buildRecommendation(
        prev.moodForm.mood,
        prev.moodForm.timeAvailable,
        prev.moodForm.shift,
        prev.data // Pass historical data for ML recommendations
      );
      
      return {
        ...prev,
        recommendation: newRecommendation,
        data: {
          ...prev.data,
          checkIns: prev.data.checkIns.map((checkIn) =>
            checkIn.id === prev.activeCheckInId
              ? {
                  ...checkIn,
                  practiceId: newRecommendation.primary.id,
                }
              : checkIn
          ),
        },
      };
    });
  }, []);

  const startTimerForPractice = useCallback(
    (practice: Practice) => {
      setState((prev) => {
        if (!prev.moodForm.mood) return prev;
        const session: TimerSession = {
          id: createId(),
          practice,
          startedAt: new Date().toISOString(),
          durationSeconds: practice.durationSeconds,
          mood: prev.moodForm.mood as MoodValue,
          timeAvailable: prev.moodForm.timeAvailable,
        };

        return {
          ...prev,
          timerSession: session,
          data: {
            ...prev.data,
            checkIns: prev.data.checkIns.map((checkIn) =>
              checkIn.id === prev.activeCheckInId
                ? {
                    ...checkIn,
                    practiceId: practice.id,
                  }
                : checkIn
            ),
          },
        };
      });
      router.push("/app/timer");
    },
    [router]
  );

  const completeTimer = useCallback(
    ({ logReset, postMood }: { logReset: boolean; postMood?: "better" | "same" }) => {
      setState((prev) => {
        if (!prev.timerSession) return prev;

        const completedAt = new Date().toISOString();
        let resets = prev.data.resets;
        if (logReset) {
          const reset: ResetLog = {
            id: createId(),
            practiceId: prev.timerSession.practice.id,
            mood: prev.timerSession.mood,
            startedAt: prev.timerSession.startedAt,
            completedAt,
            timeAvailable: prev.timerSession.timeAvailable,
            postMood,
            checkInId: prev.activeCheckInId, // Link to the originating check-in
          };
          resets = [...resets, reset];
        }

        const checkIns = prev.data.checkIns.map((checkIn) =>
          checkIn.id === prev.activeCheckInId
            ? {
                ...checkIn,
                postMood,
              }
            : checkIn
        );

        return {
          ...prev,
          data: {
            ...prev.data,
            resets,
            checkIns,
          },
          recommendation: logReset ? prev.recommendation : prev.recommendation,
          timerSession: null,
          activeCheckInId: null,
        };
      });
      router.push("/app/home");
    },
    [router]
  );

  const skipTimer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      timerSession: null,
      activeCheckInId: null,
    }));
    router.push("/app/home");
  }, [router]);

  const setReducedMotion = useCallback((value: boolean) => {
    setState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        settings: {
          ...prev.data.settings,
          reducedMotion: value,
        },
      },
    }));
  }, []);

  const clearAllData = useCallback(async () => {
    setState({ ...initialState, data: emptyBurnoutData, hydrated: true });
    if (sessionType === "demo") {
      clearLocalData();
      return;
    }
    if (sessionType === "firebase" && user && isFirebaseConfigured) {
      await persistBurnoutData(user.uid, emptyBurnoutData);
    }
  }, [sessionType, user]);

  const exportData = useCallback(() => {
    downloadJson("burnout-buddy-export.json", state.data);
  }, [state.data]);

  const weeklySummary = useMemo(
    () => buildWeeklySummary(state.data.checkIns, state.data.resets),
    [state.data.checkIns, state.data.resets]
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      data: state.data,
      hydrated: state.hydrated,
      moodForm: state.moodForm,
      recommendation: state.recommendation,
      timerSession: state.timerSession,
      settings: state.data.settings,
      updateMoodForm,
      commitMoodSelection,
      rotateRecommendation,
      startTimerForPractice,
      completeTimer,
      skipTimer,
      setReducedMotion,
      clearAllData,
      exportData,
      weeklySummary,
    }),
    [
      state.data,
      state.hydrated,
      state.moodForm,
      state.recommendation,
      state.timerSession,
      updateMoodForm,
      commitMoodSelection,
      rotateRecommendation,
      startTimerForPractice,
      completeTimer,
      skipTimer,
      setReducedMotion,
      clearAllData,
      exportData,
      weeklySummary,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return ctx;
};
