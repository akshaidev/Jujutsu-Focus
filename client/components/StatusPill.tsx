import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography, Shadows } from "@/constants/theme";

interface StatusPillProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number;
  variant?: "default" | "accent" | "success";
}

export function StatusPill({
  icon,
  label,
  value,
  variant = "default",
}: StatusPillProps) {
  const { theme, isDark } = useTheme();

  const getIconColor = () => {
    if (variant === "accent") return theme.cursedEnergy;
    if (variant === "success") return theme.success;
    return theme.textSecondary;
  };

  const content = (
    <View style={styles.content}>
      <Feather name={icon} size={14} color={getIconColor()} />
      <ThemedText
        style={[styles.text, { color: theme.textSecondary }]}
      >
        {label}:{" "}
        <ThemedText
          style={[
            styles.value,
            {
              color:
                variant === "accent"
                  ? theme.cursedEnergy
                  : variant === "success"
                  ? theme.success
                  : theme.text,
            },
          ]}
        >
          {value}
        </ThemedText>
      </ThemedText>
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          style={styles.blur}
        >
          <View
            style={[styles.innerBorder, { borderColor: theme.glassBorder }]}
          >
            {content}
          </View>
        </BlurView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles.innerBorder,
        { backgroundColor: theme.glass, borderColor: theme.glassBorder },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    ...Shadows.soft,
  },
  blur: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  innerBorder: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  text: {
    ...Typography.statusPill,
  },
  value: {
    ...Typography.statusPill,
    fontWeight: "600",
  },
});
