import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, CursedTheme } from "@/constants/theme";

interface CursedGuideProps {
  visible: boolean;
  onClose: () => void;
}

export function CursedGuide({ visible, onClose }: CursedGuideProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.overlay,
        {
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: theme.glass }]}
        >
          <Feather name="x" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.manuscriptContainer,
            {
              backgroundColor: CursedTheme.cursedColors.parchment,
              borderColor: CursedTheme.cursedColors.agedGold,
            },
          ]}
        >
          <Text
            style={[
              styles.manuscriptTitle,
              { color: CursedTheme.cursedColors.ink },
            ]}
          >
            ~ The Tome of Cursed Focus ~
          </Text>

          <Text
            style={[
              styles.manuscriptSubtitle,
              { color: CursedTheme.cursedColors.manuscript },
            ]}
          >
            Ancient wisdom for mastering the art of productivity through cursed
            energy
          </Text>

          <View style={styles.section}>
            <Text
              style={[
                styles.manuscriptHeading,
                { color: CursedTheme.cursedColors.cursedPurple },
              ]}
            >
              I. The Nature of Cursed Energy
            </Text>
            <Text
              style={[
                styles.manuscriptText,
                { color: CursedTheme.cursedColors.manuscript },
              ]}
            >
              In this realm, your focus manifests as Cursed Energy (CE). Every
              moment of dedicated study generates +1.0 CE per minute, while
              leisure activities consume -1.0 CE per minute. This sacred balance
              forms the foundation of your power.
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.manuscriptHeading,
                { color: CursedTheme.cursedColors.cursedPurple },
              ]}
            >
              II. The Path of Negative Cursed Energy
            </Text>
            <Text
              style={[
                styles.manuscriptText,
                { color: CursedTheme.cursedColors.manuscript },
              ]}
            >
              Should your balance fall below zero, you enter the realm of debt.
              Here, the very laws of cursed energy shift against you—your
              earning rate diminishes with each deeper level of negative
              balance, making recovery increasingly difficult.
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.manuscriptHeading,
                { color: CursedTheme.cursedColors.cursedPurple },
              ]}
            >
              III. The Binding Vow Contract
            </Text>
            <Text
              style={[
                styles.manuscriptText,
                { color: CursedTheme.cursedColors.manuscript },
              ]}
            >
              When cursed by debt, you may invoke the Binding Vow—a sacred
              contract granting temporary grace to restore your balance. But
              beware, for this power comes at a cost: the vow may only be
              invoked once per day, and its terms are absolute.
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.manuscriptHeading,
                { color: CursedTheme.cursedColors.cursedPurple },
              ]}
            >
              IV. Reverse Cursed Technique
            </Text>
            <Text
              style={[
                styles.manuscriptText,
                { color: CursedTheme.cursedColors.manuscript },
              ]}
            >
              Through unwavering discipline, you may unlock Reverse Cursed
              Technique (RCT). For every 3 consecutive days you maintain a
              positive daily balance, you earn exactly 1 RCT credit. This rare
              currency holds the power to reverse even the deepest curses of
              debt—use it wisely, young sorcerer.
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.manuscriptHeading,
                { color: CursedTheme.cursedColors.cursedPurple },
              ]}
            >
              V. The Sacred Streak
            </Text>
            <Text
              style={[
                styles.manuscriptText,
                { color: CursedTheme.cursedColors.manuscript },
              ]}
            >
              Your journey is measured in sacred streaks—consecutive days of
              positive cursed energy generation. Each day you maintain a
              positive balance strengthens your streak, while any day of
              negative balance breaks the chain, resetting your progress.
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.manuscriptHeading,
                { color: CursedTheme.cursedColors.cursedPurple },
              ]}
            >
              VI. The Daily Reset Ritual
            </Text>
            <Text
              style={[
                styles.manuscriptText,
                { color: CursedTheme.cursedColors.manuscript },
              ]}
            >
              With each dawn, the cursed energies reset. Log your sleep to
              complete the daily cycle and determine whether your streak
              continues or breaks. The morning brings new opportunities to
              master your cursed energy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.manuscriptHeading,
                { color: CursedTheme.cursedColors.cursedRed },
              ]}
            >
              VII. Words of Ancient Warning
            </Text>
            <Text
              style={[
                styles.manuscriptText,
                { color: CursedTheme.cursedColors.manuscript },
              ]}
            >
              Heed these words, young sorcerer: The path of cursed energy
              demands balance. Too much focus leads to burnout; too much leisure
              leads to ruin. The wisest sorcerers know when to study and when to
              rest, for both are essential to mastery.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text
              style={[
                styles.manuscriptFooter,
                { color: CursedTheme.cursedColors.agedGold },
              ]}
            >
              ~ May your cursed energy flow eternal ~
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  manuscriptContainer: {
    marginTop: Spacing.lg,
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  manuscriptTitle: {
    ...CursedTheme.manuscriptTitle,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  manuscriptSubtitle: {
    ...CursedTheme.manuscript,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  manuscriptHeading: {
    ...CursedTheme.manuscriptHeading,
    marginBottom: Spacing.md,
  },
  manuscriptText: {
    ...CursedTheme.manuscript,
    lineHeight: 32,
  },
  footer: {
    marginTop: Spacing["2xl"],
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(218, 165, 32, 0.3)",
  },
  manuscriptFooter: {
    ...CursedTheme.manuscript,
    textAlign: "center",
    fontStyle: "italic",
    fontSize: 16,
  },
});
