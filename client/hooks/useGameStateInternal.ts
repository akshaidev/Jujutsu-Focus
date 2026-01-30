import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  syncServerTime,
  getServerTime,
  getServerTodayString,
  getServerDate
} from "@/utils/timeService";
import { playSafeBreakEndNotification } from "@/utils/audioService";
import {
  SAFE_BREAK_EARN_RATIO,
  SAFE_BREAK_MAX_SECONDS,
  MAX_LOG_ENTRIES,
  CE_EARNING_RATE_BASE,
  CE_EARNING_RATE_DEBT,
  CE_EARNING_RATE_SEVERE_DEBT,
  DEBT_THRESHOLD_MILD,
  DEBT_THRESHOLD_SEVERE,
  CE_PER_SECOND,
  VOW_EARNING_BOOST,
  VOW_GRACE_TIME_EARNING_RATE,
  NCE_EARNING_RATE,
  RCT_STREAK_DAYS_REQUIRED,
  TICK_INTERVAL_MS,
} from "@/constants/gameConfig";

const STORAGE_KEY = "@jujutsu_focus_state";

// Log entry type for the cursed chronicles
export interface LogEntry {
  timestamp: number;
  message: string;
  type: LogType;
  value?: number;
  duration?: number;
  safeBreakUsed?: number;
}

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
  logs: LogEntry[];
  // Active session tracking for background time
  activeSessionMode: Mode | null;
  activeSessionStartTime: number | null;
  // Safe Break tracking
  safeBreakSeconds: number;
  lastSafeBreakResetDate: string | null;
  sessionSafeBreakSecondsUsed: number;
}

export type Mode = "idle" | "study" | "gaming";

// Log entry type for the cursed chronicles
export type LogType = "session" | "sleep" | "system" | "reward" | "vow" | "rct";

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
  // Safe Break
  safeBreakSeconds: 0,
  lastSafeBreakResetDate: null,
  sessionSafeBreakSecondsUsed: 0,
};

