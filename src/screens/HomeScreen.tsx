import React, { useEffect, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HIGH_SCORE_KEY } from "../storage/persistenceKeys";
import AnimatedDayCycleBackground from "../ui/AnimatedDayCycleBackground";
import LogoMark from "../ui/home/LogoMark";
import PulseRings from "../ui/home/PulseRings";
import HomePlayButton from "../ui/home/HomePlayButton";
import HomeHudBar from "../ui/home/HomeHudBar";
import HomeRewardStrip from "../ui/home/HomeRewardStrip";
import HomeBottomBar from "../ui/home/HomeBottomBar";
import HomeStatsModal from "../ui/home/HomeStatsModal";
import { HomeScreenBanner } from "../ads";
import { heightPixel, scale } from "../../utils/responsive";
import { getAudioManager } from "../audio";
type Props = {
  onPlay?: () => void;
  onOpenShop?: () => void;
  coins?: number;
};

export default function HomeScreen({ onPlay, onOpenShop, coins = 0 }: Props) {
  const { width: winW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logoSize = Math.min(scale(220), winW - scale(48));
  const [highScore, setHighScore] = useState(0);
  const [statsOpen, setStatsOpen] = useState(false);

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
        <View style={[styles.shell, { paddingBottom }]}>
          <View style={[styles.topHud, { paddingTop: heightPixel(10), paddingHorizontal: scale(20) }]}>
            <HomeHudBar highScore={highScore} coins={coins} />
          </View>

          <View style={[styles.main, { paddingHorizontal: scale(24) }]}>
            <View style={styles.heroBlock}>
              <View style={styles.ringsLayer}>
                <PulseRings />
              </View>
              <View style={styles.logoLayer}>
                <LogoMark size={logoSize} />
              </View>
            </View>

            <View style={{ height: heightPixel(10) }} />
            <HomeRewardStrip />

            <View style={{ marginTop: heightPixel(22), alignItems: "center" }}>
              <HomePlayButton title="PLAY" onPress={onPlay} />
            </View>
          </View>

          <HomeBottomBar
            items={[
              { key: "skins", label: "SHOP", onPress: onOpenShop },
              {
                key: "stats",
                label: "STATS",
                onPress: () => {
                  getAudioManager().playButtonTap();
                  setStatsOpen(true);
                },
              },
            ]}
          />
          <HomeScreenBanner />
          <HomeStatsModal
            visible={statsOpen}
            highScore={highScore}
            onClose={() => setStatsOpen(false)}
          />
        </View>
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
