import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface ControlButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  activeLabel?: string;
  variant?: "study" | "gaming";
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.4,
  stiffness: 120,
  overshootClamping: false,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ControlButton({
  icon,
  label,
  onPress,
  isActive = false,
  activeLabel = "Stop",
  variant = "study",
}: ControlButtonProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getActiveColor = () => {
    return variant === "study" ? theme.cursedEnergy : theme.debt;
  };

  const renderContent = () => (
    <View
      style={[
        styles.content,
        isActive && {
          backgroundColor: getActiveColor(),
        },
        { borderColor: isActive ? getActiveColor() : theme.glassBorder },
      ]}
    >
      <Feather
        name={isActive ? "square" : icon}
        size={28}
        color={isActive ? "#FFFFFF" : theme.text}
      />
      <ThemedText
        style={[
          styles.label,
          { color: isActive ? "#FFFFFF" : theme.text },
        ]}
      >
        {isActive ? activeLabel : label}
      </ThemedText>
    </View>
  );

  if (Platform.OS === "ios" && !isActive) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.container, animatedStyle]}
      >
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={styles.blur}
        >
          {renderContent()}
        </BlurView>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        !isActive && { backgroundColor: theme.glass },
        animatedStyle,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadows.medium,
  },
  blur: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
