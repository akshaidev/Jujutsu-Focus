import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { useGameState, LogType } from "@/hooks/useGameState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

type Tab = "scriptures" | "history";

function ScripturesTab() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedText type="h2" style={styles.tabTitle}>
        The Scriptures
      </ThemedText>

      <GlassCard style={styles.card}>
        <ThemedText type="h3" style={styles.cardTitle}>
          Cursed Energy (CE)
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Cursed Energy is the lifeblood of a sorcerer. You gain CE by focusing
          (studying) and lose it during leisure (gaming). Maintain a positive
          balance to empower your techniques.
        </ThemedText>
      </GlassCard>

      <GlassCard style={styles.card}>
        <ThemedText type="h3" style={styles.cardTitle}>
          Debt (The Curse)
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Falling into a negative CE balance puts you in Debt. While in Debt,
          your CE earning rate is significantly reduced. The deeper the debt,
          the slower the gain.
        </ThemedText>
      </GlassCard>

      <GlassCard style={styles.card}>
        <ThemedText type="h3" style={styles.cardTitle}>
          Streaks (Heavenly Gift)
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Maintain a positive CE balance for consecutive days to build a
          Streak. Every 3 days of a streak grants you one use of Reverse Cursed
          Technique (RCT).
        </ThemedText>
      </GlassCard>

      <GlassCard style={styles.card}>
        <ThemedText type="h3" style={styles.cardTitle}>
          RCT (Purification)
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Reverse Cursed Technique allows you to purify your Debt by converting
          Negative Cursed Energy (NCE) into positive CE. It requires one RCT
          credit, earned from streaks.
        </ThemedText>
      </GlassCard>

      <GlassCard style={styles.card}>
        <ThemedText type="h3" style={styles.cardTitle}>
          Binding Vows
        </ThemedText>
        <ThemedText style={styles.cardText}>
          When in Debt, you can sign a Binding Vow once per day. This vow
          temporarily boosts your CE earning rate while studying but comes at a
          cost: any time spent on leisure will drain your CE until the vow is
          fulfilled by reaching a positive balance.
        </ThemedText>
      </GlassCard>
    </ScrollView>
  );
}

function HistoryTab() {
  const { state } = useGameState();
  const { theme } = useTheme();

  const getLogColor = (type: LogType) => {
    switch (type) {
      case "reward":
      case "rct":
        return theme.success;
      case "sleep":
        return theme.cursedEnergy;
      case "vow":
        return theme.debt;
      case "system":
      default:
        return theme.textSecondary;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedText type="h2" style={styles.tabTitle}>
        Cursed History
      </ThemedText>
      {state.logs.length === 0 ? (
        <ThemedText style={styles.emptyText}>No history yet.</ThemedText>
      ) : (
        state.logs.map((log, index) => (
          <GlassCard key={index} style={styles.logCard}>
            <View style={styles.logContainer}>
              <ThemedText
                style={[styles.logText, { color: getLogColor(log.type) }]}
              >
                {log.message}
              </ThemedText>
              <ThemedText style={styles.logTimestamp}>
                {new Date(log.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </ThemedText>
            </View>
          </GlassCard>
        ))
      )}
    </ScrollView>
  );
}

export default function GrimoireScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("scriptures");
  const { theme } = useTheme();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="h1">Grimoire</ThemedText>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "scriptures" && {
              borderBottomColor: theme.cursedEnergy,
            },
          ]}
          onPress={() => setActiveTab("scriptures")}
        >
          <ThemedText
            style={[
              styles.tabLabel,
              activeTab === "scriptures" && { color: theme.cursedEnergy },
            ]}
          >
            Scriptures
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "history" && {
              borderBottomColor: theme.cursedEnergy,
            },
          ]}
          onPress={() => setActiveTab("history")}
        >
          <ThemedText
            style={[
              styles.tabLabel,
              activeTab === "history" && { color: theme.cursedEnergy },
            ]}
          >
            Cursed History
          </ThemedText>
        </Pressable>
      </View>

      {activeTab === "scriptures" ? <ScripturesTab /> : <HistoryTab />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
    paddingHorizontal: Spacing.xl,
  },
  tab: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "grey",
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  tabTitle: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  cardText: {
    lineHeight: 22,
    opacity: 0.9,
  },
  logCard: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logText: {
    fontSize: 14,
    flex: 1,
  },
  logTimestamp: {
    fontSize: 12,
    color: "grey",
    marginLeft: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
    marginTop: Spacing.xl,
    opacity: 0.7,
  },
});
