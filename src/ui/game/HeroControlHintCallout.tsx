import React, { useEffect } from "react";
import { Platform, StyleSheet, Text } from "react-native";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";
import { colors, fontUi } from "../home/theme";

/** Long enough to read comfortably. */
const DISPLAY_MS = 5600;

type Props = {
  bottomOffset: number;
  onDismiss: () => void;
};

/**
 * Onboarding when the user drags from empty space — explains that steering requires holding the hero.
 */
export default function HeroControlHintCallout({ bottomOffset, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, DISPLAY_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16).stiffness(200)}
      exiting={FadeOut.duration(320)}
      style={[styles.wrap, { bottom: bottomOffset }]}
    >
      <LinearGradient
        colors={["rgba(56,189,248,0.38)", "rgba(15,23,42,0.92)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.title}>Control Tip</Text>
        <Text style={styles.sub}>
          Hold the hero and drag to move.{"\n"}
          The hero won't move unless you keep holding it.
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: scale(14),
    right: scale(14),
    zIndex: 26,
  },
  card: {
    paddingVertical: heightPixel(16),
    paddingHorizontal: scale(20),
    borderRadius: scale(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(56,189,248,0.48)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.32,
        shadowRadius: 10,
      },
      default: { elevation: 8 },
    }),
  },
  title: {
    fontFamily: fontUi.mono,
    fontSize: fontPixel(15),
    fontWeight: "800",
    color: colors.ice,
    textAlign: "center",
    letterSpacing: 0.15,
  },
  sub: {
    marginTop: heightPixel(8),
    fontFamily: fontUi.mono,
    fontSize: fontPixel(12),
    fontWeight: "600",
    color: "rgba(186,200,220,0.92)",
    textAlign: "center",
    lineHeight: Math.round(fontPixel(12) * 1.45),
  },
});
