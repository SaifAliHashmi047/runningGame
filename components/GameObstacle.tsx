import React, { memo, useEffect } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  cancelAnimation,
} from "react-native-reanimated";
import type { ObstacleVisual } from "../src/game/types";
import type { VisualQualityTier } from "../src/game/performanceConfig";
import {
  ObstacleCrystalSpikesSvg,
  ObstacleDroneBarrierSvg,
  ObstacleHoverMineSvg,
  ObstacleLaserGateSvg,
} from "../src/game/assets";
import { GameSvgArt } from "../src/game/svgArt";

const SVG_MAP: Record<ObstacleVisual, typeof ObstacleLaserGateSvg> = {
  laser: ObstacleLaserGateSvg,
  mine: ObstacleHoverMineSvg,
  drone: ObstacleDroneBarrierSvg,
  crystal: ObstacleCrystalSpikesSvg,
};

type Props = {
  visual: ObstacleVisual;
  width: number;
  height: number;
  style?: ViewStyle;
  /** Adaptive: 0 full motion, ≥2 minimal UI-thread work. */
  visualTier?: VisualQualityTier;
};

function GameObstacleInner({ visual, width, height, style, visualTier = 0 }: Props) {
  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);
  const bob = useSharedValue(0);
  const wobble = useSharedValue(0);
  const crystalScale = useSharedValue(1);

  const lite = visualTier >= 1;
  const staticMotion = visualTier >= 2;

  useEffect(() => {
    if (staticMotion) {
      cancelAnimation(pulse);
      cancelAnimation(spin);
      cancelAnimation(bob);
      cancelAnimation(wobble);
      cancelAnimation(crystalScale);
      pulse.value = 1;
      spin.value = 0;
      bob.value = 0.5;
      wobble.value = 0;
      crystalScale.value = 1;
      return;
    }
    pulse.value = 1;
    spin.value = 0;
    bob.value = 0;
    wobble.value = 0;
    crystalScale.value = 1;

    if (visual === "laser") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.86, { duration: lite ? 380 : 280, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: lite ? 320 : 260, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else if (visual === "mine") {
      spin.value = withRepeat(
        withTiming(1, { duration: lite ? 14000 : 9000, easing: Easing.linear }),
        -1,
        false
      );
      bob.value = withRepeat(
        withTiming(1, { duration: lite ? 2800 : 2200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else if (visual === "drone") {
      wobble.value = withRepeat(
        withTiming(1, { duration: lite ? 3400 : 2600, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      crystalScale.value = withRepeat(
        withSequence(
          withTiming(0.97, { duration: lite ? 700 : 550, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: lite ? 800 : 650, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(spin);
      cancelAnimation(bob);
      cancelAnimation(wobble);
      cancelAnimation(crystalScale);
    };
  }, [visual, lite, staticMotion, pulse, spin, bob, wobble, crystalScale]);

  const wobbleAmpX = lite ? 2.2 : 3.5;
  const wobbleAmpY = lite ? 1.4 : 2;
  const bobAmp = lite ? 1.4 : 2;

  const animStyle = useAnimatedStyle(() => {
    if (visual === "laser") {
      return { opacity: pulse.value, transform: [{ scaleY: interpolate(pulse.value, [0.86, 1], [0.97, 1]) }] };
    }
    if (visual === "mine") {
      const rot = spin.value * 360;
      const ty = interpolate(bob.value, [0, 1], [-bobAmp, bobAmp]);
      return { transform: [{ translateY: ty }, { rotate: `${rot}deg` }] };
    }
    if (visual === "drone") {
      const ox = Math.sin(wobble.value * Math.PI * 2) * wobbleAmpX;
      const oy = Math.cos(wobble.value * Math.PI * 2 * 0.7) * wobbleAmpY;
      return { transform: [{ translateX: ox }, { translateY: oy }] };
    }
    return {
      transform: [{ rotate: "180deg" }, { scale: crystalScale.value }],
      opacity: interpolate(crystalScale.value, [0.97, 1], [0.92, 1]),
    };
  });

  const SvgMod = SVG_MAP[visual];

  return (
    <Animated.View style={[styles.wrap, { width, height }, style, visual === "crystal" ? undefined : animStyle]}>
      {visual === "crystal" ? (
        <Animated.View style={[styles.svgInner, animStyle]}>
          <GameSvgArt module={SvgMod} width={width} height={height} />
        </Animated.View>
      ) : (
        <GameSvgArt module={SvgMod} width={width} height={height} />
      )}
    </Animated.View>
  );
}

function propsEqual(prev: Props, next: Props): boolean {
  return (
    prev.visual === next.visual &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.visualTier === next.visualTier &&
    prev.style?.left === next.style?.left &&
    prev.style?.top === next.style?.top
  );
}

export default memo(GameObstacleInner, propsEqual);

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  svgInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
