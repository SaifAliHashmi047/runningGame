import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AnimatedDayCycleBackground from "../ui/AnimatedDayCycleBackground";
import LogoMarkHero from "../ui/home/LogoMarkHero";
import PulseRings from "../ui/home/PulseRings";
import HomePlayButton from "../ui/home/HomePlayButton";
import HomeHudBar from "../ui/home/HomeHudBar";
import HomeRewardStrip from "../ui/home/HomeRewardStrip";
import HomeBottomBar from "../ui/home/HomeBottomBar";
import { heightPixel, scale } from "../../utils/responsive";
import { enterHero, enterPlay, enterRings } from "../ui/home/homeMotion";
type Props = {
  onPlay?: () => void;
};

const HIGH_SCORE_KEY = "@stackRunner/highScore";

export default function HomeScreen({ onPlay }: Props) {
  const insets = useSafeAreaInsets();
  const [highScore, setHighScore] = useState(0);

  const paddingBottom = insets.bottom + heightPixel(32);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        if (!cancelled && raw) {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) setHighScore(n);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatedDayCycleBackground parallaxEnabled readabilityVignetteEnabled>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Animated.View entering={FadeIn.duration(280)} style={[styles.shell, { paddingBottom }]}>
          <View style={[styles.topHud, { paddingTop: heightPixel(10), paddingHorizontal: scale(20) }]}>
            <HomeHudBar highScore={highScore} />
          </View>

          <View style={[styles.main, { paddingHorizontal: scale(24) }]}>
            <View style={styles.heroBlock}>
              <Animated.View style={styles.ringsLayer} entering={enterRings()}>
                <PulseRings />
              </Animated.View>
              <Animated.View entering={enterHero()} style={styles.logoLayer}>
                <LogoMarkHero />
              </Animated.View>
            </View>

            <View style={{ height: heightPixel(10) }} />
            <HomeRewardStrip />

            <Animated.View entering={enterPlay()} style={{ marginTop: heightPixel(22), alignItems: "center" }}>
              <HomePlayButton title="PLAY" onPress={onPlay} />
            </Animated.View>
          </View>

          <HomeBottomBar
            items={[
              { key: "skins", label: "SHOP", onPress: undefined },
              { key: "stats", label: "STATS", onPress: undefined },
              { key: "settings", label: "MENU", onPress: undefined },
            ]}
          />
        </Animated.View>
      </SafeAreaView>
    </AnimatedDayCycleBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  shell: {
    flex: 1,
  },
  topHud: {
    width: "100%",
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBlock: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: heightPixel(260),
  },
  ringsLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLayer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});
