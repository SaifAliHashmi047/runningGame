import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { GAMEPLAY_BACKGROUND } from "./gameplayBackgroundAsset";

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
        source={GAMEPLAY_BACKGROUND}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        progressiveRenderingEnabled
        fadeDuration={0}
      />
    </View>
  );
}

export default memo(FuturisticGameplayBackgroundInner);

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  fallback: {
    backgroundColor: "transparent",
  },
});
