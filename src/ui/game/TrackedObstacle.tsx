import React, { memo } from "react";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { StyleSheet, View } from "react-native";
import type { EntityPosMap } from "./entityPositions";

/** Gameplay obstacles are plain Views only — no SVG (lighter + consistent with sim hitboxes). */
export type TrackedObstacleSpec = {
  id: number;
  visW: number;
  visH: number;
  color: string;
};

type Props = {
  entityId: number;
  visW: number;
  visH: number;
  color: string;
  positionsById: SharedValue<EntityPosMap>;
};

function TrackedObstacleInner({ entityId, visW, visH, color, positionsById }: Props) {
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
  };

  return (
    <Animated.View pointerEvents="none" style={[staticBox, motion]} collapsable={false}>
      <View
        style={{
          width: visW,
          height: visH,
          borderRadius: Math.min(6, visW * 0.08),
          backgroundColor: color,
          opacity: 0.92,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(0,0,0,0.2)",
        }}
      />
    </Animated.View>
  );
}

function propsEqual(p: Props, n: Props) {
  return (
    p.entityId === n.entityId &&
    p.visW === n.visW &&
    p.visH === n.visH &&
    p.color === n.color &&
    p.positionsById === n.positionsById
  );
}

export default memo(TrackedObstacleInner, propsEqual);
