import React, { memo } from "react";
import { Image, Platform, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { COIN_TEXTURE } from "../../assets/coins";
import type { EntityPosMap } from "./entityPositions";

type Props = {
  size: number;
  coinId: number;
  positionsById: SharedValue<EntityPosMap>;
};

function TrackedCoinInner({ size, coinId, positionsById }: Props) {
  const motion = useAnimatedStyle(() => {
    const p = positionsById.value[coinId];
    return {
      transform: [{ translateX: p?.x ?? -99999 }, { translateY: p?.y ?? -99999 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          backgroundColor: "transparent",
        },
        motion,
      ]}
      collapsable={false}
    >
      <Image
        source={COIN_TEXTURE}
        style={[styles.art, { width: size, height: size }]}
        resizeMode="contain"
        fadeDuration={Platform.OS === "android" ? 0 : undefined}
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  art: {
    backgroundColor: "transparent",
  },
});

function propsEqual(p: Props, n: Props) {
  return p.size === n.size && p.coinId === n.coinId && p.positionsById === n.positionsById;
}

export default memo(TrackedCoinInner, propsEqual);
