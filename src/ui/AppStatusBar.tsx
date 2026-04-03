import React, { useEffect } from "react";
import { AppState, Platform, StatusBar } from "react-native";

function applyAndroidTranslucent() {
  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor("transparent");
}

/**
 * Transparent status bar — content draws under the bar; pair with SafeAreaView insets.
 * Re-applies on resume because some OEMs / RN paths reset bar appearance.
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
      translucent={Platform.OS === "android"}
      backgroundColor="transparent"
      barStyle="light-content"
    />
  );
}
