import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { colors, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";
import { heightPixel, scale } from "../../../utils/responsive";

type Props = {
  items: string[];
  visible: boolean;
};

export default function UILegend({ items, visible }: Props) {
  const { scale, fontPixel } = useResponsive();
  if (!visible) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        {
          borderRadius: scale(radius.md),
          paddingHorizontal: scale(10),
          paddingVertical: heightPixel(8),
          bottom: scale(14),
          left: scale(14),
        },
      ]}
    >
      <Text style={[styles.title, { fontSize: fontPixel(10), marginBottom: heightPixel(6) }]}>UI MAP</Text>
      {items.map((it) => (
        <Text key={it} style={[styles.item, { fontSize: fontPixel(11), marginTop: heightPixel(2) }]}>
          • {it}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    backgroundColor: "rgba(16,22,38,0.9)",
    borderWidth: scale(1),
    borderColor: "rgba(255,255,255,0.08)",
    ...shadow.light,
  },
  title: {
    color: colors.textTertiary,
    letterSpacing: 2,
    fontWeight: "800",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  item: {
    color: colors.textSecondary,
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});

