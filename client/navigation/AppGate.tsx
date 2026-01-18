import React from "react";
import { SleepLogModal } from "@/components/SleepLogModal";
import RootStackNavigator from "./RootStackNavigator";

export function AppGate() {
  return (
    <>
      <RootStackNavigator />
      <SleepLogModal />
    </>
  );
}
