import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HIGH_SCORE_KEY } from "../storage/persistenceKeys";
import LogoMark from "../ui/home/LogoMark";
import HomeCosmicBackground from "../ui/home/HomeCosmicBackground";
import HomePlayButton from "../ui/home/HomePlayButton";
import HomeTopStats from "../ui/home/HomeTopStats";
import HomeIntroBlock from "../ui/home/HomeIntroBlock";
import HomeActionRow from "../ui/home/HomeActionRow";
import HomeStatsModal from "../ui/home/HomeStatsModal";
import HomeAtmosphere from "../ui/home/HomeAtmosphere";
import { HomeScreenBanner } from "../ads";
import { heightPixel, scale, wp } from "../../utils/responsive";
import { getAudioManager } from "../audio";

type Props = {
  onPlay?: () => void;
  onOpenShop?: () => void;
  coins?: number;
  /** When false, the anchored banner is not mounted (e.g. until splash finishes). */
  showBannerAds?: boolean;
};

const easeOut = Easing.out(Easing.ease);

/**
 * Staggered entrance (same rhythm as your reference): hero → stat cards @180ms → play @300ms,
 * plus intro / secondary row shortly after so the column feels sequenced, not cluttered.
 */
export default function HomeScreen({
  onPlay,
  onOpenShop,
  coins = 0,
  showBannerAds = true,
}: Props) {
  const { height: winH, width: winW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** Short phones (SE-class / small Android): tighter flex stack + smaller logo cap. */
  const compact = winH < 700;
  const narrow = winW < 360;
  const adReserve = Math.max(insets.bottom, heightPixel(8)) + heightPixel(52);
  const paddingBottom = insets.bottom + heightPixel(12);
  /** Rough chrome above the flex body (stats row + safe padding). */
  const topChrome = heightPixel(72);
  const bottomChrome = paddingBottom + (showBannerAds ? adReserve : heightPixel(20));
  const availableBody = Math.max(100, winH - insets.top - topChrome - bottomChrome);
  const heroMaxH = Math.min(heightPixel(compact ? 220 : 300), Math.floor(availableBody * 0.48));
  const playMarginTop = compact ? heightPixel(6) : winH < 780 ? heightPixel(10) : heightPixel(18);
  const heroPaddingTop = compact ? heightPixel(4) : heightPixel(16);
  const logoLayerMarginTop = compact ? heightPixel(4) : heightPixel(10);
  const [highScore, setHighScore] = useState(0);
  const [statsOpen, setStatsOpen] = useState(false);

  const logoSize = useMemo(
    () =>
      Math.min(
        scale(compact ? 200 : 280),
        wp(100) - scale(14),
        Math.floor(availableBody * (compact ? 0.34 : 0.4)),
      ),
    [compact, availableBody, winW],
  );

  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(24);
  const cardsOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(20);
  const introOpacity = useSharedValue(0);
  const introTranslateY = useSharedValue(18);
  const playOpacity = useSharedValue(0);
  const playScale = useSharedValue(0.92);
  const actionsOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(16);

  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [floatY]);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 500, easing: easeOut });
    heroTranslateY.value = withTiming(0, { duration: 500, easing: easeOut });

    cardsOpacity.value = withDelay(180, withTiming(1, { duration: 450, easing: easeOut }));
    cardsTranslateY.value = withDelay(180, withTiming(0, { duration: 450, easing: easeOut }));

    introOpacity.value = withDelay(240, withTiming(1, { duration: 400, easing: easeOut }));
    introTranslateY.value = withDelay(240, withTiming(0, { duration: 400, easing: easeOut }));

    playOpacity.value = withDelay(300, withTiming(1, { duration: 420, easing: easeOut }));
    playScale.value = withDelay(300, withTiming(1, { duration: 420, easing: easeOut }));

    actionsOpacity.value = withDelay(380, withTiming(1, { duration: 400, easing: easeOut }));
    actionsTranslateY.value = withDelay(380, withTiming(0, { duration: 400, easing: easeOut }));
  }, []);

  const heroEntranceStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const cardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsTranslateY.value }],
  }));

  const introStyle = useAnimatedStyle(() => ({
    opacity: introOpacity.value,
    transform: [{ translateY: introTranslateY.value }],
  }));

  const playStyle = useAnimatedStyle(() => ({
    opacity: playOpacity.value,
    transform: [{ scale: playScale.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [{ translateY: actionsTranslateY.value }],
  }));

  const heroFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (floatY.value * 2 - 1) * 6 }],
  }));

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
    <View style={styles.homeRoot}>
      <HomeCosmicBackground />
      <View style={styles.bgWrap}>
        <HomeAtmosphere />
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
          <View style={[styles.shell, { paddingBottom }]}>
            <Animated.View
              style={[styles.topZone, { paddingTop: heightPixel(8), paddingHorizontal: scale(18) }, cardsStyle]}
            >
              <HomeTopStats highScore={highScore} coins={coins} />
            </Animated.View>

            <View style={styles.body}>
              <View
                style={[
                  styles.main,
                  {
                    paddingHorizontal: scale(narrow ? 16 : 22),
                    maxWidth: 520,
                    alignSelf: "center",
                    justifyContent: compact ? "flex-start" : "space-between",
                    paddingTop: heightPixel(compact ? 2 : 6),
                    paddingBottom: heightPixel(compact ? 4 : 8),
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.heroBlock,
                    {
                      maxHeight: heroMaxH,
                      paddingTop: heroPaddingTop,
                    },
                    heroEntranceStyle,
                  ]}
                >
                  <Animated.View style={[styles.logoLayer, { marginTop: logoLayerMarginTop }, heroFloatStyle]}>
                    <LogoMark size={logoSize} />
                  </Animated.View>
                </Animated.View>

                <Animated.View style={[introStyle, styles.introShrink]}>
                  <HomeIntroBlock compact={compact} />
                </Animated.View>

                <Animated.View
                  style={[
                    playStyle,
                    {
                      marginTop: playMarginTop,
                      alignItems: "center",
                      width: "100%",
                    },
                  ]}
                >
                  <HomePlayButton title="PLAY" onPress={onPlay} compact={compact} />
                </Animated.View>

                <Animated.View style={[actionsStyle, styles.actionsNoGrow]}>
                  <HomeActionRow
                    compact={compact}
                    onShop={onOpenShop}
                    onStats={() => {
                      getAudioManager().playButtonTap();
                      setStatsOpen(true);
                    }}
                  />
                </Animated.View>
              </View>
            </View>

            {showBannerAds ? (
              <View style={[styles.adDock, { minHeight: adReserve, paddingBottom: insets.bottom }]}>
                <View style={styles.adHairline} />
                <HomeScreenBanner />
              </View>
            ) : null}

            <HomeStatsModal
              visible={statsOpen}
              highScore={highScore}
              onClose={() => setStatsOpen(false)}
            />
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  homeRoot: {
    flex: 1,
    backgroundColor: "#040816",
  },
  bgWrap: {
    flex: 1,
    position: "relative",
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  shell: {
    flex: 1,
  },
  topZone: {
    width: "100%",
    zIndex: 2,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minHeight: 0,
    zIndex: 2,
  },
  main: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
  },
  heroBlock: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flexShrink: 1,
    minHeight: 0,
  },
  introShrink: {
    flexShrink: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
  },
  actionsNoGrow: {
    flexShrink: 0,
    width: "100%",
    alignItems: "center",
  },
  logoLayer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  adDock: {
    alignSelf: "stretch",
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    zIndex: 2,
  },
  adHairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(56,189,248,0.2)",
    marginHorizontal: scale(24),
    marginBottom: heightPixel(4),
  },
});
