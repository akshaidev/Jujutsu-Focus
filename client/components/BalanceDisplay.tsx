import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing } from "@/constants/theme";

interface BalanceDisplayProps {
  balance: number;
  earningRate: number;
  mode: "idle" | "study" | "gaming";
}

const springConfig: WithSpringConfig = {
  damping: 20,
  mass: 0.5,
  stiffness: 100,
};

export function BalanceDisplay({
  balance,
  earningRate,
  mode,
}: BalanceDisplayProps) {
  const { theme } = useTheme();
  const isNegative = balance < 0;
  const pulseScale = useSharedValue(1);
  const displayScale = useSharedValue(1);

  useEffect(() => {
    if (isNegative) {
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.02, { damping: 10, stiffness: 100 }),
          withSpring(1, { damping: 10, stiffness: 100 }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withSpring(1, springConfig);
    }
  }, [isNegative]);

  useEffect(() => {
    displayScale.value = withSpring(1.05, { damping: 10, stiffness: 200 });
    setTimeout(() => {
      displayScale.value = withSpring(1, springConfig);
    }, 100);
  }, [Math.floor(balance * 100)]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * displayScale.value }],
  }));

  const formatBalance = (val: number): string => {
    const formatted = Math.abs(val).toFixed(2);
    return val < 0 ? `-${formatted}` : formatted;
  };

  const getModeLabel = () => {
    if (mode === "study") return `+${earningRate.toFixed(2)} CE/min`;
    if (mode === "gaming") return "-1.00 CE/min";
    return "Cursed Energy";
  };

  const getModeColor = () => {
    if (mode === "study") return theme.cursedEnergy;
    if (mode === "gaming") return theme.debt;
    return theme.textSecondary;
  };

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: getModeColor() }]}>
        {getModeLabel()}
      </ThemedText>
      <Animated.View style={animatedStyle}>
        <ThemedText
          style={[
            styles.balance,
            { color: isNegative ? theme.debt : theme.text },
          ]}
        >
          {formatBalance(balance)}
        </ThemedText>
      </Animated.View>
      <ThemedText style={[styles.unit, { color: theme.textSecondary }]}>
        CE
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  balance: {
    ...Typography.balance,
  },
  unit: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: Spacing.xs,
  },
});
