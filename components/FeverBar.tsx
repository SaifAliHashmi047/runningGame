import React, { useMemo } from "react";
import { View, StyleSheet, ViewStyle, Text } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { fontPixel, heightPixel, scale } from "../utils/responsive";

type Props = {
  progress: number; // 0..1
  active?: boolean;
  style?: ViewStyle;
  idleLabel?: string;
  activeLabel?: string;
};

export default function FeverBar({
  progress,
  active = false,
  style,
  idleLabel = "ENERGY",
  activeLabel = "FEVER",
}: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  const colors = useMemo(
    () => (active ? ["#ff006e", "#ffd166"] : ["#4338ca", "#22d3ee"]),
    [active]
  );
  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.08)"]} style={styles.track}>
        <LinearGradient colors={colors} style={[styles.fill, { width: `${pct * 100}%` }]} />
      </LinearGradient>
      <Text style={[styles.label, active && styles.labelActive]}>{active ? activeLabel : idleLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: heightPixel(8),
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },
  track: {
    width: "70%",
    height: heightPixel(10),
    borderRadius: scale(10),
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
  label: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(10),
    color: "rgba(255,255,255,0.6)",
    letterSpacing: scale(2),
  },
  labelActive: {
    color: "#ffd166",
  },
});

