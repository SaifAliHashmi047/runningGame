import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { colors, radius, spacing } from "./theme";
import { useResponsive } from "./useResponsive";
import { scale } from "../../../utils/responsive";

type Item = {
  key: string;
  label: string;
  onPress?: () => void;
};

type Props = {
  items: Item[];
};

export default function BottomMenu({ items }: Props) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  return (
    <View
      style={[
        styles.root,
        {
          paddingHorizontal: scale(16),
          paddingVertical: heightPixel(10),
          gap: scale(10),
        },
      ]}
    >
      {items.map((it) => (
        <TouchableOpacity
          key={it.key}
          activeOpacity={0.9}
          onPress={it.onPress}
          style={[
            styles.item,
            {
              paddingHorizontal: scale(16),
              paddingVertical: heightPixel(12),
              borderRadius: scale(radius.md),
              minWidth: scale(72),
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexBasis: "22%",
            },
          ]}
        >
          <Text style={[styles.label, { fontSize: fontPixel(12) }]}>{it.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  item: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: scale(1),
    borderColor: "rgba(255,255,255,0.12)",
    // subtle glow ring for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.25,
    shadowRadius: scale(8),
    elevation: 6,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: "800",
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});

