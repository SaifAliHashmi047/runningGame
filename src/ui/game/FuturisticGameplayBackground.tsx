import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

export type FuturisticGameplayBackgroundProps = {
  /** Window / wrapper size — use `useWindowDimensions()` so rotation and safe-area changes stay correct. */
  width: number;
  height: number;
};

/**
 * Full-screen sci-fi gameplay backdrop (bundled art) + light readability overlays.
 */
function FuturisticGameplayBackgroundInner({ width, height }: FuturisticGameplayBackgroundProps) {
  if (width <= 0 || height <= 0) {
    return <View style={[styles.fallback, { width: "100%", height: "100%" }]} />;
  }

  return (
    <View style={[styles.root, { width, height }]}>
      <Image
        source={require("../../assets/bg/gameplay_futuristic_highway.jpg")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        blurRadius={18}
        progressiveRenderingEnabled
        fadeDuration={0}
      />
      <View style={styles.fillDim} pointerEvents="none" />
      <Image
        source={require("../../assets/bg/gameplay_futuristic_highway.jpg")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="contain"
        fadeDuration={0}
      />

      {/* Soft top wash to tie into HUD palette */}
      <LinearGradient
        colors={["rgba(0,229,255,0.10)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Bottom fog + vignette for readability */}
      <LinearGradient
        colors={["transparent", "rgba(8,12,26,0.22)", "rgba(2,6,18,0.62)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Subtle center lift — guides lane without beams */}
      <LinearGradient
        colors={["transparent", "rgba(0,229,255,0.045)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.centerLift}
        pointerEvents="none"
      />

      {/* Vignette for HUD / gameplay contrast */}
      <LinearGradient
        colors={["rgba(2,6,18,0.46)", "transparent", "transparent", "rgba(2,6,18,0.52)"]}
        locations={[0, 0.22, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

export default memo(FuturisticGameplayBackgroundInner);

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    backgroundColor: "#040816",
  },
  fallback: {
    backgroundColor: "#040816",
  },
  fillDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,8,22,0.25)",
  },
  centerLift: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
});
