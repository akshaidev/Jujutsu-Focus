import React, { createContext, useContext } from "react";
import { useGameStateInternal, GameState, Mode } from "@/hooks/useGameStateInternal";

interface GameStateContextType {
  state: GameState;
  mode: Mode;
  isLoaded: boolean;
  earningRate: number;
  availableGraceTime: number;
  canSignVow: boolean;
  hasUsedVowToday: boolean;
  showVowSuccess: boolean;
  showSleepModal: boolean;
  sessionSeconds: number;
  isUsingSafeBreak: boolean;
  safeBreakSeconds: number;
  startStudy: () => void;
  startGaming: () => void;
  stopTimer: () => void;
  signBindingVow: () => boolean;
  logSleep: (hours: number) => Promise<boolean>;
  dismissSleepModal: () => void;
  useRCT: () => boolean;
  dismissVowSuccess: () => void;
  resetAllData: () => Promise<void>;
  debugUpdateState: (updates: Partial<GameState>) => void;
}

export const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const gameState = useGameStateInternal();
  return (
    <GameStateContext.Provider value={gameState}>
      {children}
    </GameStateContext.Provider>
  );
}


