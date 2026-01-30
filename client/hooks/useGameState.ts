import { useContext } from "react";
import { GameStateContext } from "../context/GameStateContext";

// Re-export types for convenience
export type { GameState, LogType, LogEntry, Mode, VowState } from "./useGameStateInternal";

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
}
