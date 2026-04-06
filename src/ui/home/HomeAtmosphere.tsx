import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { arcadeGradients } from "./theme";
import Starfield from "../splash/Starfield";

/**
 * Extra depth on top of day-cycle art: top cyan wash, bottom vignette, drifting star veil.
 */
function HomeAtmosphereInner() {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.linear }),
      -1,
      true,
    );
  }, [drift]);

  const driftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (drift.value * 2 - 1) * 20 },
      { translateY: (drift.value * 2 - 1) * -8 },
    ],
    opacity: 0.38,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[...arcadeGradients.homeTopWash]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[...arcadeGradients.homeVignette]}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, driftStyle]}>
        <Starfield starTint="rgba(186,200,255,0.55)" />
      </Animated.View>
    </View>
  );
}

export default memo(HomeAtmosphereInner);
