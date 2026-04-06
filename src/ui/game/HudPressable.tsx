import React from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  hitSlop?: number;
};

/**
 * Compact press feedback for in-game HUD chips (spring scale, 60fps-friendly).
 */
export default function HudPressable({ onPress, disabled, style, children, hitSlop = 8 }: Props) {
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.06 }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 18, stiffness: 320 });
      }}
      onPress={onPress}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}
