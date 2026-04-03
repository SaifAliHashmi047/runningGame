import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { PowerUpKind } from "../../game/powers";
import { defFor } from "../../game/powers";
import PowerUpIcon from "./PowerUpIcon";
import { scale as layoutScale } from "../../../utils/responsive";

export type PowerPickupFlashProps = {
  kind: PowerUpKind | null;
  /** Bump to retrigger animation */
  token: number;
};

/**
 * Brief premium pickup pop: scale + fade aligned with collecting a power orb.
 */
export default function PowerPickupFlash({ kind, token }: PowerPickupFlashProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!kind || token <= 0) {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      opacity.value = 0;
      scale.value = 0.6;
      return;
    }
    cancelAnimation(opacity);
    cancelAnimation(scale);
    opacity.value = 0;
    scale.value = 0.5;
    opacity.value = withSequence(
      withTiming(1, { duration: 90, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) })
    );
    scale.value = withSequence(
      withTiming(1.12, { duration: 160, easing: Easing.out(Easing.back(1.2)) }),
      withTiming(0.92, { duration: 200, easing: Easing.inOut(Easing.quad) })
    );
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [kind, token, opacity, scale]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!kind) return null;

  const def = defFor(kind);
  const size = layoutScale(78);

  return (
    <View style={styles.host} pointerEvents="none">
      <Animated.View style={[styles.burst, { borderColor: def.ring, shadowColor: def.accent }, aStyle]}>
        <View style={[styles.innerGlow, { borderColor: def.accent }]} />
        <PowerUpIcon kind={kind} size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 55,
  },
  burst: {
    padding: layoutScale(14),
    borderRadius: layoutScale(28),
    borderWidth: layoutScale(2),
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: layoutScale(20),
    elevation: 12,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: layoutScale(26),
    borderWidth: layoutScale(1),
    opacity: 0.35,
    margin: layoutScale(4),
  },
});
