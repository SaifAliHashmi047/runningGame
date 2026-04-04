import React, { memo, useEffect } from "react";
import { StyleSheet, View, Image, type ViewStyle, type ImageSourcePropType } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";
import type { VisualQualityTier } from "../src/game/performanceConfig";
import { HeroHoverShipSvg } from "../src/game/assets";
import { GameSvgArt } from "../src/game/svgArt";

type Props = {
  style?: ViewStyle;
  width?: number;
  height?: number;
  /** Lane steer -1…1; updated from game loop without React renders. */
  steerSV: SharedValue<number>;
  qualityTier?: VisualQualityTier;
  /** When set, replaces the default SVG hero (purchased bitmap skins). */
  skinImage?: ImageSourcePropType;
};

function HeroHoverShipInner({
  style,
  width = 56,
  height = 60,
  steerSV,
  qualityTier = 0,
  skinImage,
}: Props) {
  const bob = useSharedValue(0);
  const glow = useSharedValue(1);
  const thruster = useSharedValue(1);

  const reduceFx = qualityTier >= 1;
  /** Gameplay uses tier ≥2 — skip idle bob / thruster / glow loops (steer tilt only). */
  const staticMotion = qualityTier >= 2;

  useEffect(() => {
    if (staticMotion) {
      cancelAnimation(bob);
      cancelAnimation(glow);
      cancelAnimation(thruster);
      bob.value = 0.5;
      glow.value = reduceFx ? 0.88 : 1;
      thruster.value = 0.8;
      return;
    }
    bob.value = withRepeat(
      withTiming(1, { duration: reduceFx ? 3200 : 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(reduceFx ? 0.9 : 0.82, { duration: reduceFx ? 900 : 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: reduceFx ? 1100 : 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    thruster.value = withRepeat(
      withSequence(
        withTiming(reduceFx ? 0.7 : 0.55, { duration: reduceFx ? 240 : 180, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: reduceFx ? 280 : 220, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(bob);
      cancelAnimation(glow);
      cancelAnimation(thruster);
    };
  }, [bob, glow, thruster, reduceFx, staticMotion]);

  const heroMotion = useAnimatedStyle(() => {
    const tiltDeg = Math.max(-1, Math.min(1, steerSV.value)) * 9;
    const bobY = staticMotion ? 0 : interpolate(bob.value, [0, 1], [-2.5, 2.5]);
    return { transform: [{ translateY: bobY }, { rotate: `${tiltDeg}deg` }] };
  });

  const glowRing = useAnimatedStyle(() => ({
    opacity: qualityTier >= 2 ? 0 : interpolate(glow.value, [0.82, 1], [reduceFx ? 0.22 : 0.35, reduceFx ? 0.38 : 0.55]),
    transform: [{ scale: interpolate(glow.value, [0.82, 1], [0.96, 1.04]) }],
  }));

  const thrusterStyle = useAnimatedStyle(() => ({
    opacity: interpolate(thruster.value, [0.55, 1], [reduceFx ? 0.55 : 0.65, 1]),
    transform: [{ scaleY: interpolate(thruster.value, [0.55, 1], [0.88, 1.06]) }],
  }));

  const thrusterBox = [
    styles.thruster,
    staticMotion && styles.thrusterLite,
    staticMotion && styles.thrusterStatic,
    {
      left: "50%" as const,
      width: width * 0.22,
      height: height * 0.14,
      borderRadius: 4,
      bottom: -height * 0.02,
      marginLeft: -(width * 0.22) / 2,
    },
  ];

  return (
    <Animated.View style={[styles.wrap, { width, height }, style]}>
      {qualityTier < 2 && (
        <Animated.View
          style={[styles.glowBloom, glowRing, { width: width * 1.35, height: height * 1.35, borderRadius: width }]}
        />
      )}
      <Animated.View style={[styles.heroInner, heroMotion]}>
        {skinImage ? (
          <Image source={skinImage} style={{ width, height }} resizeMode="contain" />
        ) : (
          <GameSvgArt module={HeroHoverShipSvg} width={width} height={height} />
        )}
      </Animated.View>
      {staticMotion ? (
        <View style={thrusterBox} />
      ) : (
        <Animated.View style={[thrusterBox, thrusterStyle]} />
      )}
    </Animated.View>
  );
}

export default memo(HeroHoverShipInner);

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  glowBloom: {
    position: "absolute",
    backgroundColor: "rgba(56,189,248,0.35)",
  },
  heroInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  thruster: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(251,113,133,0.85)",
    shadowColor: "#fb7185",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  thrusterLite: {
    shadowOpacity: 0,
    elevation: 0,
  },
  thrusterStatic: {
    opacity: 0.82,
    transform: [{ scaleY: 0.98 }],
  },
});