function getEarningRate(balance: number, vowActive: boolean): number {
  let baseRate: number;
  if (balance >= 0) {
    baseRate = CE_EARNING_RATE_BASE;
  } else if (balance > DEBT_THRESHOLD_MILD) {
    baseRate = CE_EARNING_RATE_BASE;
  } else if (balance > DEBT_THRESHOLD_SEVERE) {
    baseRate = CE_EARNING_RATE_DEBT;
  } else {
    baseRate = CE_EARNING_RATE_SEVERE_DEBT;
  }
  return vowActive ? baseRate + VOW_EARNING_BOOST : baseRate;
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
  const [isUsingSafeBreak, setIsUsingSafeBreak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safeBreakNotifiedRef = useRef(false); // Prevent duplicate notifications

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
      }, TICK_INTERVAL_MS);
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
        ].slice(0, MAX_LOG_ENTRIES - 1);
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

      // Safe Break earned during background study (only when balance >= 0 and no vow)
      if (loadedState.balance >= 0 && !loadedState.vowState.isActive) {
        const safeBreakEarned = elapsedSeconds / SAFE_BREAK_EARN_RATIO;
        const newSafeBreak = Math.min(
          SAFE_BREAK_MAX_SECONDS,
          (loadedState.safeBreakSeconds || 0) + safeBreakEarned
        );
        loadedState.safeBreakSeconds = Math.round(newSafeBreak * 100) / 100;
      }

      loadedState.logs = [
        {
          timestamp: now,
          message: `Background Focus Session (+${ceEarned.toFixed(1)} CE in ${Math.floor(elapsedSeconds / 60)}m)`,
          type: "session" as const,
          value: ceEarned,
        },
        ...(loadedState.logs || []),
      ].slice(0, MAX_LOG_ENTRIES - 1);

    } else if (sessionMode === "gaming") {
      let ceSpent = 0;
      let safeBreakUsed = 0;

      // First check for Binding Vow grace time (highest priority)
      if (loadedState.vowState.isActive) {
        const availableGrace = loadedState.vowState.graceTimeSeconds - loadedState.vowState.usedGraceSeconds;
        const graceUsed = Math.min(availableGrace, elapsedSeconds);
        const ceSeconds = elapsedSeconds - graceUsed;
        ceSpent = CE_PER_SECOND * ceSeconds;
        loadedState.vowState = {
          ...loadedState.vowState,
          usedGraceSeconds: Math.round((loadedState.vowState.usedGraceSeconds + graceUsed) * 100) / 100,
        };
      } else {
        // Use Safe Break time first, then consume CE
        const availableSafeBreak = loadedState.safeBreakSeconds || 0;
        safeBreakUsed = Math.min(availableSafeBreak, elapsedSeconds);
        const ceSeconds = elapsedSeconds - safeBreakUsed;
        ceSpent = CE_PER_SECOND * ceSeconds;
        loadedState.safeBreakSeconds = Math.max(0, availableSafeBreak - safeBreakUsed);
      }

      loadedState.balance = Math.round((loadedState.balance - ceSpent) * 10000) / 10000;
      loadedState.totalGamingSeconds += elapsedSeconds;
      loadedState.dailyGamingSeconds = (loadedState.dailyGamingSeconds || 0) + elapsedSeconds;

      const logMessage = safeBreakUsed > 0
        ? `Background Leisure (-${ceSpent.toFixed(1)} CE in ${Math.floor(elapsedSeconds / 60)}m, Safe Break used)`
        : `Background Leisure Session (-${ceSpent.toFixed(1)} CE in ${Math.floor(elapsedSeconds / 60)}m)`;

      loadedState.logs = [
        {
          timestamp: now,
          message: logMessage,
          type: "session" as const,
          value: -ceSpent,
        },
        ...(loadedState.logs || []),
      ].slice(0, MAX_LOG_ENTRIES - 1);
    }

    // Clear the active session after applying
    loadedState.activeSessionMode = null;
    loadedState.activeSessionStartTime = null;

    if (__DEV__) {
      console.log(`[BackgroundTimer] Applied ${elapsedSeconds}s of ${sessionMode} time`);
    }
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
    // Reset Safe Break bank at midnight
    if (loadedState.lastSafeBreakResetDate !== today) {
      loadedState.safeBreakSeconds = 0;
      loadedState.lastSafeBreakResetDate = today;
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
      // Also check Safe Break reset in tick
      if (prev.lastSafeBreakResetDate !== today) {
        newState.safeBreakSeconds = 0;
        newState.lastSafeBreakResetDate = today;
      }

      if (currentMode === "study") {
        const earningRate = getEarningRate(
          prev.balance,
          prev.vowState.isActive,
        );
        const ceEarnedPerSecond = earningRate / 60;
        newState.balance =
          Math.round((prev.balance + ceEarnedPerSecond) * 10000) / 10000;
        newState.totalStudySeconds = prev.totalStudySeconds + 1;
        newState.dailyStudySeconds = (prev.dailyStudySeconds || 0) + 1;

        // NCE only earned from streak, NOT from binding vow
        if (prev.streakDays > 0) {
          const ncePerSecond = NCE_EARNING_RATE / 60;
          newState.nceBalance =
            Math.round((prev.nceBalance + ncePerSecond) * 10000) / 10000;
        }

        // Safe Break earning: only when balance >= 0 (not in debt)
        // Earn at 1:5 ratio (1 sec break per 5 sec study = 0.2 sec per tick)
        if (newState.balance >= 0 && !prev.vowState.isActive) {
          const safeBreakEarned = 1 / SAFE_BREAK_EARN_RATIO; // 0.2 seconds per study second
          const newSafeBreak = Math.min(
            SAFE_BREAK_MAX_SECONDS,
            (prev.safeBreakSeconds || 0) + safeBreakEarned
          );
          newState.safeBreakSeconds = Math.round(newSafeBreak * 100) / 100;
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
            ].slice(0, MAX_LOG_ENTRIES - 1);
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
        newState.totalGamingSeconds = prev.totalGamingSeconds + 1;
        newState.dailyGamingSeconds = (prev.dailyGamingSeconds || 0) + 1;

        if (prev.vowState.isActive) {
          // Binding Vow active: use grace time first, then CE
          const availableGrace =
            prev.vowState.graceTimeSeconds - prev.vowState.usedGraceSeconds;
          if (availableGrace > 0) {
            newState.vowState = {
              ...prev.vowState,
              usedGraceSeconds:
                Math.round((prev.vowState.usedGraceSeconds + 1) * 100) / 100,
            };
            // Still using grace time, set safe break state to false
            setTimeout(() => setIsUsingSafeBreak(false), 0);
          } else {
            newState.balance =
              Math.round((prev.balance - CE_PER_SECOND) * 10000) / 10000;
            setTimeout(() => setIsUsingSafeBreak(false), 0);
          }
        } else {
          // No Binding Vow: check Safe Break first
          const availableSafeBreak = prev.safeBreakSeconds || 0;

          if (availableSafeBreak > 0) {
            // Consume Safe Break time (1 second per tick)
            newState.safeBreakSeconds = Math.max(0, availableSafeBreak - 1);
            newState.sessionSafeBreakSecondsUsed = (prev.sessionSafeBreakSecondsUsed || 0) + 1;
            // Timer should be green - we're using Safe Break
            setTimeout(() => setIsUsingSafeBreak(true), 0);
            // Reset notification flag when we have safe break
            safeBreakNotifiedRef.current = false;
          } else {
            // No Safe Break available - consume CE
            newState.balance =
              Math.round((prev.balance - CE_PER_SECOND) * 10000) / 10000;

            // Check if we just transitioned from Safe Break to CE consumption
            if (prev.safeBreakSeconds > 0 && !safeBreakNotifiedRef.current) {
              // Safe Break just depleted - play notification
              safeBreakNotifiedRef.current = true;
              setTimeout(() => {
                playSafeBreakEndNotification();
                setIsUsingSafeBreak(false);
              }, 0);
            } else {
              setTimeout(() => setIsUsingSafeBreak(false), 0);
            }
          }
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
    safeBreakNotifiedRef.current = false; // Reset notification flag for new session
    setState((prev) => ({
      ...prev,
      activeSessionMode: "gaming" as Mode,
      activeSessionStartTime: getServerTime(),
      sessionSafeBreakSecondsUsed: 0, // Reset session Safe Break tracking
    }));
    setMode("gaming");
  }, []);

  const stopTimer = useCallback(() => {
    if (mode !== "idle" && sessionSeconds > 0) {
      setState((prev) => {
        let logMessage = "";
        let value = 0;
        let safeBreakUsed = 0;

        if (mode === "study") {
          const earningRate = getEarningRate(
            prev.balance,
            prev.vowState.isActive,
          );
          value = (earningRate * sessionSeconds) / 60;
          logMessage = `Cursed Energy Gained From Focus Session`;
        } else if (mode === "gaming") {
          // Calculate actual CE spent (session time minus Safe Break time used)
          safeBreakUsed = prev.sessionSafeBreakSecondsUsed || 0;
          const ceSecondsSpent = sessionSeconds - safeBreakUsed;
          value = -(ceSecondsSpent / 60); // Only CE seconds count as spending

          // Format log message based on Safe Break usage
          const totalMinutes = Math.floor(sessionSeconds / 60);
          const ceSpentDisplay = Math.abs(value).toFixed(1);

          if (safeBreakUsed > 0) {
            logMessage = `Spent ${ceSpentDisplay}CE for ${totalMinutes} minutes (Safe Break Usage Involved)`;
          } else {
            logMessage = `Spent Cursed Energy on Leisure Session`;
          }
        }

        const newLog = {
          timestamp: getServerTime(),
          message: logMessage,
          type: "session" as const,
          value: value,
          duration: sessionSeconds,
          safeBreakUsed: safeBreakUsed > 0 ? safeBreakUsed : undefined,
        };

        const currentLogs = prev.logs || [];
        return {
          ...prev,
          activeSessionMode: null,
          activeSessionStartTime: null,
          sessionSafeBreakSecondsUsed: 0, // Reset for next session
          logs: [newLog, ...currentLogs.slice(0, MAX_LOG_ENTRIES - 1)], // Keep max 100 logs
        };
      });
    } else {
      // Clear session even if 0 seconds
      setState((prev) => ({
        ...prev,
        activeSessionMode: null,
        activeSessionStartTime: null,
        sessionSafeBreakSecondsUsed: 0,
      }));
    }

    setIsUsingSafeBreak(false);
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
      ].slice(0, MAX_LOG_ENTRIES - 1),
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
      logs: [newLog, ...currentLogs.slice(0, MAX_LOG_ENTRIES - 1)], // Prepend and keep max 100 logs
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

      if (__DEV__) {
        console.log(`Purified Debt (+${healAmount.toFixed(2)} CE)`);
      }

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
        ].slice(0, MAX_LOG_ENTRIES - 1),
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
    isUsingSafeBreak,
    safeBreakSeconds: state.safeBreakSeconds || 0,
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
