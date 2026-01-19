import React, { useEffect } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface RCTButtonProps {
  nceBalance: number;
  rctCredits: number;
  balance: number;
  onUseRCT: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RCTButton({
  nceBalance,
  rctCredits,
  balance,
  onUseRCT,
}: RCTButtonProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);
  const canUse = rctCredits >= 1 && nceBalance >= 0.1 && balance < 0;

  useEffect(() => {
    if (canUse) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, {
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );
    }
  }, [canUse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (canUse) {
      scale.value = withSpring(0.95, springConfig);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    if (canUse) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUseRCT();
    }
  };

  const gradientColors = canUse
    ? isDark
      ? ["#9333EA", "#6366F1", "#8B5CF6"]
      : ["#A855F7", "#818CF8", "#C084FC"]
    : [
        theme.backgroundSecondary,
        theme.backgroundTertiary,
        theme.backgroundSecondary,
      ];

  const buttonTitle = "Use Reverse Cursed Technique";

  const subtitleText =
    rctCredits === 0
      ? "Every 3 Days of Streak Gets You 1 Reverse Cursed Technique Use"
      : balance >= 0
        ? "Only usable in Debt"
        : nceBalance < 0.1
          ? "No NCE to purify"
          : `Convert ${nceBalance.toFixed(1)} NCE to CE`;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!canUse}
      style={[styles.wrapper, animatedStyle]}
    >
      {canUse ? (
        <Animated.View style={[styles.glowOuter, glowStyle]}>
          <LinearGradient
            colors={[
              "rgba(168, 85, 247, 0.4)",
              "rgba(99, 102, 241, 0.2)",
              "rgba(168, 85, 247, 0.4)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowGradient}
          />
        </Animated.View>
      ) : null}
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, !canUse && { opacity: 0.5 }]}
      >
        <Feather
          name="zap"
          size={18}
          color={canUse ? "#FFFFFF" : theme.textSecondary}
        />
        <View style={styles.textContainer}>
          <ThemedText
            style={[
              styles.title,
              { color: canUse ? "#FFFFFF" : theme.textSecondary },
            ]}
          >
            {buttonTitle}
          </ThemedText>
          <ThemedText
            style={[
              styles.subtitle,
              { color: canUse ? "rgba(255,255,255,0.8)" : theme.textSecondary },
            ]}
          >
            {subtitleText}
          </ThemedText>
        </View>
        <View
          style={[
            styles.creditBadge,
            {
              backgroundColor: canUse
                ? "rgba(255,255,255,0.2)"
                : theme.backgroundTertiary,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.creditText,
              { color: canUse ? "#FFFFFF" : theme.textSecondary },
            ]}
          >
            {rctCredits} RCT
          </ThemedText>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.lg,
    position: "relative",
  },
  glowOuter: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.xl + 4,
    overflow: "hidden",
  },
  glowGradient: {
    flex: 1,
    borderRadius: BorderRadius.xl + 4,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  creditBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  creditText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
