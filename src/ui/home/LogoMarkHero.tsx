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
import LogoMark from "./LogoMark";
import { useResponsive } from "./useResponsive";
import { HERO_FLOAT_MS, HERO_TILT_MS } from "./homeMotion";

function LogoMarkHeroInner() {
  const { scale, heightPixel } = useResponsive();
  const floatT = useSharedValue(0);
  const tiltT = useSharedValue(0);
  const glowT = useSharedValue(0);

  const logoSize = scale(200);
  const floatDy = heightPixel(5);
  const tiltDeg = 2.2;

  useEffect(() => {
    floatT.value = withRepeat(
      withTiming(1, { duration: HERO_FLOAT_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    tiltT.value = withRepeat(
      withTiming(1, { duration: HERO_TILT_MS, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true
    );
    glowT.value = withRepeat(
      withTiming(1, { duration: HERO_FLOAT_MS * 1.1, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [floatT, tiltT, glowT]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatT.value, [0, 1], [-floatDy, floatDy]) },
      { rotateZ: `${interpolate(tiltT.value, [0, 1], [-tiltDeg, tiltDeg])}deg` },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowT.value, [0, 1], [0.22, 0.42]),
    transform: [{ scale: interpolate(glowT.value, [0, 1], [0.96, 1.05]) }],
  }));

  return (
    <View style={[styles.wrap, { width: logoSize, height: logoSize }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          haloStyle,
          {
            width: logoSize * 1.08,
            height: logoSize * 1.08,
            borderRadius: logoSize * 0.54,
          },
        ]}
      />
      <Animated.View style={floatStyle}>
        <LogoMark size={logoSize} showBackgroundDisk />
      </Animated.View>
    </View>
  );
}

export default memo(LogoMarkHeroInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    backgroundColor: "rgba(0, 229, 255, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
});
