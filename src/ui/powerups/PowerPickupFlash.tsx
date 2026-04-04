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
 * Brief pickup acknowledgment — opacity only (no scale/back easing work).
 */
export default function PowerPickupFlash({ kind, token }: PowerPickupFlashProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!kind || token <= 0) {
      cancelAnimation(opacity);
      opacity.value = 0;
      return;
    }
    cancelAnimation(opacity);
    opacity.value = 0;
    opacity.value = withSequence(
      withTiming(1, { duration: 70, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [kind, token, opacity]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
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
