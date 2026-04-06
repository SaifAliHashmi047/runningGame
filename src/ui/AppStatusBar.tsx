import React, { useEffect } from "react";
import { AppState, Platform, StatusBar } from "react-native";

function applyAndroidTranslucent() {
  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor("transparent");
}

/**
 * Transparent / overlay status bar so full-bleed backgrounds show edge-to-edge.
 * Gameplay HUD stays inside `SafeAreaView` top inset; Android re-applies on resume.
 */
export default function AppStatusBar() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    applyAndroidTranslucent();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") applyAndroidTranslucent();
    });
    return () => sub.remove();
  }, []);

  return (
    <StatusBar
      translucent
      backgroundColor="transparent"
      barStyle="light-content"
    />
  );
}
