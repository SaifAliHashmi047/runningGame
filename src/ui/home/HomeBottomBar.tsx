import React, { memo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, fontUi, radius } from "./theme";
import { useResponsive } from "./useResponsive";
import { scale } from "../../../utils/responsive";
import { HOME_SPRING_PRESS } from "./homeMotion";

type Item = { key: string; label: string; onPress?: () => void };

type Props = { items: Item[] };

const BarItem = memo(function BarItem({ item }: { item: Item }) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  const press = useSharedValue(0);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.05 }],
  }));

  return (
    <Animated.View style={rStyle}>
      <Pressable
        onPressIn={() => {
          press.value = withSpring(1, HOME_SPRING_PRESS);
        }}
        onPressOut={() => {
          press.value = withSpring(0, HOME_SPRING_PRESS);
        }}
        onPress={item.onPress}
        style={({ pressed }) => [
          styles.item,
          {
            paddingHorizontal: scale(12),
            paddingVertical: heightPixel(11),
            borderRadius: scale(radius.md),
            minWidth: scale(76),
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Text style={[styles.label, { fontSize: fontPixel(11) }]}>{item.label}</Text>
      </Pressable>
    </Animated.View>
  );
});

function HomeBottomBarInner({ items }: Props) {
  const { scale, heightPixel } = useResponsive();
  return (
    <View
      style={[
        styles.row,
        {
          paddingHorizontal: scale(12),
          paddingVertical: heightPixel(14),
          gap: scale(8),
        },
      ]}
    >
      {items.map((item) => (
        <BarItem key={item.key} item={item} />
      ))}
    </View>
  );
}

export default memo(HomeBottomBarInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(4,8,18,0.78)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(56,189,248,0.22)",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: scale(1),
    borderColor: "rgba(255,255,255,0.12)",
  },
  label: {
    color: colors.textPrimary,
    fontWeight: "800",
    letterSpacing: 1.2,
    fontFamily: fontUi.mono,
  },
});
