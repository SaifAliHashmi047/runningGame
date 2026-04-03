import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Platform } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  color?: string;
};

export default function PrimaryButton({ title, onPress, style, color = colors.accent }: Props) {
  const press = useSharedValue(0);
  const { scale, fontPixel, heightPixel } = useResponsive();

  const rstyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.04 }],
  }));

  return (
    <Animated.View style={[styles.shadow, rstyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => (press.value = withSpring(1, { damping: 20, stiffness: 300 }))}
        onPressOut={() => (press.value = withSpring(0))}
        onPress={onPress}
        style={[
          styles.root,
          {
            backgroundColor: color,
            borderRadius: scale(radius.xl),
            paddingHorizontal: scale(28),
            paddingVertical: heightPixel(14),
          },
          style,
        ]}
      >
        <Text style={[styles.title, { fontSize: fontPixel(18), letterSpacing: 1.2 }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#021018",
    fontWeight: "900",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  shadow: {
    ...shadow.heavy,
  },
});

