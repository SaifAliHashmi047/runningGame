import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { colors, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";
import { scale } from "../../../utils/responsive";

type Props = {
  streakDays: number;
  nextRewardIn: string; // "06:12:09"
};

export default function DailyRewardPanel({ streakDays, nextRewardIn }: Props) {
  const { scale: s, fontPixel, heightPixel } = useResponsive();
  const boxes = useMemo(() => Array.from({ length: 5 }).map((_, i) => i < (streakDays % 5)), [streakDays]);

  return (
    <View
      style={[
        styles.root,
        {
          borderRadius: s(radius.lg),
          paddingHorizontal: s(12),
          paddingVertical: heightPixel(12),
        },
      ]}
    >
      <Text style={[styles.title, { fontSize: fontPixel(12), marginBottom: heightPixel(10) }]}>DAILY REWARD</Text>
      <View style={styles.row}>
        {boxes.map((active, idx) => (
          <View
            key={idx}
            style={[
              styles.box,
              {
                borderRadius: s(radius.md),
                width: s(46),
                height: s(46),
                backgroundColor: active ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)",
                borderColor: active ? "#22c55e" : "rgba(255,255,255,0.12)",
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.timer, { fontSize: fontPixel(11), marginTop: heightPixel(8) }]}>Next in {nextRewardIn}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "rgba(18,26,42,0.85)",
    borderWidth: scale(1),
    borderColor: "rgba(255,255,255,0.08)",
    ...shadow.light,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  box: {
    borderWidth: scale(1),
  },
  timer: {
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
