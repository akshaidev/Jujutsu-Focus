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
}

type Mode = "idle" | "study" | "gaming";

const initialVowState: VowState = {
  isActive: false,
  startedAt: null,
  studySecondsWhileVow: 0,
  graceTimeSeconds: 0,
  usedGraceSeconds: 0,
  lastVowDate: null,
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

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const [mode, setMode] = useState<Mode>("idle");
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVowSuccess, setShowVowSuccess] = useState(false);
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
        const parsed = JSON.parse(stored) as GameState;
        checkMidnightReset(parsed);
        checkDailyReset(parsed);
        setState(parsed);
      }
    } catch (error) {
      console.error("Failed to load state:", error);
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
        const earningRate = getEarningRate(prev.balance, prev.vowState.isActive);
        const cePerSecond = earningRate / 60;
        newState.balance = Math.round((prev.balance + cePerSecond) * 10000) / 10000;
        newState.totalStudySeconds = prev.totalStudySeconds + 1;
        newState.dailyStudySeconds = (prev.dailyStudySeconds || 0) + 1;

        if (prev.streakDays > 0 || prev.vowState.isActive) {
          const ncePerSecond = 0.5 / 60;
          newState.nceBalance = Math.round((prev.nceBalance + ncePerSecond) * 10000) / 10000;
        }

        if (prev.vowState.isActive) {
          const graceEarned = 0.2;
          newState.vowState = {
            ...prev.vowState,
            studySecondsWhileVow: prev.vowState.studySecondsWhileVow + 1,
            graceTimeSeconds: Math.round((prev.vowState.graceTimeSeconds + graceEarned) * 100) / 100,
          };

          if (newState.balance >= 0) {
            const bonusCE = (newState.vowState.graceTimeSeconds - newState.vowState.usedGraceSeconds) / 60;
            newState.balance = Math.round((newState.balance + bonusCE) * 10000) / 10000;
            newState.vowState = { ...initialVowState, lastVowDate: prev.vowState.lastVowDate };
            setTimeout(() => setShowVowSuccess(true), 100);
          }
        }
      } else if (currentMode === "gaming") {
        const cePerSecond = 1.0 / 60;
        newState.totalGamingSeconds = prev.totalGamingSeconds + 1;
        newState.dailyGamingSeconds = (prev.dailyGamingSeconds || 0) + 1;
        
        if (prev.vowState.isActive) {
          const availableGrace = prev.vowState.graceTimeSeconds - prev.vowState.usedGraceSeconds;
          if (availableGrace > 0) {
            newState.vowState = {
              ...prev.vowState,
              usedGraceSeconds: Math.round((prev.vowState.usedGraceSeconds + 1) * 100) / 100,
            };
          } else {
            newState.balance = Math.round((prev.balance - cePerSecond) * 10000) / 10000;
          }
        } else {
          newState.balance = Math.round((prev.balance - cePerSecond) * 10000) / 10000;
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
    setMode("idle");
  }, []);

  const signBindingVow = useCallback(() => {
    const today = getTodayDateString();
    if (state.vowState.lastVowDate === today) {
      return false;
    }
    if (state.balance >= 0) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      vowState: {
        isActive: true,
        startedAt: Date.now(),
        studySecondsWhileVow: 0,
        graceTimeSeconds: 0,
        usedGraceSeconds: 0,
        lastVowDate: today,
      },
    }));
    return true;
  }, [state.balance, state.vowState.lastVowDate]);

  const useRCT = useCallback(() => {
    if (state.rctCredits < 1 || state.nceBalance < 1) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + prev.nceBalance) * 10000) / 10000,
      nceBalance: 0,
      rctCredits: prev.rctCredits - 1,
    }));
    return true;
  }, [state.rctCredits, state.nceBalance]);

  const dismissVowSuccess = useCallback(() => {
    setShowVowSuccess(false);
  }, []);

  const resetAllData = useCallback(async () => {
    setState(initialState);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const earningRate = getEarningRate(state.balance, state.vowState.isActive);
  const availableGraceTime = Math.max(
    0,
    state.vowState.graceTimeSeconds - state.vowState.usedGraceSeconds
  );
  const canSignVow =
    state.balance < 0 && state.vowState.lastVowDate !== getTodayDateString();
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
    sessionSeconds,
    startStudy,
    startGaming,
    stopTimer,
    signBindingVow,
    useRCT,
    dismissVowSuccess,
    resetAllData,
  };
}
