// Audio import preserved for future sound implementation
// import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

// Preserved for future sound implementation
// let safeBreakEndSound: Audio.Sound | null = null;

// Simple notification sound using expo-av's built-in capability
// We'll use a system-like notification pattern
export async function playSafeBreakEndNotification(): Promise<void> {
  try {
    // Use haptic feedback as primary notification
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Play a second haptic slightly delayed for emphasis
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 300);

    // Third haptic for the 3-second pattern
    setTimeout(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 600);

    if (__DEV__) {
      console.log("[AudioService] Safe Break end notification played");
    }
  } catch (error) {
    console.error("[AudioService] Failed to play notification:", error);
  }
}

// Alternative: If you have a custom sound file, uncomment and use this:
/*
export async function playSafeBreakEndSound(): Promise<void> {
  try {
    if (safeBreakEndSound) {
      await safeBreakEndSound.replayAsync();
    } else {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/safe_break_end.mp3")
      );
      safeBreakEndSound = sound;
      await sound.playAsync();
    }
  } catch (error) {
    console.error("[AudioService] Failed to play sound:", error);
  }
}
*/

// Preserved for future sound implementation
/*
export async function unloadSounds(): Promise<void> {
  if (safeBreakEndSound) {
    await safeBreakEndSound.unloadAsync();
    safeBreakEndSound = null;
  }
}
*/

