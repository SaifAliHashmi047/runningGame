import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

export type ShipVariant = "classic" | "sloop" | "brig" | "stealth";

type Props = { style?: ViewStyle; variant?: ShipVariant; hullColor?: string; sailColor?: string };

export default function Ship({ style, variant = "classic", hullColor = "#8b4513", sailColor = "#f1f5f9" }: Props) {
  return (
    <View style={[styles.player, style]}>
      <View style={[styles.shipHull, hullStyles[variant], { backgroundColor: hullColor }]} />
      <View style={[styles.shipMast, mastStyles[variant]]} />
      <View style={[styles.shipSail, sailStyles[variant], { borderBottomColor: sailColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    position: "absolute",
    width: 48,
    height: 52,
  },
  shipHull: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 18,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 2,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.25)",
  },
  shipMast: {
    position: "absolute",
    bottom: 18,
    left: 20,
    width: 4,
    height: 28,
    backgroundColor: "#c0a080",
    borderRadius: 2,
  },
  shipSail: {
    position: "absolute",
    bottom: 18,
    left: 22,
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderLeftWidth: 0,
    borderRightWidth: 20,
    borderBottomWidth: 22,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#f1f5f9",
  },
});

const hullStyles = StyleSheet.create({
  classic: {},
  sloop: { borderTopRightRadius: 6, borderBottomRightRadius: 6, borderBottomLeftRadius: 6 },
  brig: { height: 20, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 6 },
  stealth: { height: 14, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
});

const mastStyles = StyleSheet.create({
  classic: {},
  sloop: { left: 18, height: 26 },
  brig: { left: 16, width: 5, height: 30 },
  stealth: { left: 22, width: 3, height: 24, backgroundColor: "#9aa0a6" },
});

const sailStyles = StyleSheet.create({
  classic: {},
  sloop: { borderRightWidth: 18, borderBottomWidth: 18 },
  brig: { borderRightWidth: 22, borderBottomWidth: 24 },
  stealth: { borderRightWidth: 16, borderBottomWidth: 16 },
});

