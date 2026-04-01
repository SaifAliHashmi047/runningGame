import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type Props = {
  size: number;
  style?: ViewStyle;
};

export default function Coin({ size, style }: Props) {
  return (
    <View style={[styles.wrap, style, { width: size, height: size }]}>
      <View style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={[styles.inner, { width: size * 0.58, height: size * 0.58, borderRadius: (size * 0.58) / 2 }]} />
      </View>
      <View style={[styles.gloss, { width: size * 0.36, height: size * 0.14, borderRadius: size * 0.08 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  coin: {
    backgroundColor: "#facc15",
    borderWidth: 2,
    borderColor: "#eab308",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    backgroundColor: "#fde047",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  gloss: {
    position: "absolute",
    top: 6,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});

