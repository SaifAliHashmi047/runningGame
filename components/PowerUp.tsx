import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type Props = {
  type: "shield" | "x2" | "magnet" | "boost";
  size: number;
  color: string;
  style?: ViewStyle;
};

export default function PowerUp({ type, size, color, style }: Props) {
  return (
    <View style={[styles.wrap, style, { width: size }]}>
      <View style={[styles.gem, { width: size, height: size, backgroundColor: color }]}>
        {type === "shield" ? (
          <View style={styles.shield} />
        ) : type === "x2" ? (
          <View style={styles.mult} />
        ) : type === "magnet" ? (
          <View style={styles.magnet} />
        ) : (
          <View style={styles.boost} />
        )}
      </View>
      <View style={[styles.glow, { width: size + 10, height: size + 10, borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  gem: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.25)",
  },
  glow: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0.25,
  },
  shield: {
    width: 16,
    height: 20,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  mult: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  magnet: {
    width: 18,
    height: 18,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    transform: [{ rotate: "180deg" }],
  },
  boost: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(255,255,255,0.95)",
  },
});

