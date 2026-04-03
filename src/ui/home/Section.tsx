import React from "react";
import { View, Text, StyleSheet, Platform, ViewStyle } from "react-native";
import { colors, radius } from "./theme";
import { useResponsive } from "./useResponsive";
import { heightPixel, scale } from "../../../utils/responsive";

type Props = {
  children: React.ReactNode;
  label?: string;
  debug?: boolean;
  style?: ViewStyle;
  top?: number;   // additional top spacing (unscaled)
  bottom?: number; // additional bottom spacing (unscaled)
};

export default function Section({ children, label, debug = false, style, top = 0, bottom = 0 }: Props) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  return (
    <View style={[{ marginTop: heightPixel(10) + top, marginBottom: heightPixel(4) + bottom }, style]}>
      {debug && !!label && (
        <View style={[styles.debugPill, { borderRadius: scale(radius.pill), paddingHorizontal: scale(8), paddingVertical: heightPixel(4) }]}>
          <Text style={[styles.debugText, { fontSize: fontPixel(10) }]}>{label}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  debugPill: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: heightPixel(6),
  },
  debugText: {
    color: colors.textSecondary,
    letterSpacing: 1.2,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});

