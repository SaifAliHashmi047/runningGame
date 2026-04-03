import React from "react";
import { View, Text, StyleSheet, Platform, ViewStyle } from "react-native";
import { colors, radius } from "./theme";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";

type Props = {
  text: string;
  style?: ViewStyle;
};

export default function SpeechBubble({ text, style }: Props) {
  const r = scale(radius.md);
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.bubble, { borderRadius: r, paddingHorizontal: scale(10), paddingVertical: heightPixel(6) }]}>
        <Text style={[styles.text, { fontSize: fontPixel(11) }]}>{text}</Text>
      </View>
      <View style={[styles.tail, { width: scale(10), height: scale(10) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubble: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: scale(1),
    borderColor: "rgba(0,0,0,0.06)",
  },
  text: {
    color: "#0b1020",
    fontWeight: "700",
    letterSpacing: 0.2,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  tail: {
    marginTop: heightPixel(2),
    marginRight: scale(12),
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: scale(1),
    borderColor: "rgba(0,0,0,0.06)",
    transform: [{ rotateZ: "45deg" }],
  },
});
