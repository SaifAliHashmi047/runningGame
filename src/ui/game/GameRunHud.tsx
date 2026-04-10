import React, { memo, useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";
import { colors, fontUi } from "../home/theme";
import HudPressable from "./HudPressable";

/** Shared gameplay HUD chrome — glass + cyan edge, matches FuturisticGameplayBackground */
const GLASS_BG = "rgba(15,23,42,0.42)";
const GLASS_BORDER = "rgba(56,189,248,0.38)";
const GLASS_BORDER_SOFT = "rgba(255,255,255,0.10)";
const RADIUS_SM = scale(12);
const RADIUS_MD = scale(14);

export type GameRunHudProps = {
  score: number;
  distanceFloor: number;
  /** Total coin wallet (matches shop / persistence). */
  coinsCollected: number;
  gameOver?: boolean;
  shopOpen?: boolean;
  runPaused?: boolean;
  onToggleRunPause?: () => void;
  onOpenShop?: () => void;
  onExitToHome?: () => void;
};

function PauseGlyph() {
  return (
    <View style={styles.pauseGlyph} accessibilityLabel="Pause">
      <View style={styles.pauseBar} />
      <View style={[styles.pauseBar, styles.pauseBarRight]} />
    </View>
  );
}

function SkinsGlyph() {
  return (
    <Text style={styles.skinsGlyph} accessibilityLabel="Skins">
      ◇
    </Text>
  );
}

function GlassIconButton({
  onPress,
  disabled,
  children,
}: {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <HudPressable onPress={onPress} disabled={disabled} style={styles.iconBtnOuter}>
      <View style={[styles.iconBtn, disabled && styles.iconBtnDisabled]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.03)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.iconBtnEdge} pointerEvents="none" />
        {children}
      </View>
    </HudPressable>
  );
}

function GlassTextButton({
  onPress,
  label,
  tone,
}: {
  onPress?: () => void;
  label: string;
  tone: "resume" | "neutral";
}) {
  const border = tone === "resume" ? "rgba(34,197,94,0.45)" : GLASS_BORDER;
  return (
    <HudPressable onPress={onPress} style={styles.iconBtnOuter}>
      <View style={[styles.textBtn, { borderColor: border }]}>
        <LinearGradient
          colors={
            tone === "resume"
              ? ["rgba(34,197,94,0.18)", "rgba(15,23,42,0.5)"]
              : ["rgba(255,255,255,0.08)", "rgba(15,23,42,0.45)"]
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.textBtnLabel}>{label}</Text>
      </View>
    </HudPressable>
  );
}

