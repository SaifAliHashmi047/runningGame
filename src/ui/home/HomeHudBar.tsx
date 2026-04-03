import React, { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { colors, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";
import HighScoreBadge from "./HighScoreBadge";
import { enterTopHud } from "./homeMotion";

type Props = {
  highScore: number;
};

/**
 * Top HUD: best score with a soft count-up on first paint + card pulse.
 */
function HomeHudBarInner({ highScore }: Props) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  const [displayScore, setDisplayScore] = useState(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [pulse]);

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

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.96 + pulse.value * 0.04 }],
  }));

  return (
    <Animated.View entering={enterTopHud()} style={[styles.row, { paddingHorizontal: scale(14), gap: scale(10) }]}>
      <Animated.View
        style={[
          styles.card,
          cardStyle,
          {
            borderRadius: scale(radius.lg),
            paddingVertical: heightPixel(4),
            paddingHorizontal: scale(6),
            ...shadow.light,
          },
        ]}
      >
        <HighScoreBadge highScore={displayScore} />
      </Animated.View>
      <View
        style={[
          styles.pill,
          {
            borderRadius: scale(radius.pill),
            paddingHorizontal: scale(12),
            paddingVertical: heightPixel(6),
            borderWidth: scale(1),
          },
        ]}
      >
        <Animated.Text style={[styles.pillText, { fontSize: fontPixel(11) }]}>ARCADE RUN</Animated.Text>
      </View>
    </Animated.View>
  );
}

export default memo(HomeHudBarInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  card: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: "rgba(8,12,24,0.5)",
  },
  pill: {
    backgroundColor: "rgba(0,229,255,0.12)",
    borderColor: "rgba(0,229,255,0.28)",
  },
  pillText: {
    color: colors.accent,
    fontWeight: "800",
    letterSpacing: 3,
  },
});
