import React, { memo, useEffect } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { colors, radius } from "./theme";
import { useResponsive } from "./useResponsive";
import { scale } from "../../../utils/responsive";
import { enterRewardCard, CARD_SHINE_MS, REWARD_PULSE_MS } from "./homeMotion";

/** Accent strip with shine sweep — no duplicate stats (score lives in the top HUD). */
function HomeRewardStripInner() {
  const { scale, fontPixel, heightPixel } = useResponsive();
  const shine = useSharedValue(0);
  const pulse = useSharedValue(0);
  const track = scale(120);

  useEffect(() => {
    shine.value = withRepeat(
      withTiming(1, { duration: CARD_SHINE_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: REWARD_PULSE_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [shine, pulse]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shine.value, [0, 1], [-track, track * 2.2]) }],
    opacity: interpolate(shine.value, [0, 0.18, 0.82, 1], [0, 0.5, 0.45, 0]),
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(pulse.value, [0, 1], ["rgba(255,255,255,0.12)", "rgba(0,229,255,0.35)"]),
  }));

  return (
    <Animated.View
      entering={enterRewardCard()}
      style={[
        styles.root,
        {
          borderRadius: scale(radius.md),
          paddingVertical: heightPixel(12),
          paddingHorizontal: scale(16),
          maxWidth: scale(340),
          width: "100%",
        },
        bodyStyle,
      ]}
    >
      <View style={[styles.shineClip, { borderRadius: scale(radius.md - 2) }]}>
        <Animated.View style={[styles.shine, shineStyle]} pointerEvents="none">
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.5)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shineGrad}
          />
        </Animated.View>
      </View>
      <Text style={[styles.title, { fontSize: fontPixel(12), marginBottom: heightPixel(4) }]}>READY TO RUN</Text>
      <Text style={[styles.sub, { fontSize: fontPixel(13) }]}>Steer · Dodge · Chain your score</Text>
    </Animated.View>
  );
}

export default memo(HomeRewardStripInner);

const styles = StyleSheet.create({
  root: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: scale(1),
    overflow: "hidden",
  },
  shineClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "48%",
    left: 0,
  },
  shineGrad: {
    flex: 1,
    transform: [{ skewX: "-18deg" }],
  },
  title: {
    color: colors.textPrimary,
    letterSpacing: 3,
    fontWeight: "900",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  sub: {
    color: colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
