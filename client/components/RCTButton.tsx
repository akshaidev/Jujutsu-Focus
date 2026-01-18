import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface RCTButtonProps {
  nceBalance: number;
  rctCredits: number;
  onUseRCT: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RCTButton({ nceBalance, rctCredits, onUseRCT }: RCTButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const canUse = rctCredits >= 1 && nceBalance >= 1;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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

  if (rctCredits < 1) {
    return null;
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!canUse}
      style={[
        styles.container,
        {
          backgroundColor: canUse ? theme.success : theme.backgroundSecondary,
          opacity: canUse ? 1 : 0.5,
        },
        animatedStyle,
      ]}
    >
      <Feather name="zap" size={16} color={canUse ? "#FFFFFF" : theme.textSecondary} />
      <ThemedText
        style={[styles.text, { color: canUse ? "#FFFFFF" : theme.textSecondary }]}
      >
        Use RCT ({nceBalance.toFixed(1)} NCE → CE)
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
});
