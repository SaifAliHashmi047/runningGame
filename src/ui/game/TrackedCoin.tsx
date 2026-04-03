import React, { memo } from "react";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Coin from "../../../components/Coin";
import type { EntityPosMap } from "./entityPositions";

type Props = {
  size: number;
  coinId: number;
  positionsById: SharedValue<EntityPosMap>;
};

const staticShell = (size: number) =>
  ({
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: size,
    height: size,
  }) as const;

function TrackedCoinInner({ size, coinId, positionsById }: Props) {
  const motion = useAnimatedStyle(() => {
    const p = positionsById.value[coinId];
    return {
      transform: [{ translateX: p?.x ?? -99999 }, { translateY: p?.y ?? -99999 }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[staticShell(size), motion]} collapsable={false}>
      <Coin size={size} embedded />
    </Animated.View>
  );
}

function propsEqual(p: Props, n: Props) {
  return p.size === n.size && p.coinId === n.coinId && p.positionsById === n.positionsById;
}

export default memo(TrackedCoinInner, propsEqual);
