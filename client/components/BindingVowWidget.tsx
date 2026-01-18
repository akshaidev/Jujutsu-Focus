import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface BindingVowWidgetProps {
  isVowActive: boolean;
  canSignVow: boolean;
  hasUsedVowToday: boolean;
  graceTimeSeconds: number;
  onSignVow: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BindingVowWidget({
  isVowActive,
  canSignVow,
  hasUsedVowToday,
  graceTimeSeconds,
  onSignVow,
}: BindingVowWidgetProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  React.useEffect(() => {
    if (isVowActive) {
      pulseOpacity.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isVowActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePressIn = () => {
    if (canSignVow) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    if (canSignVow) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onSignVow();
    }
  };

  if (isVowActive) {
    return (
      <GlassCard variant="accent" style={styles.card}>
        <View style={styles.activeHeader}>
          <Animated.View style={pulseStyle}>
            <Feather name="shield" size={20} color={theme.cursedEnergy} />
          </Animated.View>
          <ThemedText style={[styles.activeTitle, { color: theme.cursedEnergy }]}>
            Binding Vow Active
          </ThemedText>
        </View>
        <View style={styles.graceContainer}>
          <ThemedText style={[styles.graceLabel, { color: theme.textSecondary }]}>
            Grace Time Available
          </ThemedText>
          <ThemedText style={[styles.graceTime, { color: theme.cursedEnergy }]}>
            {formatTime(graceTimeSeconds)}
          </ThemedText>
        </View>
      </GlassCard>
    );
  }

  const isDisabled = !canSignVow && hasUsedVowToday;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[animatedStyle, isDisabled && styles.disabled]}
    >
      <GlassCard variant={isDisabled ? "default" : "danger"} style={styles.card}>
        <View style={styles.signContainer}>
          <Feather
            name="shield"
            size={24}
            color={isDisabled ? theme.textSecondary : theme.debt}
          />
          <View style={styles.signTextContainer}>
            <ThemedText
              style={[
                styles.signTitle,
                { color: isDisabled ? theme.textSecondary : theme.text },
              ]}
            >
              {isDisabled ? "Limit Reached" : "Sign Binding Vow"}
            </ThemedText>
            <ThemedText style={[styles.signSubtitle, { color: theme.textSecondary }]}>
              {isDisabled
                ? "1 vow per day, come back tomorrow"
                : "+0.5 CE/min boost and earn grace time"}
            </ThemedText>
          </View>
          {!isDisabled ? (
            <Feather name="chevron-right" size={20} color={theme.debt} />
          ) : null}
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.lg,
  },
  disabled: {
    opacity: 0.6,
  },
  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  graceContainer: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  graceLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  graceTime: {
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  signContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  signTextContainer: {
    flex: 1,
  },
  signTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  signSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
