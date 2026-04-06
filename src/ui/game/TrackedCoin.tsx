import React, { memo } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
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

  const glowSize = Math.round(size * 1.24);
  const glowInset = Math.round((glowSize - size) / 2);

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
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            left: -glowInset,
            top: -glowInset,
            borderRadius: glowSize / 2,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.coinShadow,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
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
  glow: {
    position: "absolute",
    backgroundColor: "rgba(255,213,79,0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,213,79,0.32)",
    shadowColor: "#ffd54f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  coinShadow: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.18)",
    transform: [{ translateY: 1 }],
    opacity: 0.35,
  },
  art: {
    backgroundColor: "transparent",
  },
});

function propsEqual(p: Props, n: Props) {
  return p.size === n.size && p.coinId === n.coinId && p.positionsById === n.positionsById;
}

export default memo(TrackedCoinInner, propsEqual);
