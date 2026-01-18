import React from "react";
import { StyleSheet, View, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Pressable } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "default" | "accent" | "danger";
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  style,
  onPress,
  disabled = false,
  variant = "default",
}: GlassCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const getBorderColor = () => {
    if (variant === "accent") return theme.cursedEnergy;
    if (variant === "danger") return theme.debt;
    return theme.glassBorder;
  };

  const getBackgroundTint = () => {
    if (variant === "accent") return theme.cursedEnergyBg;
    if (variant === "danger") return theme.debtBg;
    return undefined;
  };

  const content = (
    <View style={[styles.innerContent, { borderColor: getBorderColor() }]}>
      {getBackgroundTint() ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: getBackgroundTint(),
              borderRadius: BorderRadius.xl,
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <AnimatedPressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || !onPress}
        style={[styles.container, animatedStyle, style]}
      >
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={styles.blur}
        >
          {content}
        </BlurView>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={[
        styles.container,
        { backgroundColor: theme.glass },
        animatedStyle,
        style,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadows.soft,
  },
  blur: {
    flex: 1,
  },
  innerContent: {
    flex: 1,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
});
