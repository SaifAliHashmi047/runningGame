import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";
import LogoMark, { resolveLogoMarkBox } from "../home/LogoMark";
import { arcadeGradients, fontUi, gameCopy } from "../home/theme";
import Starfield from "./Starfield";

const HOLD_MS = 2650;
const EXIT_MS = 480;

type Props = {
  onComplete: () => void;
};

/**
 * Premium intro: gradient + stars → logo scales in → subtle float → title → exit to home.
 */
export default function GameSplashScreen({ onComplete }: Props) {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(scale(368), width * 0.82);
  const splashLogoBox = resolveLogoMarkBox(logoSize);
  const splashHeroExtent = Math.max(splashLogoBox.width, splashLogoBox.height);

  const master = useSharedValue(0);
  const stars = useSharedValue(0);
  const logo = useSharedValue(0);
  const title = useSharedValue(0);
  const floatPhase = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    master.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
    stars.value = withDelay(
      180,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
    );
    logo.value = withDelay(
      380,
      withTiming(1, { duration: 780, easing: Easing.out(Easing.cubic) }),
    );
    title.value = withDelay(
      920,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    );
    floatPhase.value = withDelay(
      320,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    const t = setTimeout(() => {
      exit.value = withTiming(
        1,
        { duration: EXIT_MS, easing: Easing.inOut(Easing.cubic) },
        (done) => {
          if (done) runOnJS(onComplete)();
        },
      );
    }, HOLD_MS);

    return () => clearTimeout(t);
  }, [exit, floatPhase, logo, master, onComplete, stars, title]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: interpolate(exit.value, [0, 1], [1, 0]),
    transform: [{ scale: interpolate(exit.value, [0, 1], [1, 1.045]) }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(master.value, [0, 1], [0, 1]),
  }));

  const starsStyle = useAnimatedStyle(() => ({
    opacity: stars.value * interpolate(exit.value, [0, 1], [1, 0]),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logo.value, [0, 0.35, 1], [0, 0.4, 1]) * interpolate(exit.value, [0, 1], [1, 0]),
    transform: [
      {
        scale: interpolate(logo.value, [0, 1], [0.86, 1]),
      },
    ],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(floatPhase.value, [0, 1], [-5, 5]),
      },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value * interpolate(exit.value, [0, 1], [1, 0]),
    transform: [
      {
        translateY: interpolate(title.value, [0, 1], [14, 0]),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(logo.value, [0, 0.3, 1], [0, 0.25, 0.6]) *
      interpolate(exit.value, [0, 1], [1, 0]),
    transform: [
      {
        scale: interpolate(floatPhase.value, [0, 1], [0.98, 1.04]),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="auto">
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient
          colors={[...arcadeGradients.splash]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[...arcadeGradients.splashAccent]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, starsStyle]}>
        <Starfield />
      </Animated.View>

      <View style={styles.center} pointerEvents="none">
        <View
          style={[
            styles.heroStack,
            {
              width: splashHeroExtent * 1.42,
              height: splashHeroExtent * 1.42,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.glowBlob,
              {
                width: splashHeroExtent * 1.22,
                height: splashHeroExtent * 1.22,
              },
              glowStyle,
            ]}
          />
          <Animated.View style={[styles.logoFloat, floatStyle]}>
            <Animated.View style={logoStyle}>
              <LogoMark size={logoSize} />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.titleBlock, titleStyle]}>
          <Text style={[styles.gameTitle, { fontSize: fontPixel(26) }]}>{gameCopy.title}</Text>
          <Text style={[styles.gameTag, { fontSize: fontPixel(11), marginTop: heightPixel(8) }]}>
            {gameCopy.tagline}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: "#050814",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: heightPixel(28),
    paddingBottom: heightPixel(48),
  },
  heroStack: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowBlob: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(56,189,248,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(56,189,248,0.9)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.65,
        shadowRadius: 28,
      },
      default: {
        elevation: 18,
      },
    }),
  },
  logoFloat: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    marginTop: heightPixel(28),
    alignItems: "center",
  },
  gameTitle: {
    color: "#f8fafc",
    fontWeight: "900",
    letterSpacing: scale(4),
    fontFamily: fontUi.mono,
    textShadowColor: "rgba(0,229,255,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  gameTag: {
    color: "rgba(186,200,220,0.88)",
    letterSpacing: scale(3),
    fontWeight: "700",
    fontFamily: fontUi.mono,
  },
});
