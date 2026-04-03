import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PerfSamplerStats } from "../game/performanceSampler";
import { fontPixel, heightPixel, scale } from "../../utils/responsive";

type Props = {
  visible: boolean;
  stats: PerfSamplerStats | null;
};

export default function FpsPerfOverlay({ visible, stats }: Props) {
  if (!visible || !stats) return null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Text style={styles.line}>
        FPS {stats.fps.toFixed(0)} · avg {stats.avgFrameMs.toFixed(2)} ms · drops {stats.droppedFrames}
      </Text>
      <Text style={styles.line}>
        Tier {stats.visualTier} · obstacles {stats.obstacleCount} · FX {stats.extraFxCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: scale(8),
    bottom: heightPixel(140),
    zIndex: 1000,
    paddingHorizontal: scale(10),
    paddingVertical: heightPixel(8),
    borderRadius: scale(8),
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  line: {
    color: "#bef264",
    fontSize: fontPixel(11),
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
});
