import React, { memo, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";
import HighScoreBadge from "./HighScoreBadge";

type Props = {
  highScore: number;
  coins: number;
};

/**
 * Top HUD: best score with a soft count-up on first paint (no card pulse / layout entry).
 */
function HomeHudBarInner({ highScore, coins }: Props) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (highScore <= 0) {
      setDisplayScore(0);
      return;
    }
    let raf = 0;
    const start = Date.now();
    const dur = Math.min(900, 320 + highScore * 0.12);
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.floor(highScore * eased + 0.001));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [highScore]);

  return (
    <View style={[styles.row, { paddingHorizontal: scale(14), gap: scale(10) }]}>
      <View style={[styles.chipsRow, { gap: scale(8) }]}>
        <View
          style={[
            styles.card,
            {
              borderRadius: scale(radius.lg),
              paddingVertical: heightPixel(4),
              paddingHorizontal: scale(6),
              ...shadow.light,
            },
          ]}
        >
          <HighScoreBadge highScore={displayScore} />
        </View>
        <View
          style={[
            styles.card,
            {
              borderRadius: scale(radius.lg),
              paddingVertical: heightPixel(4),
              paddingHorizontal: scale(6),
              ...shadow.light,
            },
          ]}
        >
          <View
            style={[
              styles.metricInner,
              {
                paddingHorizontal: scale(10),
                paddingVertical: scale(6),
                borderRadius: scale(radius.md),
              },
            ]}
          >
            <Text
              style={[styles.metricLabel, { fontSize: fontPixel(10), marginRight: scale(6) }]}
            >
              COINS
            </Text>
            <Text
              style={[styles.metricValue, { fontSize: fontPixel(16) }]}
              numberOfLines={1}
            >
              {Math.max(0, Math.floor(coins)).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default memo(HomeHudBarInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 0,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: "rgba(8,12,24,0.5)",
  },
  /** Matches `HighScoreBadge` inner panel so COINS reads like BEST. */
  metricInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  metricLabel: {
    color: colors.textTertiary,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  metricValue: {
    color: colors.textPrimary,
    fontWeight: "900",
    flexShrink: 1,
    minWidth: 0,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
