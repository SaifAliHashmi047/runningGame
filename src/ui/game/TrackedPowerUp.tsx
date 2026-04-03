import React, { memo, useMemo } from "react";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import PowerUp from "../../../components/PowerUp";
import type { PowerUpKind } from "../../game/powers";
import type { EntityPosMap } from "./entityPositions";
import { scale } from "../../../utils/responsive";

type Props = {
  kind: PowerUpKind;
  size: number;
  powerUpId: number;
  positionsById: SharedValue<EntityPosMap>;
};

function TrackedPowerUpInner({ kind, size, powerUpId, positionsById }: Props) {
  const outer = useMemo(() => {
    const pad = Math.round(scale(10) + size * 0.12);
    return size + pad * 2;
  }, [size]);

  const staticShell = useMemo(
    () =>
      ({
        position: "absolute" as const,
        left: 0,
        top: 0,
        width: outer,
        height: outer,
      }) as const,
    [outer]
  );

  const motion = useAnimatedStyle(() => {
    const p = positionsById.value[powerUpId];
    return {
      transform: [{ translateX: p?.x ?? -99999 }, { translateY: p?.y ?? -99999 }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[staticShell, motion]} collapsable={false}>
      <PowerUp kind={kind} size={size} embedded />
    </Animated.View>
  );
}

function propsEqual(p: Props, n: Props) {
  return (
    p.kind === n.kind &&
    p.size === n.size &&
    p.powerUpId === n.powerUpId &&
    p.positionsById === n.positionsById
  );
}

export default memo(TrackedPowerUpInner, propsEqual);
