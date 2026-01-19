import React, { useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useGameState } from "@/hooks/useGameState";
import { Spacing } from "@/constants/theme";

import { StatusPill } from "@/components/StatusPill";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { ControlButton } from "@/components/ControlButton";
import { BindingVowWidget } from "@/components/BindingVowWidget";
import { RCTButton } from "@/components/RCTButton";
// import { DebugPanel } from "@/components/DebugPanel";
import { VowSuccessModal } from "@/components/VowSuccessModal";
import { SessionTimer } from "@/components/SessionTimer";
import { CursedGuide } from "@/components/CursedGuide";
import { GuideBookButton } from "@/components/GuideBookButton";
import { CursedLog } from "@/components/CursedLog";
import { HistoryLogButton } from "@/components/HistoryLogButton";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [showGuide, setShowGuide] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const {
    state,
    mode,
    isLoaded,
    earningRate,
    availableGraceTime,
    canSignVow,
    hasUsedVowToday,
    showVowSuccess,
    sessionSeconds,
    startStudy,
    startGaming,
    stopTimer,
    signBindingVow,
    useRCT,
    dismissVowSuccess,
    // debugUpdateState,
  } = useGameState();

  if (!isLoaded) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      />
    );
  }

  const isInDebt = state.balance < 0;
  const isStudying = mode === "study";
  const isGaming = mode === "gaming";
  const isActive = mode !== "idle";

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing["3xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusBar}>
          <StatusPill
            icon="zap"
            label="Streak"
            value={`${state.streakDays} Days`}
            variant={state.streakDays > 0 ? "accent" : "default"}
          />
          <StatusPill
            icon="activity"
            label="Negative CE"
            value={state.nceBalance.toFixed(1)}
            variant="default"
          />
          <StatusPill
            icon="shield"
            label="RCT Credits"
            value={state.rctCredits}
            variant={state.rctCredits > 0 ? "success" : "default"}
          />
        </View>

        <BalanceDisplay
          balance={state.balance}
          earningRate={earningRate}
          mode={mode}
        />

        {isActive ? (
          <Animated.View
            entering={FadeIn.duration(250).easing(Easing.out(Easing.quad))}
            exiting={FadeOut.duration(200).easing(Easing.in(Easing.quad))}
            layout={LinearTransition.duration(250).easing(Easing.out(Easing.quad))}
            style={styles.timerContainer}
          >
            <SessionTimer
              mode={mode as "study" | "gaming"}
              sessionSeconds={sessionSeconds}
              dailySeconds={
                mode === "study"
                  ? state.dailyStudySeconds || 0
                  : state.dailyGamingSeconds || 0
              }
            />
          </Animated.View>
        ) : null}

        <Animated.View
          layout={LinearTransition.duration(250).easing(Easing.out(Easing.quad))}
          style={styles.controlDeck}
        >
          <ControlButton
            icon="book-open"
            label="Focus"
            onPress={isStudying ? stopTimer : startStudy}
            isActive={isStudying}
            activeLabel="Stop"
            variant="study"
          />
          <ControlButton
            icon="play"
            label="Leisure"
            onPress={isGaming ? stopTimer : startGaming}
            isActive={isGaming}
            activeLabel="Stop"
            variant="gaming"
          />
        </Animated.View>

        <RCTButton
          nceBalance={state.nceBalance}
          rctCredits={state.rctCredits}
          balance={state.balance}
          onUseRCT={useRCT}
        />

        {isInDebt || state.vowState.isActive ? (
          <BindingVowWidget
            isVowActive={state.vowState.isActive}
            canSignVow={canSignVow}
            hasUsedVowToday={hasUsedVowToday}
            graceTimeSeconds={availableGraceTime}
            vowStartedAt={state.vowState.startedAt}
            vowPenaltyUntil={state.vowState.vowPenaltyUntil}
            onSignVow={signBindingVow}
          />
        ) : null}

        {/* <DebugPanel
          state={state}
          earningRate={earningRate}
          debugUpdateState={debugUpdateState}
        /> */}
      </ScrollView>

      <VowSuccessModal visible={showVowSuccess} onDismiss={dismissVowSuccess} />

      <GuideBookButton onPress={() => setShowGuide(true)} />

      <HistoryLogButton onPress={() => setShowLog(true)} />

      <CursedGuide visible={showGuide} onClose={() => setShowGuide(false)} />

      <CursedLog
        visible={showLog}
        onClose={() => setShowLog(false)}
        logs={state.logs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  statusBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  timerContainer: {
    marginTop: Spacing.lg,
  },
  controlDeck: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
});
