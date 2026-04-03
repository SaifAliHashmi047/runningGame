import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from "./theme";
import { heightPixel, scale } from "../../../utils/responsive";

type Props = {
  children?: React.ReactNode;
};

export default function AnimatedBackground({ children }: Props) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [drift]);

  const layer1 = useAnimatedStyle(() => ({
    transform: [{ translateX: (drift.value - 0.5) * 30 }],
    opacity: 0.6,
  }));
  const layer2 = useAnimatedStyle(() => ({
    transform: [{ translateX: (0.5 - drift.value) * 40 }],
    opacity: 0.35,
  }));
  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: 0.98 + drift.value * 0.04 }],
    opacity: 0.15 + drift.value * 0.1,
  }));

  return (
    <View style={styles.root}>
      <View style={styles.gradTop} />
      <View style={styles.gradMid} />
      <Animated.View style={[styles.layer, styles.layerAccent, layer1]} />
      <Animated.View style={[styles.layer, styles.layerAccentAlt, layer2]} />
      <Animated.View style={[styles.glow, glow]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgTop,
  },
  gradTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "52%",
    backgroundColor: colors.bgTop,
  },
  gradMid: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgMid,
  },
  layer: {
    position: "absolute",
    top: "18%",
    left: scale(-80),
    right: scale(-80),
    height: heightPixel(220),
    borderRadius: scale(30),
    transform: [{ rotateZ: "-6deg" }],
  },
  layerAccent: {
    backgroundColor: colors.accent,
    opacity: 0.35,
  },
  layerAccentAlt: {
    top: "44%",
    backgroundColor: colors.accentAlt,
    opacity: 0.22,
    transform: [{ rotateZ: "6deg" }],
  },
  glow: {
    position: "absolute",
    top: "28%",
    alignSelf: "center",
    width: scale(340),
    height: scale(340),
    borderRadius: scale(160),
    backgroundColor: colors.accent,
    opacity: 0.2,
  },
});
