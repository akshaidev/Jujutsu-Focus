import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Web Audio API for browser sound support
let audioContext: AudioContext | null = null;
let audioContextResumed = false;

// Get or create AudioContext
const getAudioContext = (): AudioContext | null => {
  if (Platform.OS !== "web") return null;

  if (!audioContext) {
    try {
      const AudioContextClass = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContext = new AudioContextClass();

      if (__DEV__) {
        console.log("[AudioService] AudioContext created, state:", audioContext.state);
      }
    } catch (e) {
      console.error("[AudioService] Failed to create AudioContext:", e);
      return null;
    }
  }
  return audioContext;
};

// Resume AudioContext (must be called after user interaction)
const ensureAudioContextResumed = async (): Promise<boolean> => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
      audioContextResumed = true;
      if (__DEV__) {
        console.log("[AudioService] AudioContext resumed successfully");
      }
    } catch (e) {
      console.error("[AudioService] Failed to resume AudioContext:", e);
      return false;
    }
  }
  return ctx.state === "running";
};

// Play a beep sound using Web Audio API
const playWebBeep = async (frequency: number, duration: number, volume: number = 0.3): Promise<void> => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Ensure context is resumed
  const isReady = await ensureAudioContextResumed();
  if (!isReady) {
    if (__DEV__) {
      console.log("[AudioService] AudioContext not ready, state:", ctx.state);
    }
    return;
  }

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    // Fade in and out to avoid clicks
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(volume, now + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);

    if (__DEV__) {
      console.log("[AudioService] Playing beep:", frequency, "Hz for", duration, "s");
    }
  } catch (e) {
    console.error("[AudioService] Failed to play web beep:", e);
  }
};

// Warning sound played 3 seconds before Safe Break runs out
export async function playSafeBreakWarning(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // Web: Play warning beep pattern (three ascending beeps)
      await playWebBeep(440, 0.15, 0.4); // A4
      setTimeout(() => playWebBeep(554, 0.15, 0.4), 200); // C#5
      setTimeout(() => playWebBeep(659, 0.15, 0.4), 400); // E5

      if (__DEV__) {
        console.log("[AudioService] Safe Break warning triggered (web)");
      }
    } else {
      // Mobile: Use haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 200);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 400);

      if (__DEV__) {
        console.log("[AudioService] Safe Break warning played (mobile)");
      }
    }
  } catch (error) {
    console.error("[AudioService] Failed to play warning:", error);
  }
}

// Notification when Safe Break is depleted and CE consumption begins
export async function playSafeBreakEndNotification(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // Web: Play alert sound pattern (descending urgent tone)
      await playWebBeep(880, 0.2, 0.5); // A5
      setTimeout(() => playWebBeep(659, 0.2, 0.5), 250); // E5
      setTimeout(() => playWebBeep(440, 0.3, 0.5), 500); // A4

      if (__DEV__) {
        console.log("[AudioService] Safe Break end notification triggered (web)");
      }
    } else {
      // Mobile: Use haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 300);
      setTimeout(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 600);

      if (__DEV__) {
        console.log("[AudioService] Safe Break end notification played (mobile)");
      }
    }
  } catch (error) {
    console.error("[AudioService] Failed to play notification:", error);
  }
}

// Initialize audio context on first user interaction (call this early in app)
export function initializeWebAudio(): void {
  if (Platform.OS !== "web") return;

  const handleInteraction = async () => {
    await ensureAudioContextResumed();
    // Remove listeners after first interaction
    document.removeEventListener("click", handleInteraction);
    document.removeEventListener("touchstart", handleInteraction);
    document.removeEventListener("keydown", handleInteraction);
  };

  document.addEventListener("click", handleInteraction);
  document.addEventListener("touchstart", handleInteraction);
  document.addEventListener("keydown", handleInteraction);

  if (__DEV__) {
    console.log("[AudioService] Web audio initialization listeners added");
  }
}
