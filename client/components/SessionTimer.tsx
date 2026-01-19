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

  const accentColor = mode === "study" ? theme.cursedEnergy : theme.debt;
  const modeLabel = mode === "study" ? "Focus Session" : "Leisure Session";
  const dailyLabel =
    mode === "study" ? "Today's Total Focus" : "Today's Total Leisure";
  const icon = mode === "study" ? "book-open" : "play";

  const getBorderColor = () => {
    return mode === "study" ? theme.cursedEnergy : theme.debt;
  };

  const getBackgroundTint = () => {
    return mode === "study" ? theme.cursedEnergyBg : theme.debtBg;
  };

  const innerContent = (
    <View style={[styles.innerContent, { borderColor: getBorderColor() }]}>
      <View
        style={[styles.tintOverlay, { backgroundColor: getBackgroundTint() }]}
      />
      <View style={styles.header}>
        <Animated.View style={pulseStyle}>
          <Feather name={icon} size={18} color={accentColor} />
        </Animated.View>
        <ThemedText style={[styles.modeLabel, { color: accentColor }]}>
          {modeLabel}
        </ThemedText>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: theme.textSecondary, opacity: 0.3, marginVertical: Spacing.sm }} />

      <ThemedText style={[styles.sessionTime, { color: theme.text }]}>
        {formatTime(sessionSeconds)}
      </ThemedText>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: theme.textSecondary, opacity: 0.3, marginVertical: Spacing.sm }} />

      <View
        style={[styles.dailyContainer, { borderTopColor: theme.glassBorder }]}
      >
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
    padding: Spacing.xl,
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
    justifyContent: "space-between",
    width: "100%",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
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
