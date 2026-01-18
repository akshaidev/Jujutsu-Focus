import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { GameState } from "@/hooks/useGameState";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

interface DebugPanelProps {
  state: GameState;
  earningRate: number;
  debugUpdateState: (updates: Partial<GameState>) => void;
}

export function DebugPanel({
  state,
  earningRate,
  debugUpdateState,
}: DebugPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const consumptionRate = 1.0;
  const nceRate = state.streakDays > 0 || state.vowState.isActive ? 0.5 : 0.0;

  const handleUpdate = (updates: Partial<GameState>) => {
    debugUpdateState(updates);
  };

  const resetVow = () => {
    debugUpdateState({
      vowState: { ...state.vowState, lastVowDate: null },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setIsCollapsed(!isCollapsed)}>
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>
            DEV: Debug Panel {isCollapsed ? "▼" : "▲"}
          </ThemedText>
        </View>
      </Pressable>
      {!isCollapsed && (
        <View style={styles.panel}>
          <View style={styles.metricsContainer}>
            <ThemedText style={styles.metric}>
              CE Rate: {earningRate.toFixed(1)}/min
            </ThemedText>
            <ThemedText style={styles.metric}>
              Consumption: {consumptionRate.toFixed(1)}/min
            </ThemedText>
            <ThemedText style={styles.metric}>
              NCE Rate: {nceRate.toFixed(1)}/min
            </ThemedText>
          </View>
          <View style={styles.controlsContainer}>
            <View style={styles.controlRow}>
              <ThemedText style={styles.controlLabel}>Streak</ThemedText>
              <Pressable
                style={styles.button}
                onPress={() =>
                  handleUpdate({ streakDays: state.streakDays - 1 })
                }
              >
                <ThemedText style={styles.buttonText}>-1</ThemedText>
              </Pressable>
              <ThemedText style={styles.controlValue}>
                {state.streakDays}
              </ThemedText>
              <Pressable
                style={styles.button}
                onPress={() =>
                  handleUpdate({ streakDays: state.streakDays + 1 })
                }
              >
                <ThemedText style={styles.buttonText}>+1</ThemedText>
              </Pressable>
            </View>
            <View style={styles.controlRow}>
              <ThemedText style={styles.controlLabel}>RCT</ThemedText>
              <Pressable
                style={styles.button}
                onPress={() =>
                  handleUpdate({ rctCredits: state.rctCredits - 1 })
                }
              >
                <ThemedText style={styles.buttonText}>-1</ThemedText>
              </Pressable>
              <ThemedText style={styles.controlValue}>
                {state.rctCredits}
              </ThemedText>
              <Pressable
                style={styles.button}
                onPress={() =>
                  handleUpdate({ rctCredits: state.rctCredits + 1 })
                }
              >
                <ThemedText style={styles.buttonText}>+1</ThemedText>
              </Pressable>
            </View>
            <Pressable style={styles.fullWidthButton} onPress={resetVow}>
              <ThemedText style={styles.buttonText}>
                Reset Daily Vow Limit
              </ThemedText>
            </Pressable>
            <View style={styles.controlRow}>
              <Pressable
                style={styles.halfWidthButton}
                onPress={() => handleUpdate({ balance: -20 })}
              >
                <ThemedText style={styles.buttonText}>Force Debt</ThemedText>
              </Pressable>
              <Pressable
                style={styles.halfWidthButton}
                onPress={() => handleUpdate({ balance: 100 })}
              >
                <ThemedText style={styles.buttonText}>Force Rich</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    backgroundColor: "#1E1E1E",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#00FF41",
    overflow: "hidden",
  },
  header: {
    padding: Spacing.md,
    backgroundColor: "#111",
  },
  headerText: {
    color: "#00FF41",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  panel: {
    padding: Spacing.md,
  },
  metricsContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: "#00FF41",
    borderRadius: BorderRadius.sm,
  },
  metric: {
    color: "#FFFFFF",
    fontFamily: "monospace",
    fontSize: 12,
  },
  controlsContainer: {
    gap: Spacing.md,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  controlLabel: {
    color: "#00FF41",
    fontFamily: "monospace",
    fontSize: 14,
    flex: 1,
  },
  controlValue: {
    color: "#FFFFFF",
    fontFamily: "monospace",
    fontSize: 14,
    minWidth: 30,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#333",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  buttonText: {
    color: "#00FF41",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  fullWidthButton: {
    backgroundColor: "#333",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  halfWidthButton: {
    backgroundColor: "#333",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    flex: 1,
  },
});
