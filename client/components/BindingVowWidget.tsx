import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { BindingVowConfirmModal } from "@/components/BindingVowConfirmModal";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { getServerTime } from "@/utils/timeService";
import { VOW_DURATION_MS } from "@/constants/gameConfig";

interface BindingVowWidgetProps {
  isVowActive: boolean;
  canSignVow: boolean;
  hasUsedVowToday: boolean;
  graceTimeSeconds: number;
  vowStartedAt: number | null;
  vowPenaltyUntil: number | null;
  onSignVow: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatTimeWithHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);


export function BindingVowWidget({
  isVowActive,
  canSignVow,
  hasUsedVowToday,
  graceTimeSeconds,
  vowStartedAt,
  vowPenaltyUntil,
  onSignVow,
}: BindingVowWidgetProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [penaltyTimeLeftSeconds, setPenaltyTimeLeftSeconds] = useState(0);

  // Calculate and update 24hr countdown
  useEffect(() => {
    if (isVowActive && vowStartedAt) {
      const updateTimeLeft = () => {
        const elapsed = getServerTime() - vowStartedAt;
        const remaining = Math.max(0, VOW_DURATION_MS - elapsed);
        setTimeLeftSeconds(Math.floor(remaining / 1000));
      };

      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [isVowActive, vowStartedAt]);

  // Calculate and update penalty countdown
  useEffect(() => {
    if (vowPenaltyUntil && getServerTime() < vowPenaltyUntil) {
      const updatePenaltyTimeLeft = () => {
        const remaining = Math.max(0, vowPenaltyUntil - getServerTime());
        setPenaltyTimeLeftSeconds(Math.floor(remaining / 1000));
      };

      updatePenaltyTimeLeft();
      const interval = setInterval(updatePenaltyTimeLeft, 1000);
      return () => clearInterval(interval);
    } else {
      setPenaltyTimeLeftSeconds(0);
    }
  }, [vowPenaltyUntil]);

  useEffect(() => {
    if (isVowActive) {
      pulseOpacity.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
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
      scale.value = withTiming(0.98, { duration: 100, easing: Easing.out(Easing.quad) });
    }
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
  };

  const handlePress = () => {
    if (canSignVow) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmVow = () => {
    setShowConfirmModal(false);
    onSignVow();
  };

  const handleCancelVow = () => {
    setShowConfirmModal(false);
  };

  if (isVowActive) {
    return (
      <GlassCard variant="accent" style={styles.card}>
        <View style={styles.activeHeader}>
          <Animated.View style={pulseStyle}>
            <Feather name="shield" size={20} color={theme.cursedEnergy} />
          </Animated.View>
          <ThemedText
            style={[styles.activeTitle, { color: theme.cursedEnergy }]}
          >
            Binding Vow Active
          </ThemedText>
        </View>

        {/* Two timers side by side */}
        <View style={styles.timersRow}>
          {/* Grace Time */}
          <View style={styles.timerBox}>
            <ThemedText
              style={[styles.timerLabel, { color: theme.textSecondary }]}
            >
              Grace Time
            </ThemedText>
            <ThemedText style={[styles.timerValue, { color: theme.cursedEnergy }]}>
              {formatTime(graceTimeSeconds)}
            </ThemedText>
          </View>

          {/* Divider */}
          <View style={[styles.timerDivider, { backgroundColor: theme.glassBorder }]} />

          {/* 24hr Countdown */}
          <View style={styles.timerBox}>
            <ThemedText
              style={[styles.timerLabel, { color: theme.textSecondary }]}
            >
              Time Left
            </ThemedText>
            <ThemedText style={[styles.timerValue, { color: theme.debt }]}>
              {formatTimeWithHours(timeLeftSeconds)}
            </ThemedText>
          </View>
        </View>
      </GlassCard>
    );
  }

  const isInPenaltyPeriod = penaltyTimeLeftSeconds > 0;
  const isDisabled = !canSignVow || isInPenaltyPeriod;

  // Get disabled state text
  const getDisabledTitle = () => {
    if (isInPenaltyPeriod) return "Vow Recoiled";
    if (hasUsedVowToday) return "Limit Reached";
    return "Sign Binding Vow";
  };

  const getDisabledSubtitle = () => {
    if (isInPenaltyPeriod) {
      return `Available in ${formatTimeWithHours(penaltyTimeLeftSeconds)}`;
    }
    if (hasUsedVowToday) return "1 vow per day, come back tomorrow";
    return "+0.5 CE/min boost and earn grace time";
  };

  return (
    <>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[animatedStyle, isDisabled && styles.disabled]}
      >
        <GlassCard
          variant={isDisabled ? "default" : "danger"}
          style={styles.card}
        >
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
                {getDisabledTitle()}
              </ThemedText>
              <ThemedText
                style={[styles.signSubtitle, { color: isInPenaltyPeriod ? theme.debt : theme.textSecondary }]}
              >
                {getDisabledSubtitle()}
              </ThemedText>
            </View>
            {!isDisabled ? (
              <Feather name="chevron-right" size={20} color={theme.debt} />
            ) : null}
          </View>
        </GlassCard>
      </AnimatedPressable>

      <BindingVowConfirmModal
        visible={showConfirmModal}
        onConfirm={handleConfirmVow}
        onCancel={handleCancelVow}
      />
    </>
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
  timersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  timerBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  timerDivider: {
    width: 1,
    height: 40,
    opacity: 0.5,
  },
  timerLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  timerValue: {
    fontSize: 24,
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
