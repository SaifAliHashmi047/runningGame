import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "./theme";
import { useResponsive } from "./useResponsive";

/** Static rings — decorative only; avoids continuous Reanimated work. */
export default function PulseRings() {
  const { scale } = useResponsive();
  const size = scale(220);
  const border = scale(2);
  const r = size / 2;

  return (
    <View style={styles.root} pointerEvents="none">
      <View
        style={[
          styles.ring,
          {
            width: size * 1.12,
            height: size * 1.12,
            borderRadius: r * 1.12,
            borderWidth: border,
            opacity: 0.14,
            borderColor: colors.accent,
          },
        ]}
      />
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: r,
            borderWidth: border,
            opacity: 0.22,
            borderColor: colors.accent,
          },
        ]}
      />
      <View style={[styles.glow, { width: size * 0.9, height: size * 0.9, borderRadius: (size * 0.9) / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(0,229,255,0.08)",
  },
});
