import React, { memo } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";

/**
 * Full-bleed raster for Home — blur fill + sharp contain (no letterbox bars), aligned with gameplay BG treatment.
 */
function HomeCosmicBackgroundInner() {
  const { width, height } = useWindowDimensions();
  if (width <= 0 || height <= 0) {
    return <View style={[styles.fallback, StyleSheet.absoluteFillObject]} />;
  }

  const src = require("../../assets/bg/home_cosmic_highway.jpg");

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.root]} pointerEvents="none">
      <View style={{ width, height }}>
        <Image
          source={src}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          blurRadius={20}
          progressiveRenderingEnabled
          fadeDuration={0}
        />
        <View style={styles.fillDim} pointerEvents="none" />
        <Image
          source={src}
          style={StyleSheet.absoluteFillObject}
          resizeMode="contain"
          fadeDuration={0}
        />
        <LinearGradient
          colors={["rgba(0,229,255,0.08)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.32 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", "rgba(8,12,26,0.2)", "rgba(2,6,18,0.55)"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(2,6,18,0.38)", "transparent", "transparent", "rgba(2,6,18,0.45)"]}
          locations={[0, 0.2, 0.72, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

export default memo(HomeCosmicBackgroundInner);

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
    backgroundColor: "rgba(4,8,22,0.22)",
  },
});
