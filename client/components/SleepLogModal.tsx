import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { ThemedText } from "./ThemedText";
import { useGameState } from "../hooks/useGameState";
import { Button } from "./Button";
import { ControlButton } from "./ControlButton";
import Spacer from "./Spacer";
import { useTheme } from "../hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const springConfig = {
  damping: 18,
  stiffness: 250,
  mass: 0.9,
};

export function SleepLogModal() {
  const { showSleepModal, logSleep, dismissSleepModal } = useGameState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hours, setHours] = useState(7);
  const { theme, isDark } = useTheme();

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (showSleepModal) {
      setIsModalVisible(true);
      scale.value = withSpring(1, springConfig);
      opacity.value = withTiming(1, { duration: 150 });
    }
  }, [showSleepModal]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handleClose = (callback: () => void) => {
    scale.value = withSpring(0.9, springConfig);
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(callback)();
      runOnJS(setIsModalVisible)(false);
    });
  };

  const handleLogSleep = () => {
    handleClose(() => logSleep(hours));
  };

  const handleDismiss = () => {
    handleClose(dismissSleepModal);
  };

  const incrementHours = () => {
    setHours((h) => Math.min(h + 1, 24));
  };

  const decrementHours = () => {
    setHours((h) => Math.max(h - 1, 1));
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={handleDismiss}
    >
      <BlurView
        style={styles.centeredView}
        intensity={30}
        tint={isDark ? "dark" : "light"}
      >
        <Animated.View style={[styles.modalView, animatedStyle]}>
          <Pressable style={styles.dismissButton} onPress={handleDismiss}>
            <View style={styles.dismissIconContainer}>
              <Feather name="x" size={18} color={theme.text} />
            </View>
          </Pressable>
          <ThemedText style={styles.title}>Log Your Sleep</ThemedText>
          <ThemedText style={styles.subtitle}>
            Log your sleep for cursed energy
          </ThemedText>
          <Spacer size="md" />
          <View style={styles.controls}>
            <ControlButton icon="minus" onPress={decrementHours} />
            <ThemedText style={styles.hoursText}>{hours} hrs</ThemedText>
            <ControlButton icon="plus" onPress={incrementHours} />
          </View>
          <Spacer size="lg" />
          <Button
            onPress={handleLogSleep}
            variant={hours >= 6 ? "primary" : "secondary"}
          >
            Log Sleep
          </Button>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    width: "85%",
  },
  dismissButton: {
    position: "absolute",
    top: -10,
    right: -10,
  },
  dismissIconContainer: {
    backgroundColor: "rgba(128, 128, 128, 0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 16,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  hoursText: {
    fontSize: 28,
    fontWeight: "bold",
    minWidth: 80,
    textAlign: "center",
  },
});