function GameRunHudInner({
  score,
  distanceFloor,
  coinsCollected,
  gameOver = false,
  shopOpen = false,
  runPaused = false,
  onToggleRunPause,
  onOpenShop,
  onExitToHome,
}: GameRunHudProps) {
  const { width: winW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const showRunPauseControls = !gameOver && !shopOpen && onToggleRunPause;
  const compact = winW < 360;
  const scoreFont = compact ? fontPixel(22) : fontPixel(27);
  const distFont = compact ? fontPixel(11) : fontPixel(12);
  const coinFont = compact ? fontPixel(12) : fontPixel(13);

  const scoreScale = useSharedValue(1);
  const prevScore = useRef<number | null>(null);
  useEffect(() => {
    if (prevScore.current !== null && score > prevScore.current) {
      scoreScale.value = withSequence(
        withTiming(1.05, { duration: 70, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
      );
    }
    prevScore.current = score;
  }, [score, scoreScale]);

  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  return (
    <View
      style={[
        styles.runHud,
        {
          paddingTop: Math.max(heightPixel(8), insets.top + heightPixel(6)),
          paddingHorizontal: scale(12),
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.hudRow} pointerEvents="box-none">
        <View style={styles.hudSideSlot} pointerEvents="box-none">
          {showRunPauseControls ? (
            runPaused && onExitToHome ? (
              <View style={styles.leftBtnCol} pointerEvents="box-none">
                <GlassTextButton onPress={onToggleRunPause} label="Resume" tone="resume" />
                <GlassTextButton onPress={onExitToHome} label="Home" tone="neutral" />
              </View>
            ) : (
              <GlassIconButton onPress={onToggleRunPause}>
                {runPaused ? <Text style={styles.resumeGlyph}>▶</Text> : <PauseGlyph />}
              </GlassIconButton>
            )
          ) : (
            <View style={styles.hudSidePlaceholder} />
          )}
        </View>

        <View pointerEvents="none" style={styles.hudCenterSlot}>
          <View style={styles.scorePlate}>
            <LinearGradient
              colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)", "rgba(0,0,0,0)"]}
              locations={[0, 0.4, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.scorePlateBorder} pointerEvents="none" />
            <Text style={styles.scoreTag}>SCORE</Text>
            <Animated.View style={scoreAnimStyle}>
              <Text
                style={[styles.runHudScore, { fontSize: scoreFont }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {score.toLocaleString()}
              </Text>
            </Animated.View>
            <Text style={[styles.runHudDistance, { fontSize: distFont }]} numberOfLines={1}>
              {distanceFloor.toLocaleString()} m
            </Text>
            <Text style={styles.coinTag}>COINS</Text>
            <Text
              style={[styles.runHudCoins, { fontSize: coinFont }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {Math.max(0, Math.floor(coinsCollected)).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={[styles.hudSideSlot, styles.hudSideSlotEnd]} pointerEvents="box-none">
          {onOpenShop ? (
            <GlassIconButton onPress={onOpenShop}>
              <SkinsGlyph />
            </GlassIconButton>
          ) : (
            <View style={styles.hudSidePlaceholder} />
          )}
        </View>
      </View>
    </View>
  );
}

export default memo(GameRunHudInner);

const ICON = scale(40);

const styles = StyleSheet.create({
  runHud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  hudRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  hudSideSlot: {
    minWidth: ICON,
    maxWidth: "38%",
    alignItems: "flex-start",
  },
  hudSideSlotEnd: {
    alignItems: "flex-end",
    minWidth: ICON,
  },
  hudSidePlaceholder: {
    minHeight: ICON,
    minWidth: ICON,
  },
  hudCenterSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: scale(6),
  },
  scorePlate: {
    minWidth: scale(168),
    maxWidth: "92%",
    paddingTop: heightPixel(8),
    paddingBottom: heightPixel(9),
    paddingHorizontal: scale(18),
    borderRadius: RADIUS_MD,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    overflow: "hidden",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      default: { elevation: 6 },
    }),
  },
  scorePlateBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER_SOFT,
    opacity: 0.55,
    margin: StyleSheet.hairlineWidth,
  },
  scoreTag: {
    fontSize: fontPixel(8),
    letterSpacing: scale(2.6),
    color: "rgba(224,242,254,0.55)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: heightPixel(2),
    fontFamily: fontUi.mono,
  },
  runHudScore: {
    fontWeight: "800",
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
    textAlign: "center",
    width: "100%",
    fontVariant: ["tabular-nums"],
    fontFamily: fontUi.mono,
  },
  runHudDistance: {
    marginTop: heightPixel(4),
    fontWeight: "600",
    color: "rgba(186,200,220,0.82)",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    fontFamily: fontUi.mono,
  },
  coinTag: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(8),
    letterSpacing: scale(2.4),
    color: "rgba(253,224,71,0.55)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: heightPixel(2),
    fontFamily: fontUi.mono,
  },
  runHudCoins: {
    fontWeight: "800",
    color: "rgba(253,224,71,0.98)",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    textAlign: "center",
    width: "100%",
    fontVariant: ["tabular-nums"],
    fontFamily: fontUi.mono,
  },
  leftBtnCol: {
    flexDirection: "column",
    gap: heightPixel(6),
    alignItems: "stretch",
    alignSelf: "flex-start",
    minWidth: scale(88),
  },
  iconBtnOuter: {
    borderRadius: RADIUS_SM,
    overflow: "visible",
  },
  iconBtn: {
    width: ICON,
    height: ICON,
    borderRadius: RADIUS_SM,
    backgroundColor: GLASS_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      default: { elevation: 4 },
    }),
  },
  iconBtnDisabled: {
    opacity: 0.55,
  },
  iconBtnEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER_SOFT,
    opacity: 0.45,
    margin: StyleSheet.hairlineWidth,
  },
  pauseGlyph: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseBar: {
    width: scale(3),
    height: scale(14),
    borderRadius: scale(1),
    backgroundColor: colors.ice,
  },
  pauseBarRight: {
    marginLeft: scale(4),
  },
  resumeGlyph: {
    fontSize: fontPixel(16),
    color: colors.accent,
    marginLeft: scale(2),
    fontWeight: "800",
  },
  skinsGlyph: {
    fontSize: fontPixel(18),
    color: colors.sky,
    fontWeight: "300",
    marginTop: -heightPixel(1),
  },
  textBtn: {
    minHeight: heightPixel(36),
    paddingVertical: heightPixel(8),
    paddingHorizontal: scale(12),
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  textBtnLabel: {
    color: colors.ice,
    fontWeight: "800",
    fontSize: fontPixel(10),
    letterSpacing: 0.4,
    fontFamily: fontUi.mono,
  },
});
