import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, CursedTheme } from "@/constants/theme";

interface HistoryLogButtonProps {
  onPress: () => void;
}

export function HistoryLogButton({ onPress }: HistoryLogButtonProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + Spacing.lg,
          right: Spacing.lg,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            backgroundColor: theme.glass,
            borderColor: CursedTheme.cursedColors.cursedRed,
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Feather
            name="clock"
            size={24}
            color={CursedTheme.cursedColors.cursedRed}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 100,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: "rgba(30, 30, 30, 0.9)",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
