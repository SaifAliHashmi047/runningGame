import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { colors, radius } from "./theme";
import { useResponsive } from "./useResponsive";

type Props = {
  highScore: number;
};

export default function HighScoreBadge({ highScore }: Props) {
  const { scale, fontPixel } = useResponsive();
  return (
    <View style={[styles.root, { paddingHorizontal: scale(10), paddingVertical: scale(6), borderRadius: scale(radius.md) }]}>
      <Text style={[styles.label, { fontSize: fontPixel(10), marginRight: scale(6) }]}>BEST</Text>
      <Text style={[styles.value, { fontSize: fontPixel(16) }]}>{highScore.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  label: {
    color: colors.textTertiary,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  value: {
    color: colors.textPrimary,
    fontWeight: "900",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});

