import React from "react";
import { View, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { heightPixel, scale } from "../utils/responsive";

type Props = {
  height: number;
};

const DECK_TOP = ["rgba(8,14,32,0.96)", "rgba(15,23,42,0.94)", "rgba(12,18,38,0.98)"] as const;

/**
 * Futuristic deck — matches glass HUD; no vertical grid or heavy spine beams.
 */
export default function SkyLane({ height }: Props) {
  return (
    <View style={[styles.root, { height }]} pointerEvents="none">
      <LinearGradient colors={[...DECK_TOP]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Top edge — energy seam into sky */}
      <LinearGradient
        colors={["rgba(0,229,255,0.12)", "rgba(99,102,241,0.06)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topSeam}
      />

      <LinearGradient
        colors={["transparent", "rgba(56,189,248,0.10)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.horizonLine}
      />

      {/* Subtle forward motion hint — horizontal bands only */}
      <LinearGradient
        colors={["transparent", "rgba(0,229,255,0.04)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.band, { bottom: height * 0.38, opacity: 0.9 }]}
      />
      <LinearGradient
        colors={["transparent", "rgba(167,139,250,0.035)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.band, { bottom: height * 0.22 }]}
      />

      {/* Faint center pulse on deck — very low contrast */}
      <LinearGradient
        colors={["transparent", "rgba(125,211,252,0.06)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.deckCenterGlow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(56,189,248,0.28)",
  },
  topSeam: {
    position: "absolute",
    top: -heightPixel(20),
    left: 0,
    right: 0,
    height: heightPixel(28),
  },
  horizonLine: {
    position: "absolute",
    top: -scale(1),
    left: "12%",
    right: "12%",
    height: StyleSheet.hairlineWidth,
  },
  band: {
    position: "absolute",
    left: "8%",
    right: "8%",
    height: heightPixel(2),
    borderRadius: scale(2),
  },
  deckCenterGlow: {
    position: "absolute",
    left: "32%",
    right: "32%",
    top: "12%",
    bottom: "18%",
    borderRadius: scale(16),
  },
});
