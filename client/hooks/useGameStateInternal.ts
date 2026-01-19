import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
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

  useEffect(() => {
    loadState();
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

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GameState>;
        const stateWithDefaults = { ...initialState, ...parsed };

        // Also handle nested state objects like vowState
        if (parsed.vowState) {
          stateWithDefaults.vowState = {
            ...initialState.vowState,
            ...parsed.vowState,
          };
        }

        checkMidnightReset(stateWithDefaults);
        checkDailyReset(stateWithDefaults);
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
      const yesterday = new Date();
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
          const elapsed = Date.now() - (prev.vowState.startedAt || 0);

          // Check if 24 hours expired - apply penalty
          if (elapsed >= VOW_DURATION_MS && newState.balance < 0) {
            const currentDebtAbs = Math.abs(newState.balance);
            const penaltyAmount = Math.max(prev.vowState.debtAtVowStart, currentDebtAbs);
            newState.balance = Math.round((newState.balance - penaltyAmount) * 10000) / 10000;
            newState.vowState = {
              ...initialVowState,
              lastVowDate: prev.vowState.lastVowDate,
              vowPenaltyUntil: Date.now() + PENALTY_DURATION_MS,
            };
            newState.logs = [
              {
                timestamp: Date.now(),
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
    setMode("study");
  }, []);

  const startGaming = useCallback(() => {
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
          timestamp: Date.now(),
          message: logMessage,
          type: mode === "study" ? "session" : "session",
          value: value,
          duration: sessionSeconds,
        };

        const currentLogs = prev.logs || [];
        return {
          ...prev,
          logs: [newLog, ...currentLogs.slice(0, 99)], // Keep max 100 logs
        };
      });
    }

    setMode("idle");
  }, [mode, sessionSeconds]);

  const signBindingVow = useCallback(() => {
    const today = getTodayDateString();
    const now = Date.now();

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
        startedAt: Date.now(),
        studySecondsWhileVow: 0,
        graceTimeSeconds: 0,
        usedGraceSeconds: 0,
        lastVowDate: today,
        debtAtVowStart: currentDebt,
        vowPenaltyUntil: null,
      },
      logs: [
        {
          timestamp: Date.now(),
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
      timestamp: Date.now(),
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
            timestamp: Date.now(),
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
    Date.now() < state.vowState.vowPenaltyUntil;
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
