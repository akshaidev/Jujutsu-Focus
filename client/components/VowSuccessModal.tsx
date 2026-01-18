import React, { useEffect } from "react";
import { StyleSheet, View, Modal, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface VowSuccessModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function VowSuccessModal({ visible, onDismiss }: VowSuccessModalProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      checkScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.3, { damping: 8, stiffness: 150 }),
          withSpring(1, { damping: 10, stiffness: 120 })
        )
      );
    } else {
      scale.value = 0;
      checkScale.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.content,
            { backgroundColor: theme.backgroundRoot },
            containerStyle,
          ]}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.successBg },
              checkStyle,
            ]}
          >
            <Feather name="check" size={40} color={theme.success} />
          </Animated.View>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Vow Fulfilled
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your balance is restored. Grace time has been converted to bonus CE.
          </ThemedText>
          <Button onPress={onDismiss} style={styles.button}>
            Continue
          </Button>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  content: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing["3xl"],
    alignItems: "center",
    ...Shadows.medium,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  button: {
    width: "100%",
  },
});
