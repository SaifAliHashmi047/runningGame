import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { assets } from "./theme";
import { useResponsive } from "./useResponsive";

export default function HeroPreview() {
  const { scale, heightPixel } = useResponsive();
  const float = useSharedValue(0);
  const tilt = useSharedValue(0);
  // Precompute scaled constants outside of worklets to avoid non-worklet calls on UI thread
  const floatAmplitude = heightPixel(10);
  const heroSize = scale(200);

  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true);
    tilt.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.cubic) }), -1, true);
  }, [float, tilt]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: (float.value - 0.5) * floatAmplitude },
      { rotateZ: `${(tilt.value - 0.5) * 4}deg` },
      { scale: 1.02 },
    ],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={style}>
        <Image source={assets.character} style={{ width: heroSize, height: heroSize, resizeMode: "contain" }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
});

