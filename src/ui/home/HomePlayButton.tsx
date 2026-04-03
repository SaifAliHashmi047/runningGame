import React, { memo, useEffect } from "react";
import { Pressable, Text, StyleSheet, Platform, ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { colors, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";
import { CTA_IDLE_PULSE_MS, HOME_SPRING_PRESS } from "./homeMotion";

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
};

function HomePlayButtonInner({ title, onPress, style }: Props) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  const press = useSharedValue(0);
  const breathe = useSharedValue(0);

  const r = scale(radius.xl);
  const padH = scale(32);
  const padV = heightPixel(16);
  const glowPad = scale(10);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: CTA_IDLE_PULSE_MS * 0.55, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: CTA_IDLE_PULSE_MS * 0.45, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [breathe]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.4, 0.88]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.08]) }],
  }));

  const shellStyle = useAnimatedStyle(() => {
    const idle = interpolate(breathe.value, [0, 1], [0, 0.046]);
    const p = press.value;
    return {
      transform: [{ scale: 1 + idle - p * 0.078 }],
    };
  });

  return (
    <Animated.View style={[styles.shadowHost, shellStyle, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowBlob,
          glowStyle,
          {
            borderRadius: r + glowPad,
            top: -glowPad,
            left: -glowPad,
            right: -glowPad,
            bottom: -glowPad,
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,179,0,0.65)", "rgba(255,77,219,0.35)", "rgba(0,229,255,0.45)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: r + glowPad }]}
        />
      </Animated.View>
      <Pressable
        onPressIn={() => {
          press.value = withSpring(1, HOME_SPRING_PRESS);
        }}
        onPressOut={() => {
          press.value = withSpring(0, HOME_SPRING_PRESS);
        }}
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.96 : 1 }]}
      >
        <LinearGradient
          colors={["#ffc53d", colors.cta, "#ff9e00"]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[
            styles.cta,
            {
              borderRadius: r,
              paddingHorizontal: padH,
              paddingVertical: padV,
            },
          ]}
        >
          <Text style={[styles.title, { fontSize: fontPixel(19), letterSpacing: scale(2) }]}>{title}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default memo(HomePlayButtonInner);

const styles = StyleSheet.create({
  shadowHost: {
    alignItems: "center",
    justifyContent: "center",
    ...shadow.heavy,
  },
  glowBlob: {
    position: "absolute",
    zIndex: 0,
  },
  pressable: {
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.38)",
  },
  title: {
    color: "#0b1020",
    fontWeight: "900",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
