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
import PowerUpIcon from "./PowerUpIcon";
import { scale as layoutScale } from "../../../utils/responsive";

export type PowerPickupFlashProps = {
  kind: PowerUpKind | null;
  /** Bump to retrigger animation */
  token: number;
};

/**
 * Brief pickup acknowledgment — soft pop + fade (lightweight, single shared transform).
 */
export default function PowerPickupFlash({ kind, token }: PowerPickupFlashProps) {
  const opacity = useSharedValue(0);

  const pop = useSharedValue(1);

  useEffect(() => {
    if (!kind || token <= 0) {
      cancelAnimation(opacity);
      cancelAnimation(pop);
      opacity.value = 0;
      pop.value = 1;
      return;
    }
    cancelAnimation(opacity);
    cancelAnimation(pop);
    opacity.value = 0;
    pop.value = withSequence(
      withTiming(1.06, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 70, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
    );
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(pop);
    };
  }, [kind, token, opacity, pop]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: pop.value }],
  }));

  if (!kind) return null;

  const size = layoutScale(78);

  return (
    <View style={styles.host} pointerEvents="none">
      <Animated.View style={[styles.burst, aStyle]}>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
