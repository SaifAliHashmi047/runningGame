import React from "react";
import { View, Text, StyleSheet, Image, Platform } from "react-native";
import { colors, radius, shadow, spacing, assets } from "./theme";
import { useResponsive } from "./useResponsive";
import { scale } from "../../../utils/responsive";

type Props = {
  coins: number;
  gems?: number;
};

export default function CurrencyBar({ coins, gems = 0 }: Props) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  return (
    <View style={[styles.root, { paddingHorizontal: scale(10), paddingVertical: heightPixel(6), borderRadius: scale(radius.md) }]}>
      <View style={styles.row}>
        <Image source={assets.coin} style={{ width: scale(18), height: scale(18), borderRadius: scale(9) }} />
        <Text style={[styles.value, { fontSize: scale(16), marginLeft: scale(6) }]}>{coins.toLocaleString()}</Text>
      </View>
      <View style={[styles.dot, { width: scale(4), height: scale(4), borderRadius: scale(2) }]} />
      <View style={styles.row}>
        <View style={[styles.gem, { width: scale(18), height: scale(18), borderRadius: scale(4), transform: [{ rotateZ: "45deg" }] }]} />
        <Text style={[styles.value, { fontSize: fontPixel(16), marginLeft: scale(6) }]}>{gems.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...shadow.light,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    color: colors.textPrimary,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  dot: {
    marginHorizontal: scale(8),
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  gem: {
    backgroundColor: "#60a5fa",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
});

