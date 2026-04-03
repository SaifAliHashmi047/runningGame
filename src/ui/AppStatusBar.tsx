import React, { useEffect } from "react";
import { Platform, StatusBar } from "react-native";

/**
 * Transparent status bar everywhere — content draws under the bar; use SafeAreaView for insets.
 */
export default function AppStatusBar() {
  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor("transparent");
    }
  }, []);

  return (
    <StatusBar
      translucent
      backgroundColor="transparent"
      barStyle="light-content"
    />
  );
}
