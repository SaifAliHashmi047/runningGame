import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors } from "./theme";
import { useResponsive } from "./useResponsive";

type Props = { baseSize?: number };

/**
 * Layered energy rings with slow breathing opacity — focal halo behind the ship.
 */
function OrbitalHeroRingsInner({ baseSize: baseSizeProp }: Props) {
  const { scale } = useResponsive();
  const base = baseSizeProp ?? scale(200);
  const r = base / 2;
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const ring1 = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.1, 0.28]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.98, 1.04]) }],
  }));
  const ring2 = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.16, 0.36]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1.02, 0.96]) }],
  }));
  const core = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.12, 0.22]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
  }));

  const border = scale(2);

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          ring1,
          {
            width: base * 1.28,
            height: base * 1.28,
            borderRadius: r * 1.28,
            borderWidth: border,
            borderColor: colors.accent,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          ring2,
          {
            width: base * 1.1,
            height: base * 1.1,
            borderRadius: r * 1.1,
            borderWidth: border,
            borderColor: colors.purple,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          core,
          {
            width: base * 0.92,
            height: base * 0.92,
            borderRadius: r * 0.92,
          },
        ]}
      />
    </View>
  );
}

export default memo(OrbitalHeroRingsInner);

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
  core: {
    position: "absolute",
    backgroundColor: "rgba(0,229,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,229,255,0.22)",
  },
});
