import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { colors } from "./theme";
import { useResponsive } from "./useResponsive";

export default function PulseRings() {
  const { scale } = useResponsive();
  const t1 = useSharedValue(0);
  const t2 = useSharedValue(0);

  useEffect(() => {
    t1.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, false);
    t2.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [t1, t2]);

  const r1 = useAnimatedStyle(() => {
    const s = interpolate(t1.value, [0, 1], [0.8, 1.25]);
    const o = interpolate(t1.value, [0, 1], [0.28, 0]);
    return { transform: [{ scale: s }], opacity: o };
  });
  const r2 = useAnimatedStyle(() => {
    const s = interpolate(t2.value, [0, 1], [0.6, 1.35]);
    const o = interpolate(t2.value, [0, 1], [0.18, 0]);
    return { transform: [{ scale: s }], opacity: o };
  });

  const size = scale(220);
  const border = scale(2);

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.ring, r2, { width: size, height: size, borderRadius: size / 2, borderWidth: border }]} />
      <Animated.View style={[styles.ring, r1, { width: size, height: size, borderRadius: size / 2, borderWidth: border }]} />
      <View style={[styles.glow, { width: size * 0.9, height: size * 0.9, borderRadius: (size * 0.9) / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderColor: colors.accent,
  },
  glow: {
    position: "absolute",
    backgroundColor: colors.accent,
    opacity: 0.08,
  },
});

