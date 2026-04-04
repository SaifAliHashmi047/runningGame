import React, { memo } from "react";
import { Pressable, Text, StyleSheet, Platform, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { colors, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";
import { HOME_SPRING_PRESS } from "./homeMotion";

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
};

function HomePlayButtonInner({ title, onPress, style }: Props) {
  const { scale, fontPixel, heightPixel } = useResponsive();
  const press = useSharedValue(0);

  const r = scale(radius.xl);
  const padH = scale(32);
  const padV = heightPixel(16);
  const glowPad = scale(10);

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.078 }],
  }));

  return (
    <Animated.View style={[styles.shadowHost, shellStyle, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.glowBlob,
          styles.glowBlobStatic,
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
      </View>
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
  glowBlobStatic: {
    opacity: 0.72,
    transform: [{ scale: 1.04 }],
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
