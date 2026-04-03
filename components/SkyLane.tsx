import React from "react";
import { View, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { heightPixel, scale } from "../utils/responsive";

type Props = {
  height: number;
  /** Score zone — shifts void + neon accents when provided. */
  voidColors?: readonly [string, string, string];
  spineColors?: readonly [string, string, string, string];
};

const DEFAULT_VOID: readonly [string, string, string] = ["#070b14", "#0f1729", "#0c111c"];
const DEFAULT_SPINE: readonly [string, string, string, string] = [
  "transparent",
  "rgba(34,211,238,0.55)",
  "rgba(139,92,246,0.45)",
  "transparent",
];

/**
 * Futuristic energy lane (no water): graded deck, neon spine, side rails, faint depth grid.
 */
export default function SkyLane({ height, voidColors = DEFAULT_VOID, spineColors = DEFAULT_SPINE }: Props) {
  return (
    <View style={[styles.root, { height }]} pointerEvents="none">
      <LinearGradient
        colors={[...voidColors]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Horizon strip */}
      <View style={styles.horizonGlow} />
      <LinearGradient
        colors={["transparent", "rgba(34,211,238,0.08)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.horizonLine}
      />

      {/* Depth grid */}
      <View style={styles.gridLayer}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridV,
              {
                left: `${12 + i * 13}%`,
                opacity: 0.06 + (i % 2) * 0.04,
              },
            ]}
          />
        ))}
      </View>

      {/* Lane deck */}
      <LinearGradient
        colors={["rgba(15,23,42,0.94)", "rgba(30,41,59,0.98)", "rgba(15,23,42,0.96)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.deck}
      />

      {/* Neon spine */}
      <LinearGradient
        colors={[...spineColors]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.spine}
      />
      <View style={styles.spineCore} />

      {/* Side rails */}
      <LinearGradient
        colors={["rgba(56,189,248,0.35)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.railLeft}
      />
      <LinearGradient
        colors={["transparent", "rgba(167,139,250,0.3)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.railRight}
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
    borderTopWidth: scale(1),
    borderTopColor: "rgba(56,189,248,0.22)",
  },
  horizonGlow: {
    position: "absolute",
    top: -heightPixel(32),
    left: 0,
    right: 0,
    height: heightPixel(48),
    backgroundColor: "rgba(59,130,246,0.07)",
  },
  horizonLine: {
    position: "absolute",
    top: -scale(2),
    left: "8%",
    right: "8%",
    height: scale(3),
    borderRadius: scale(2),
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridV: {
    position: "absolute",
    top: "10%",
    bottom: 0,
    width: scale(1),
    backgroundColor: "#7dd3fc",
  },
  deck: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.88,
  },
  spine: {
    position: "absolute",
    left: "50%",
    marginLeft: -scale(12),
    width: scale(24),
    top: "18%",
    bottom: 0,
    borderRadius: scale(12),
  },
  spineCore: {
    position: "absolute",
    left: "50%",
    marginLeft: -scale(1),
    width: scale(2),
    top: "22%",
    bottom: scale(6),
    backgroundColor: "rgba(125,211,252,0.5)",
  },
  railLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: scale(14),
  },
  railRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: scale(14),
  },
});
