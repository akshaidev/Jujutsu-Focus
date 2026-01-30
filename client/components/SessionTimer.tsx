import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SessionTimerProps {
  mode: "study" | "gaming";
  sessionSeconds: number;
  dailySeconds: number;
  isUsingSafeBreak?: boolean;
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
  isUsingSafeBreak = false,
}: SessionTimerProps) {
  const { theme, isDark } = useTheme();
  const pulseOpacity = useSharedValue(0.7);

  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Safe Break in gaming mode = green color
  const isSafeBreakActive = mode === "gaming" && isUsingSafeBreak;

  const accentColor = mode === "study"
    ? theme.cursedEnergy
    : isSafeBreakActive
      ? theme.success  // Green when using Safe Break
      : theme.debt;    // Red when consuming CE

  const modeLabel = mode === "study"
    ? "Focus Session"
    : isSafeBreakActive
      ? "Safe Break Active"
      : "Leisure Session";

  const dailyLabel =
    mode === "study" ? "Today's Total Focus" : "Today's Total Leisure";
  const icon = mode === "study" ? "book-open" : isSafeBreakActive ? "shield" : "play";

  const getBorderColor = () => {
    if (mode === "study") return theme.cursedEnergy;
    return isSafeBreakActive ? theme.success : theme.debt;
  };

  const getBackgroundTint = () => {
    if (mode === "study") return theme.cursedEnergyBg;
    return isSafeBreakActive ? theme.successBg : theme.debtBg;
  };

  const innerContent = (
    <View style={[styles.innerContent, { borderColor: getBorderColor() }]}>
      <View
        style={[styles.tintOverlay, { backgroundColor: getBackgroundTint() }]}
      />

      {/* Header - Mode Label */}
      <View style={styles.header}>
        <Animated.View style={pulseStyle}>
          <Feather name={icon} size={16} color={accentColor} />
        </Animated.View>
        <ThemedText style={[styles.modeLabel, { color: accentColor }]}>
          {modeLabel}
        </ThemedText>
      </View>

      {/* Main Timer - Prominent Display */}
      <View style={styles.sessionTimeContainer}>
        <ThemedText style={[styles.sessionTime, { color: theme.text }]}>
          {formatTime(sessionSeconds)}
        </ThemedText>
      </View>

      {/* Daily Total - Compact Footer */}
      <View style={styles.dailyContainer}>
        <ThemedText style={[styles.dailyLabel, { color: theme.textSecondary }]}>
          {dailyLabel}
        </ThemedText>
        <ThemedText style={[styles.dailyTime, { color: theme.textSecondary }]}>
          {formatTime(dailySeconds)}
        </ThemedText>
      </View>
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={styles.blur}
        >
          {innerContent}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.glass }]}>
      {innerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  blur: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  innerContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  sessionTimeContainer: {
    paddingVertical: Spacing.lg,
  },
  sessionTime: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -2,
    lineHeight: 64,
  },
  dailyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150, 150, 150, 0.3)",
  },
  dailyLabel: {
    fontSize: 12,
  },
  dailyTime: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
