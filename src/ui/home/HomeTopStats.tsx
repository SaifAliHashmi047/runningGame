import React, { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontUi, radius } from "./theme";
import { useResponsive } from "./useResponsive";

type Props = {
  highScore: number;
  coins: number;
};

function formatNum(n: number) {
  return Math.max(0, Math.floor(n)).toLocaleString();
}

function HomeTopStatsInner({ highScore, coins }: Props) {
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

  const pad = {
    borderRadius: scale(radius.pill),
    paddingVertical: heightPixel(8),
    paddingHorizontal: scale(14),
    gap: scale(10),
  };

  return (
    <View style={[styles.row, { paddingHorizontal: scale(4), gap: scale(10) }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={[styles.pill, pad]}>
          <Text style={[styles.glyph, { fontSize: fontPixel(14) }]}>★</Text>
          <View style={styles.pillText}>
            <Text style={[styles.label, { fontSize: fontPixel(9) }]}>BEST RUN</Text>
            <Text style={[styles.value, { fontSize: fontPixel(15) }]} numberOfLines={1}>
              {formatNum(displayScore)}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={[styles.pill, pad]}>
          <Text style={[styles.glyph, { fontSize: fontPixel(14) }]}>◎</Text>
          <View style={styles.pillText}>
            <Text style={[styles.label, { fontSize: fontPixel(9) }]}>COINS</Text>
            <Text style={[styles.value, { fontSize: fontPixel(15) }]} numberOfLines={1}>
              {formatNum(coins)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default memo(HomeTopStatsInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(6,10,24,0.58)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(56,189,248,0.28)",
  },
  glyph: {
    color: colors.sky,
    opacity: 0.95,
  },
  pillText: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: colors.textTertiary,
    fontWeight: "700",
    letterSpacing: 1.4,
    fontFamily: fontUi.mono,
    marginBottom: 2,
  },
  value: {
    color: colors.ice,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    fontFamily: fontUi.mono,
  },
});
