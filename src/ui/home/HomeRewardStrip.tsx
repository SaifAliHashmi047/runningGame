import React, { memo } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors, radius } from "./theme";
import { useResponsive } from "./useResponsive";
import { scale } from "../../../utils/responsive";

/** Accent strip — static border/shine (no looping animations). */
function HomeRewardStripInner() {
  const { scale, fontPixel, heightPixel } = useResponsive();

  return (
    <View
      style={[
        styles.root,
        {
          borderRadius: scale(radius.md),
          paddingVertical: heightPixel(12),
          paddingHorizontal: scale(16),
          maxWidth: scale(340),
          width: "100%",
          borderColor: "rgba(0,229,255,0.22)",
        },
      ]}
    >
      <View style={[styles.shineClip, { borderRadius: scale(radius.md - 2) }]} pointerEvents="none">
        <View style={[styles.shine, { opacity: 0.35 }]}>
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.22)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shineGrad}
          />
        </View>
      </View>
      <Text style={[styles.title, { fontSize: fontPixel(12), marginBottom: heightPixel(4) }]}>READY TO RUN</Text>
      <Text style={[styles.sub, { fontSize: fontPixel(13) }]}>Steer · Dodge · Chain your score</Text>
    </View>
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
    width: "38%",
    left: "28%",
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
