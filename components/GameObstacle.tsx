import React, { memo, useEffect, useRef } from "react";
import { Image, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";
import type { ObstacleVisual } from "../src/game/types";
import type { VisualQualityTier } from "../src/game/performanceConfig";
import { OBSTACLE_TEXTURE_SOURCES } from "../src/assets/obstacles";
import type { EntityPosMap } from "../src/ui/game/entityPositions";

type Props = {
  visual: ObstacleVisual;
  width: number;
  height: number;
  style?: ViewStyle;
  visualTier?: VisualQualityTier;
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
  const tierAtSpawnRef = useRef<VisualQualityTier | null>(null);
  if (tierAtSpawnRef.current === null) {
    tierAtSpawnRef.current = visualTier;
  }
  const pulse = useSharedValue(1);
  const motionTier = tierAtSpawnRef.current;
  const lite = motionTier >= 1;
  const staticMotion = motionTier >= 2;

  useEffect(() => {
    if (staticMotion) {
      cancelAnimation(pulse);
      pulse.value = 1;
      return;
    }
    pulse.value = 1;
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.94, { duration: lite ? 520 : 400, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: lite ? 480 : 380, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [lite, staticMotion, pulse]);

  const useSharedLayout = entityId != null && positionsById != null;
  const layoutFromShared = useAnimatedStyle(() => {
    if (!useSharedLayout) return {};
    const id = entityId as number;
    const p = positionsById!.value[id];
    if (!p) return { left: -99999, top: -99999 };
    return { left: p.x, top: p.y };
  });

  const animStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: pulse.value }],
  }));

  const inner = (
    <Animated.View
      style={[
        {
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
          backgroundColor: "transparent",
        },
        staticMotion ? undefined : animStyle,
      ]}
    >
      <Image
        source={OBSTACLE_TEXTURE_SOURCES[visual]}
        style={{ width, height, backgroundColor: "transparent" }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
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
    backgroundColor: "transparent",
  },
});
