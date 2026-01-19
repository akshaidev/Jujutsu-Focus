import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  syncServerTime,
  getServerTime,
  getServerTodayString,
  getServerDate
} from "@/utils/timeService";

const STORAGE_KEY = "@jujutsu_focus_state";
const TICK_INTERVAL = 1000;

export interface VowState {
  isActive: boolean;
  startedAt: number | null;
  studySecondsWhileVow: number;
  graceTimeSeconds: number;
  usedGraceSeconds: number;
  lastVowDate: string | null;
  debtAtVowStart: number;
  vowPenaltyUntil: number | null;
}

export interface GameState {
  balance: number;
  nceBalance: number;
  streakDays: number;
  rctCredits: number;
  lastBalanceDate: string | null;
  lastBalance: number;
  vowState: VowState;
  totalStudySeconds: number;
  totalGamingSeconds: number;
  dailyStudySeconds: number;
  dailyGamingSeconds: number;
  lastDailyResetDate: string | null;
  lastSleepDate: string | null;
  logs: any[];
  // Active session tracking for background time
  activeSessionMode: Mode | null;
  activeSessionStartTime: number | null;
}

export type Mode = "idle" | "study" | "gaming";

const initialVowState: VowState = {
  isActive: false,
  startedAt: null,
  studySecondsWhileVow: 0,
  graceTimeSeconds: 0,
  usedGraceSeconds: 0,
  lastVowDate: null,
  debtAtVowStart: 0,
  vowPenaltyUntil: null,
};

const initialState: GameState = {
  balance: 0,
  nceBalance: 0,
  streakDays: 0,
  rctCredits: 0,
  lastBalanceDate: null,
  lastBalance: 0,
  vowState: initialVowState,
  totalStudySeconds: 0,
  totalGamingSeconds: 0,
  dailyStudySeconds: 0,
  dailyGamingSeconds: 0,
  lastDailyResetDate: null,
  lastSleepDate: null,
  logs: [],
  activeSessionMode: null,
  activeSessionStartTime: null,
};

function getEarningRate(balance: number, vowActive: boolean): number {
  let baseRate: number;
  if (balance >= 0) {
    baseRate = 1.0;
  } else if (balance > -5) {
    baseRate = 1.0;
  } else if (balance > -10) {
    baseRate = 0.5;
  } else {
    baseRate = 0.25;
  }
  return vowActive ? baseRate + 0.5 : baseRate;
}

// Use server time for all date calculations to prevent device time manipulation
function getTodayDateString(): string {
  return getServerTodayString();
}

