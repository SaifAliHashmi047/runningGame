import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, fontUi, radius } from "./theme";
import { useResponsive } from "./useResponsive";
import { HOME_SPRING_PRESS } from "./homeMotion";

type Props = {
  onShop?: () => void;
  onStats?: () => void;
  compact?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HomeActionRowInner({ onShop, onStats, compact = false }: Props) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  const pShop = useSharedValue(0);
  const pStats = useSharedValue(0);

  const sShop = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pShop.value * 0.05 }],
  }));
  const sStats = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pStats.value * 0.05 }],
  }));

  const btn = {
    paddingVertical: heightPixel(11),
    paddingHorizontal: scale(18),
    borderRadius: scale(radius.pill),
    gap: scale(8),
  };

  return (
    <View style={[styles.row, { marginTop: heightPixel(compact ? 8 : 16), gap: scale(compact ? 8 : 12) }]}>
      <AnimatedPressable
        style={[styles.btn, btn, sShop]}
        onPressIn={() => {
          pShop.value = withSpring(1, HOME_SPRING_PRESS);
        }}
        onPressOut={() => {
          pShop.value = withSpring(0, HOME_SPRING_PRESS);
        }}
        onPress={onShop}
      >
        <Text style={[styles.icon, { fontSize: fontPixel(13) }]}>◆</Text>
        <Text style={[styles.label, { fontSize: fontPixel(11) }]}>SHOP</Text>
      </AnimatedPressable>
      <AnimatedPressable
        style={[styles.btn, btn, sStats]}
        onPressIn={() => {
          pStats.value = withSpring(1, HOME_SPRING_PRESS);
        }}
        onPressOut={() => {
          pStats.value = withSpring(0, HOME_SPRING_PRESS);
        }}
        onPress={onStats}
      >
        <Text style={[styles.icon, { fontSize: fontPixel(13) }]}>▤</Text>
        <Text style={[styles.label, { fontSize: fontPixel(11) }]}>STATS</Text>
      </AnimatedPressable>
    </View>
  );
}

export default memo(HomeActionRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,12,26,0.72)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(167,139,250,0.35)",
  },
  icon: {
    color: colors.purple,
    opacity: 0.95,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: "800",
    letterSpacing: 1.6,
    fontFamily: fontUi.mono,
  },
});
