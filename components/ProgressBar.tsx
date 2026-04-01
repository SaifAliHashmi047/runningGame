import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type Props = {
  progress: number; // 0..1
  vertical?: boolean;
  style?: ViewStyle;
  length?: number; // px length of the bar (height for vertical, width for horizontal)
  colors?: string[]; // gradient-like multicolor without libs
};

export default function ProgressBar({
  progress,
  vertical = false,
  style,
  length = 220,
  colors = ["#22c55e", "#a3e635", "#facc15", "#fb923c", "#f43f5e"],
}: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  if (vertical) {
    return (
      <View style={[styles.wrap, style, { paddingHorizontal: 0, width: 18 }]}>
        <View style={[styles.track, styles.trackShadow, { width: 10, height: length, borderRadius: 10 }]}>
          <View style={[styles.fillClipV, { height: `${pct * 100}%` }]}>
            <View style={[styles.segmentWrapV]}>
              {colors.map((c, i) => (
                <View key={i} style={[styles.segmentV, { backgroundColor: c, height: length / colors.length }]} />
              ))}
            </View>
          </View>
          <View style={styles.capTop} />
          <View style={styles.capBottom} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.wrap, style, { width: length + 24 }]}>
      <View style={[styles.track, styles.trackShadow, { width: length, borderRadius: 10 }]}>
        <View style={[styles.fillClipH, { width: `${pct * 100}%`, borderRadius: 10 }]}>
          <View style={styles.segmentWrapH}>
            {colors.map((c, i) => (
              <View key={i} style={[styles.segmentH, { backgroundColor: c, width: length / colors.length }]} />
            ))}
          </View>
        </View>
        <View style={styles.capLeft} />
        <View style={styles.capRight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
  },
  track: {
    height: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  trackShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fillClipH: {
    height: "100%",
    overflow: "hidden",
  },
  fillClipV: {
    width: "100%",
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  segmentWrapH: {
    flexDirection: "row",
    height: "100%",
  },
  segmentH: {
    height: "100%",
  },
  segmentWrapV: {
    width: "100%",
    justifyContent: "flex-end",
  },
  segmentV: {
    width: "100%",
  },
  capLeft: {
    position: "absolute",
    left: -2,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  capRight: {
    position: "absolute",
    right: -2,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  capTop: {
    position: "absolute",
    top: -2,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  capBottom: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});

