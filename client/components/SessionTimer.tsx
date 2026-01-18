import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface SessionTimerProps {
  mode: "study" | "gaming";
  sessionSeconds: number;
  dailySeconds: number;
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function SessionTimer({
  mode,
  sessionSeconds,
  dailySeconds,
}: SessionTimerProps) {
  const { theme } = useTheme();
  const pulseOpacity = useSharedValue(0.7);

  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const accentColor = mode === "study" ? theme.cursedEnergy : theme.debt;
  const modeLabel = mode === "study" ? "Focus Session" : "Leisure Session";
  const dailyLabel = mode === "study" ? "Today's Total Focus" : "Today's Total Leisure";
  const icon = mode === "study" ? "book-open" : "play";

  return (
    <GlassCard
      variant={mode === "study" ? "accent" : "danger"}
      style={styles.container}
    >
      <View style={styles.header}>
        <Animated.View style={pulseStyle}>
          <Feather name={icon} size={18} color={accentColor} />
        </Animated.View>
        <ThemedText style={[styles.modeLabel, { color: accentColor }]}>
          {modeLabel}
        </ThemedText>
      </View>

      <ThemedText style={[styles.sessionTime, { color: theme.text }]}>
        {formatTime(sessionSeconds)}
      </ThemedText>

      <View style={styles.dailyContainer}>
        <ThemedText style={[styles.dailyLabel, { color: theme.textSecondary }]}>
          {dailyLabel}
        </ThemedText>
        <ThemedText style={[styles.dailyTime, { color: theme.textSecondary }]}>
          {formatTime(dailySeconds)}
        </ThemedText>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  sessionTime: {
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  dailyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  dailyLabel: {
    fontSize: 13,
  },
  dailyTime: {
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
