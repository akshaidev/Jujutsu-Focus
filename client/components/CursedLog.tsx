import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, CursedTheme } from "@/constants/theme";

interface LogEntry {
  timestamp: number;
  message: string;
  type: "session" | "sleep" | "system" | "reward" | "vow" | "rct";
  value?: number;
  duration?: number;
}

interface CursedLogProps {
  visible: boolean;
  onClose: () => void;
  logs: LogEntry[];
}

export function CursedLog({ visible, onClose, logs }: CursedLogProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (!visible) return null;

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "session":
        return CursedTheme.cursedColors.cursedPurple;
      case "reward":
        return CursedTheme.cursedColors.agedGold;
      case "vow":
        return CursedTheme.cursedColors.cursedRed;
      case "rct":
        return CursedTheme.cursedColors.success;
      default:
        return theme.textSecondary;
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "session":
        return "activity";
      case "sleep":
        return "moon";
      case "reward":
        return "gift";
      case "vow":
        return "shield";
      case "rct":
        return "zap";
      default:
        return "info";
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.overlay,
        {
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: theme.glass }]}
        >
          <Feather name="x" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.logContainer,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: CursedTheme.cursedColors.cursedRed,
            },
          ]}
        >
          <Text
            style={[
              styles.logTitle,
              { color: CursedTheme.cursedColors.cursedRed },
            ]}
          >
            ~ The Cursed Chronicles ~
          </Text>

          <Text style={[styles.logSubtitle, { color: theme.textSecondary }]}>
            Dark records of your cursed energy transactions
          </Text>

          <View style={styles.logEntries}>
            {logs.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                The chronicles are empty... Begin your journey.
              </Text>
            ) : (
              logs.map((log, index) => (
                <View
                  key={`${log.timestamp}-${index}`}
                  style={[
                    styles.logEntry,
                    {
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.logHeader}>
                    <Feather
                      name={getLogIcon(log.type)}
                      size={16}
                      color={getLogColor(log.type)}
                    />
                    <Text
                      style={[
                        styles.logTimestamp,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {formatDate(log.timestamp)}
                    </Text>
                  </View>
                  <Text style={[styles.logMessage, { color: theme.text }]}>
                    {log.message}
                  </Text>
                  {log.value !== undefined && (
                    <Text
                      style={[
                        styles.logValue,
                        { color: getLogColor(log.type) },
                      ]}
                    >
                      {log.value >= 0 ? "+" : ""}
                      {log.value.toFixed(1)} CE
                    </Text>
                  )}
                  {log.duration !== undefined && (
                    <Text
                      style={[
                        styles.logDuration,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Duration: {formatDuration(log.duration)}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.footer}>
            <Text
              style={[
                styles.logFooter,
                { color: CursedTheme.cursedColors.cursedRed },
              ]}
            >
              ~ Every transaction binds your fate ~
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  logContainer: {
    marginTop: Spacing.lg,
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logTitle: {
    ...CursedTheme.manuscriptTitle,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  logSubtitle: {
    ...CursedTheme.manuscript,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Spacing["2xl"],
    fontSize: 16,
  },
  logEntries: {
    flex: 1,
  },
  emptyText: {
    ...CursedTheme.manuscript,
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: Spacing["2xl"],
  },
  logEntry: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  logTimestamp: {
    ...CursedTheme.manuscript,
    fontSize: 12,
    opacity: 0.7,
  },
  logMessage: {
    ...CursedTheme.manuscript,
    lineHeight: 26,
    marginBottom: Spacing.xs,
  },
  logValue: {
    ...CursedTheme.manuscript,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  logDuration: {
    ...CursedTheme.manuscript,
    fontSize: 12,
    opacity: 0.6,
  },
  footer: {
    marginTop: Spacing["2xl"],
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 0, 0, 0.3)",
  },
  logFooter: {
    ...CursedTheme.manuscript,
    textAlign: "center",
    fontStyle: "italic",
    fontSize: 16,
  },
});
