import React, { memo } from "react";
import { Image, Platform, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { OBSTACLE_TEXTURE_SOURCES } from "../../assets/obstacles";
import type { ObstacleVisual } from "../../game/types";
import type { EntityPosMap } from "./entityPositions";

export type TrackedObstacleSpec = {
  id: number;
  visW: number;
  visH: number;
  visual: ObstacleVisual;
};

type Props = {
  entityId: number;
  visW: number;
  visH: number;
  visual: ObstacleVisual;
  positionsById: SharedValue<EntityPosMap>;
};

function TrackedObstacleInner({ entityId, visW, visH, visual, positionsById }: Props) {
  const motion = useAnimatedStyle(() => {
    const p = positionsById.value[entityId];
    return {
      transform: [{ translateX: p?.x ?? -99999 }, { translateY: p?.y ?? -99999 }],
    };
  });

  const staticBox = {
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: visW,
    height: visH,
    overflow: "visible" as const,
    backgroundColor: "transparent" as const,
  };

  return (
    <Animated.View pointerEvents="none" style={[staticBox, motion]} collapsable={false}>
      <Image
        source={OBSTACLE_TEXTURE_SOURCES[visual]}
        style={[styles.art, { width: visW, height: visH }]}
        resizeMode="contain"
        fadeDuration={Platform.OS === "android" ? 0 : undefined}
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  art: {
    opacity: 0.98,
    backgroundColor: "transparent",
  },
});

function propsEqual(p: Props, n: Props) {
  return (
    p.entityId === n.entityId &&
    p.visW === n.visW &&
    p.visH === n.visH &&
    p.visual === n.visual &&
    p.positionsById === n.positionsById
  );
}

export default memo(TrackedObstacleInner, propsEqual);