export function useGameStateInternal() {
  const [state, setState] = useState<GameState>(initialState);
  const [mode, setMode] = useState<Mode>("idle");
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVowSuccess, setShowVowSuccess] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [hasDismissedSleepModal, setHasDismissedSleepModal] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<GameState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync server time on app start, then load state
  useEffect(() => {
    const initApp = async () => {
      await syncServerTime(); // Sync time first to prevent manipulation
      loadState();
    };
    initApp();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveState(state);
    }
  }, [state, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      const today = getTodayDateString();
      if (state.lastSleepDate !== today && !hasDismissedSleepModal) {
        setShowSleepModal(true);
      }
    }
  }, [isLoaded, state.lastSleepDate, hasDismissedSleepModal]);

  useEffect(() => {
    if (mode !== "idle") {
      setSessionSeconds(0);
      intervalRef.current = setInterval(() => {
        tick();
        setSessionSeconds((prev) => prev + 1);
      }, TICK_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSessionSeconds(0);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode]);

  // Handle app returning from background - sync elapsed time
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isLoaded) {
        // App came to foreground - sync time if session was active
        setState((prev) => {
          if (prev.activeSessionMode && prev.activeSessionStartTime) {
            const now = getServerTime();
            const elapsedSeconds = Math.floor((now - prev.activeSessionStartTime) / 1000);

            // Update session counter to reflect total elapsed time
            setSessionSeconds(elapsedSeconds);

            // Re-sync server time in case device time changed
            syncServerTime();
          }
          return prev;
        });
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [isLoaded]);

  const VOW_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  const PENALTY_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

  const checkExpiredVow = (loadedState: GameState): GameState => {
    // Check if there's an active vow that has expired
    if (
      loadedState.vowState.isActive &&
      loadedState.vowState.startedAt &&
      loadedState.balance < 0
    ) {
      const elapsed = getServerTime() - loadedState.vowState.startedAt;

      if (elapsed >= VOW_DURATION_MS) {
        // Vow expired while still in debt - apply penalty
        const currentDebtAbs = Math.abs(loadedState.balance);
        const penaltyAmount = Math.max(loadedState.vowState.debtAtVowStart, currentDebtAbs);

        loadedState.balance = Math.round((loadedState.balance - penaltyAmount) * 10000) / 10000;
        loadedState.vowState = {
          ...initialVowState,
          lastVowDate: loadedState.vowState.lastVowDate,
          vowPenaltyUntil: getServerTime() + PENALTY_DURATION_MS,
        };
        loadedState.logs = [
          {
            timestamp: getServerTime(),
            message: `Binding Vow Failed - Debt increased by ${penaltyAmount.toFixed(1)} CE`,
            type: "vow" as const,
            value: -penaltyAmount,
          },
          ...(loadedState.logs || []),
        ].slice(0, 99);
      }
    }
    return loadedState;
  };

  // Apply background time when app was closed with an active session
  const applyBackgroundTime = (loadedState: GameState): GameState => {
    if (!loadedState.activeSessionMode || !loadedState.activeSessionStartTime) {
      return loadedState;
    }

    const now = getServerTime();
    const elapsedSeconds = Math.floor((now - loadedState.activeSessionStartTime) / 1000);

    if (elapsedSeconds <= 0) {
      return loadedState;
    }

    const sessionMode = loadedState.activeSessionMode;

    if (sessionMode === "study") {
      const earningRate = getEarningRate(loadedState.balance, loadedState.vowState.isActive);
      const cePerSecond = earningRate / 60;
      const ceEarned = cePerSecond * elapsedSeconds;

      loadedState.balance = Math.round((loadedState.balance + ceEarned) * 10000) / 10000;
      loadedState.totalStudySeconds += elapsedSeconds;
      loadedState.dailyStudySeconds = (loadedState.dailyStudySeconds || 0) + elapsedSeconds;

      // NCE earned from streak
      if (loadedState.streakDays > 0) {
        const ncePerSecond = 0.5 / 60;
        loadedState.nceBalance = Math.round((loadedState.nceBalance + ncePerSecond * elapsedSeconds) * 10000) / 10000;
      }

      // Grace time if vow active
      if (loadedState.vowState.isActive) {
        const graceEarned = 0.2 * elapsedSeconds;
        loadedState.vowState = {
          ...loadedState.vowState,
          studySecondsWhileVow: loadedState.vowState.studySecondsWhileVow + elapsedSeconds,
          graceTimeSeconds: Math.round((loadedState.vowState.graceTimeSeconds + graceEarned) * 100) / 100,
        };
      }

      loadedState.logs = [
        {
          timestamp: now,
          message: `Background Focus Session (+${ceEarned.toFixed(1)} CE in ${Math.floor(elapsedSeconds / 60)}m)`,
          type: "session" as const,
          value: ceEarned,
        },
        ...(loadedState.logs || []),
      ].slice(0, 99);

    } else if (sessionMode === "gaming") {
      const cePerSecond = 1.0 / 60;
      let ceSpent = 0;

      if (loadedState.vowState.isActive) {
        const availableGrace = loadedState.vowState.graceTimeSeconds - loadedState.vowState.usedGraceSeconds;
        const graceUsed = Math.min(availableGrace, elapsedSeconds);
        const ceSeconds = elapsedSeconds - graceUsed;
        ceSpent = cePerSecond * ceSeconds;
        loadedState.vowState = {
          ...loadedState.vowState,
          usedGraceSeconds: Math.round((loadedState.vowState.usedGraceSeconds + graceUsed) * 100) / 100,
        };
      } else {
        ceSpent = cePerSecond * elapsedSeconds;
      }

      loadedState.balance = Math.round((loadedState.balance - ceSpent) * 10000) / 10000;
      loadedState.totalGamingSeconds += elapsedSeconds;
      loadedState.dailyGamingSeconds = (loadedState.dailyGamingSeconds || 0) + elapsedSeconds;

      loadedState.logs = [
        {
          timestamp: now,
          message: `Background Leisure Session (-${ceSpent.toFixed(1)} CE in ${Math.floor(elapsedSeconds / 60)}m)`,
          type: "session" as const,
          value: -ceSpent,
        },
        ...(loadedState.logs || []),
      ].slice(0, 99);
    }

    // Clear the active session after applying
    loadedState.activeSessionMode = null;
    loadedState.activeSessionStartTime = null;

    console.log(`[BackgroundTimer] Applied ${elapsedSeconds}s of ${sessionMode} time`);
    return loadedState;
  };

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GameState>;
        let stateWithDefaults = { ...initialState, ...parsed };

        // Also handle nested state objects like vowState
        if (parsed.vowState) {
          stateWithDefaults.vowState = {
            ...initialState.vowState,
            ...parsed.vowState,
          };
        }

        checkMidnightReset(stateWithDefaults);
        checkDailyReset(stateWithDefaults);
        stateWithDefaults = checkExpiredVow(stateWithDefaults);
        stateWithDefaults = applyBackgroundTime(stateWithDefaults);
        setState(stateWithDefaults);
      } else {
        setState(initialState);
      }
    } catch (error) {
      console.error("Failed to load state:", error);
      setState(initialState);
    }
    setIsLoaded(true);
  };

  const saveState = async (newState: GameState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  };

  const checkDailyReset = (loadedState: GameState) => {
    const today = getTodayDateString();
    if (loadedState.lastDailyResetDate !== today) {
      loadedState.dailyStudySeconds = 0;
      loadedState.dailyGamingSeconds = 0;
      loadedState.lastDailyResetDate = today;
    }
  };

  const checkMidnightReset = (loadedState: GameState) => {
    const today = getTodayDateString();
    if (loadedState.lastBalanceDate && loadedState.lastBalanceDate !== today) {
      const yesterday = getServerDate();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (loadedState.lastBalanceDate === yesterdayStr) {
        if (loadedState.balance > loadedState.lastBalance) {
          loadedState.streakDays += 1;
          if (loadedState.streakDays % 3 === 0) {
            loadedState.rctCredits += 1;
          }
        } else {
          loadedState.streakDays = 0;
        }
      } else {
        loadedState.streakDays = 0;
      }

      loadedState.lastBalance = loadedState.balance;
      loadedState.lastBalanceDate = today;
    } else if (!loadedState.lastBalanceDate) {
      loadedState.lastBalanceDate = today;
      loadedState.lastBalance = loadedState.balance;
    }
  };

  const tick = useCallback(() => {
    setState((prev) => {
      const currentMode = mode;
      let newState = { ...prev };

      const today = getTodayDateString();
      if (prev.lastDailyResetDate !== today) {
        newState.dailyStudySeconds = 0;
        newState.dailyGamingSeconds = 0;
        newState.lastDailyResetDate = today;
      }

      if (currentMode === "study") {
        const earningRate = getEarningRate(
          prev.balance,
          prev.vowState.isActive,
        );
        const cePerSecond = earningRate / 60;
        newState.balance =
          Math.round((prev.balance + cePerSecond) * 10000) / 10000;
        newState.totalStudySeconds = prev.totalStudySeconds + 1;
        newState.dailyStudySeconds = (prev.dailyStudySeconds || 0) + 1;

        // NCE only earned from streak, NOT from binding vow
        if (prev.streakDays > 0) {
          const ncePerSecond = 0.5 / 60;
          newState.nceBalance =
            Math.round((prev.nceBalance + ncePerSecond) * 10000) / 10000;
        }

        if (prev.vowState.isActive) {
          const VOW_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
          const PENALTY_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
          const elapsed = getServerTime() - (prev.vowState.startedAt || 0);

          // Check if 24 hours expired - apply penalty
          if (elapsed >= VOW_DURATION_MS && newState.balance < 0) {
            const currentDebtAbs = Math.abs(newState.balance);
            const penaltyAmount = Math.max(prev.vowState.debtAtVowStart, currentDebtAbs);
            newState.balance = Math.round((newState.balance - penaltyAmount) * 10000) / 10000;
            newState.vowState = {
              ...initialVowState,
              lastVowDate: prev.vowState.lastVowDate,
              vowPenaltyUntil: getServerTime() + PENALTY_DURATION_MS,
            };
            newState.logs = [
              {
                timestamp: getServerTime(),
                message: `Binding Vow Failed - Debt increased by ${penaltyAmount.toFixed(1)} CE`,
                type: "vow" as const,
                value: -penaltyAmount,
              },
              ...(newState.logs || []),
            ].slice(0, 99);
            return newState;
          }

          const graceEarned = 0.2;
          newState.vowState = {
            ...prev.vowState,
            studySecondsWhileVow: prev.vowState.studySecondsWhileVow + 1,
            graceTimeSeconds:
              Math.round((prev.vowState.graceTimeSeconds + graceEarned) * 100) /
              100,
          };

          if (newState.balance >= 0) {
            const bonusCE =
              (newState.vowState.graceTimeSeconds -
                newState.vowState.usedGraceSeconds) /
              60;
            newState.balance =
              Math.round((newState.balance + bonusCE) * 10000) / 10000;
            newState.vowState = {
              ...initialVowState,
              lastVowDate: prev.vowState.lastVowDate,
            };
            setTimeout(() => setShowVowSuccess(true), 100);
          }
        }
      } else if (currentMode === "gaming") {
        const cePerSecond = 1.0 / 60;
        newState.totalGamingSeconds = prev.totalGamingSeconds + 1;
        newState.dailyGamingSeconds = (prev.dailyGamingSeconds || 0) + 1;

        if (prev.vowState.isActive) {
          const availableGrace =
            prev.vowState.graceTimeSeconds - prev.vowState.usedGraceSeconds;
          if (availableGrace > 0) {
            newState.vowState = {
              ...prev.vowState,
              usedGraceSeconds:
                Math.round((prev.vowState.usedGraceSeconds + 1) * 100) / 100,
            };
          } else {
            newState.balance =
              Math.round((prev.balance - cePerSecond) * 10000) / 10000;
          }
        } else {
          newState.balance =
            Math.round((prev.balance - cePerSecond) * 10000) / 10000;
        }
      }

      return newState;
    });
  }, [mode]);

  const startStudy = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeSessionMode: "study" as Mode,
      activeSessionStartTime: getServerTime(),
    }));
    setMode("study");
  }, []);

  const startGaming = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeSessionMode: "gaming" as Mode,
      activeSessionStartTime: getServerTime(),
    }));
    setMode("gaming");
  }, []);

  const stopTimer = useCallback(() => {
    if (mode !== "idle" && sessionSeconds > 0) {
      setState((prev) => {
        let logMessage = "";
        let value = 0;

        if (mode === "study") {
          const earningRate = getEarningRate(
            prev.balance,
            prev.vowState.isActive,
          );
          value = (earningRate * sessionSeconds) / 60;
          logMessage = `Cursed Energy Gained From Focus Session`;
        } else if (mode === "gaming") {
          value = -(sessionSeconds / 60);
          logMessage = `Spent Cursed Energy on Leisure Session`;
        }

        const newLog = {
          timestamp: getServerTime(),
          message: logMessage,
          type: mode === "study" ? "session" : "session",
          value: value,
          duration: sessionSeconds,
        };

        const currentLogs = prev.logs || [];
        return {
          ...prev,
          activeSessionMode: null,
          activeSessionStartTime: null,
          logs: [newLog, ...currentLogs.slice(0, 99)], // Keep max 100 logs
        };
      });
    } else {
      // Clear session even if 0 seconds
      setState((prev) => ({
        ...prev,
        activeSessionMode: null,
        activeSessionStartTime: null,
      }));
    }

    setMode("idle");
  }, [mode, sessionSeconds]);

  const signBindingVow = useCallback(() => {
    const today = getTodayDateString();
    const now = getServerTime();

    // Check if in penalty period (6 hours after failed vow)
    if (state.vowState.vowPenaltyUntil && now < state.vowState.vowPenaltyUntil) {
      return false;
    }

    if (state.vowState.lastVowDate === today) {
      return false;
    }
    if (state.balance >= 0) {
      return false;
    }

    const currentDebt = Math.abs(state.balance);

    setState((prev) => ({
      ...prev,
      vowState: {
        isActive: true,
        startedAt: getServerTime(),
        studySecondsWhileVow: 0,
        graceTimeSeconds: 0,
        usedGraceSeconds: 0,
        lastVowDate: today,
        debtAtVowStart: currentDebt,
        vowPenaltyUntil: null,
      },
      logs: [
        {
          timestamp: getServerTime(),
          message: "Binding Vow Signed - Sacred contract activated",
          type: "vow" as const,
        },
        ...(prev.logs || []),
      ].slice(0, 99),
    }));
    return true;
  }, [state.balance, state.vowState.lastVowDate, state.vowState.vowPenaltyUntil]);

  const addLog = (
    currentState: GameState,
    message: string,
    type: "sleep" | "system" | "reward" = "system",
    value?: number,
  ): GameState => {
    const newLog = {
      timestamp: getServerTime(),
      message,
      type,
      value,
    };
    const currentLogs = currentState.logs || [];
    return {
      ...currentState,
      logs: [newLog, ...currentLogs.slice(0, 99)], // Prepend and keep max 100 logs
    };
  };

  const logSleep = useCallback(
    (hours: number) => {
      const today = getTodayDateString();
      if (state.lastSleepDate === today) {
        return Promise.resolve(false); // Already slept today
      }

      setState((prev) => {
        let newState = { ...prev };
        let ceEarned = 0;
        let logMessage = "";

        if (hours >= 1 && hours <= 5) {
          ceEarned = 10;
          logMessage = `Sleep recorded (+10 CE)`;
        } else if (hours >= 6 && hours <= 8) {
          ceEarned = 20;
          logMessage = `Restored Cursed Energy (+20 CE)`;
        } else {
          ceEarned = 15; // For 9+ hours
          logMessage = `Overrested (+15 CE)`;
        }

        newState.balance += ceEarned;
        newState = addLog(newState, logMessage, "reward", ceEarned);
        newState.lastSleepDate = today;
        return newState;
      });

      setShowSleepModal(false);
      return Promise.resolve(true);
    },
    [state.lastSleepDate],
  );

  const dismissSleepModal = useCallback(() => {
    setHasDismissedSleepModal(true);
    setShowSleepModal(false);
  }, []);

  const useRCT = useCallback(() => {
    // Guard clause: RCT cannot be used if not in debt
    if (state.balance >= 0) {
      return false;
    }
    if (state.rctCredits < 1 || state.nceBalance < 0.1) {
      return false;
    }

    setState((prev) => {
      // Calculate the absolute debt
      const debt = Math.abs(prev.balance);
      // Calculate heal amount: min of debt and available NCE
      const healAmount = Math.min(debt, prev.nceBalance);
      // New balance: guaranteed to cap at 0
      const newBalance = prev.balance + healAmount;
      // New NCE balance: preserve excess NCE
      const newNceBalance = prev.nceBalance - healAmount;

      console.log(`Purified Debt (+${healAmount.toFixed(2)} CE)`);

      return {
        ...prev,
        balance: Math.round(newBalance * 10000) / 10000,
        nceBalance: Math.round(newNceBalance * 10000) / 10000,
        rctCredits: prev.rctCredits - 1,
        logs: [
          {
            timestamp: getServerTime(),
            message: `Reverse Cursed Technique - Purified ${healAmount.toFixed(2)} units of debt`,
            type: "rct" as const,
            value: healAmount,
          },
          ...(prev.logs || []),
        ].slice(0, 99),
      };
    });
    return true;
  }, [state.rctCredits, state.nceBalance, state.balance]);

  const dismissVowSuccess = useCallback(() => {
    setShowVowSuccess(false);
  }, []);

  const resetAllData = useCallback(async () => {
    setState(initialState);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const debugUpdateState = useCallback((updates: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const earningRate = getEarningRate(state.balance, state.vowState.isActive);
  const availableGraceTime = Math.max(
    0,
    state.vowState.graceTimeSeconds - state.vowState.usedGraceSeconds,
  );
  const isInPenaltyPeriod =
    state.vowState.vowPenaltyUntil !== null &&
    getServerTime() < state.vowState.vowPenaltyUntil;
  const canSignVow =
    state.balance < 0 &&
    state.vowState.lastVowDate !== getTodayDateString() &&
    !isInPenaltyPeriod;
  const hasUsedVowToday = state.vowState.lastVowDate === getTodayDateString();

  return {
    state,
    mode,
    isLoaded,
    earningRate,
    availableGraceTime,
    canSignVow,
    hasUsedVowToday,
    showVowSuccess,
    showSleepModal,
    sessionSeconds,
    startStudy,
    startGaming,
    stopTimer,
    signBindingVow,
    logSleep,
    dismissSleepModal,
    useRCT,
    dismissVowSuccess,
    resetAllData,
    debugUpdateState,
  };
}
