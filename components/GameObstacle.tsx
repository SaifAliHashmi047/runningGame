import React, { memo, useEffect, useRef } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
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
import type { ObstacleVisual } from "../src/game/types";
import type { VisualQualityTier } from "../src/game/performanceConfig";
import {
  ObstacleCrystalSpikesSvg,
  ObstacleDroneBarrierSvg,
  ObstacleHoverMineSvg,
  ObstacleLaserGateSvg,
} from "../src/game/assets";
import { GameSvgArt } from "../src/game/svgArt";
import type { EntityPosMap } from "../src/ui/game/entityPositions";

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
  /**
   * When set with id-keyed positions, layout stays correct while the obstacle list reorders
   * (array-index + parallel SharedValue updates can desync for a frame and flicker).
   */
  entityId?: number;
  positionsById?: SharedValue<EntityPosMap>;
};

function GameObstacleInner({
  visual,
  width,
  height,
  style,
  visualTier = 0,
  entityId,
  positionsById,
}: Props) {
  /** Lock motion tier at spawn so perf-adaptive steps do not reset Reanimated cycles mid-fall. */
  const tierAtSpawnRef = useRef<VisualQualityTier | null>(null);
  if (tierAtSpawnRef.current === null) {
    tierAtSpawnRef.current = visualTier;
  }
  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);
  const bob = useSharedValue(0);
  const wobble = useSharedValue(0);
  const crystalScale = useSharedValue(1);
  const motionTier = tierAtSpawnRef.current;
  const lite = motionTier >= 1;
  const staticMotion = motionTier >= 2;

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

  const useSharedLayout = entityId != null && positionsById != null;
  const layoutFromShared = useAnimatedStyle(() => {
    if (!useSharedLayout) return {};
    const id = entityId as number;
    const p = positionsById!.value[id];
    if (!p) return { left: -99999, top: -99999 };
    return { left: p.x, top: p.y };
  });

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

  const inner = (
    <Animated.View
      style={[
        { width, height, alignItems: "center", justifyContent: "center", overflow: "visible" },
        animStyle,
      ]}
    >
      <GameSvgArt module={SvgMod} width={width} height={height} />
    </Animated.View>
  );

  if (useSharedLayout) {
    return (
      <Animated.View style={[styles.wrap, { width, height }, layoutFromShared]}>{inner}</Animated.View>
    );
  }
  return (
    <View style={[styles.wrap, { width, height }, style]} pointerEvents="none">
      {inner}
    </View>
  );
}

function propsEqual(prev: Props, next: Props): boolean {
  const prevShared = prev.entityId != null && prev.positionsById != null;
  const nextShared = next.entityId != null && next.positionsById != null;
  if (prevShared !== nextShared) return false;
  if (prevShared) {
    return (
      prev.visual === next.visual &&
      prev.width === next.width &&
      prev.height === next.height &&
      prev.entityId === next.entityId &&
      prev.positionsById === next.positionsById
    );
  }
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
    overflow: "visible",
  },
});
