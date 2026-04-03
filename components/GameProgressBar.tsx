import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
  Platform,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { fontPixel, heightPixel, scale } from "../utils/responsive";

const FILL_GRADIENT = ["#22D3EE", "#3B82F6", "#8B5CF6"] as const;
const TRACK_GRADIENT = ["#0F172A", "#1E293B"] as const;
const BADGE_GRADIENT = ["rgba(34,211,238,0.95)", "rgba(139,92,246,0.95)"] as const;

const DEFAULT_SEGMENTS = 8;
const BADGE_MIN_W = scale(52);
const SPRING = { damping: 24, stiffness: 190, mass: 0.75 };

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export type GameProgressBarProps = {
  /** 0–100 */
  progress: number;
  /** Pill track height (dp). */
  height?: number;
  showPercentage?: boolean;
  animated?: boolean;
  /** Top caption, e.g. "RUN PROGRESS". Omit with "". */
  label?: string;
  style?: StyleProp<ViewStyle>;
  segmentCount?: number;
};

export default function GameProgressBar({
  progress,
  height = scale(20),
  showPercentage = true,
  animated = true,
  label,
  style,
  segmentCount = DEFAULT_SEGMENTS,
}: GameProgressBarProps) {
  const resolvedLabel = label === undefined ? "RUN PROGRESS" : label;
  const [trackW, setTrackW] = useState(0);
  const progressSv = useSharedValue(clamp(progress, 0, 100));
  const pulseSv = useSharedValue(1);

  const [badgePct, setBadgePct] = useState(() => Math.round(clamp(progress, 0, 100)));

  const onBadge = useCallback((v: number) => {
    setBadgePct(Math.round(clamp(v, 0, 100)));
  }, []);

  useEffect(() => {
    const target = clamp(progress, 0, 100);
    if (animated) {
      progressSv.value = withSpring(target, SPRING);
      pulseSv.value = withSequence(
        withTiming(1.05, { duration: 130, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 240, easing: Easing.inOut(Easing.cubic) })
      );
    } else {
      progressSv.value = target;
      pulseSv.value = 1;
    }
  }, [progress, animated, progressSv, pulseSv]);

  useAnimatedReaction(
    () => progressSv.value,
    (v, prev) => {
      if (prev === null || Math.round(v) !== Math.round(prev)) {
        runOnJS(onBadge)(v);
      }
    },
    [onBadge]
  );

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  }, []);

  const markerSize = Math.max(scale(12), Math.min(scale(28), Math.round(height * 0.52)));
  const lineW = scale(2);
  const lineAbove = Math.round(height * 0.5);
  const radius = height / 2;

  const fillStyle = useAnimatedStyle(() => {
    const w = trackW;
    if (w <= 0) return { width: 0 };
    const p = progressSv.value / 100;
    return { width: p * w };
  }, [trackW]);

  const markerXStyle = useAnimatedStyle(() => {
    const w = trackW;
    if (w <= 0) return { opacity: 0, transform: [{ translateX: 0 }] };
    const p = progressSv.value / 100;
    const center = p * w;
    const x = Math.min(w - markerSize, Math.max(0, center - markerSize / 2));
    return { opacity: 1, transform: [{ translateX: x }] };
  }, [trackW, markerSize]);

  const glowPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseSv.value, [1, 1.05], [0.32, 0.5], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(pulseSv.value, [1, 1.05], [1, 1.14], Extrapolation.CLAMP) },
    ],
  }));

  const badgeStyle = useAnimatedStyle(() => {
    const w = trackW;
    if (w <= 0 || !showPercentage) return { opacity: 0, transform: [{ translateX: 0 }] };
    const p = progressSv.value / 100;
    const center = p * w;
    const half = BADGE_MIN_W / 2;
    const x = Math.min(w - BADGE_MIN_W, Math.max(0, center - half));
    return { opacity: 1, transform: [{ translateX: x }] };
  }, [trackW, showPercentage]);

  const segments =
    segmentCount > 1 ? Array.from({ length: segmentCount - 1 }, (_, i) => i + 1) : [];

  const badgeRowWidth = trackW > 0 ? trackW : undefined;

  return (
    <View style={[styles.root, style]} accessibilityRole="progressbar" accessibilityValue={{ now: badgePct, min: 0, max: 100 }}>
      {resolvedLabel ? (
        <Text style={styles.label} numberOfLines={1}>
          {resolvedLabel}
        </Text>
      ) : null}

      <View style={styles.badgeLane}>
        {showPercentage ? (
          <View style={[styles.badgeMeasure, badgeRowWidth != null ? { width: badgeRowWidth } : styles.badgeMeasureStretch]}>
            <Animated.View style={[styles.badgePill, badgeStyle]}>
              <LinearGradient colors={[...BADGE_GRADIENT]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.badgeGradient}>
                <Text style={styles.badgeText}>{badgePct}%</Text>
              </LinearGradient>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.badgePlaceholder} />
        )}
      </View>

      <View style={[styles.trackStack, { height }]} onLayout={onTrackLayout}>
        <LinearGradient
          colors={[...TRACK_GRADIENT]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.trackShell, { height, borderRadius: radius }]}
        >
          <View style={[styles.trackInnerStroke, { borderRadius: radius }]} />
        </LinearGradient>

        <View style={[styles.trackFace, { height, borderRadius: radius }]} pointerEvents="none">
          <Animated.View style={[styles.fillClip, fillStyle, { borderRadius: Math.max(3, radius - 2) }]}>
            <LinearGradient colors={[...FILL_GRADIENT]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </Animated.View>

          {segments.map((i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  left: `${(i / segmentCount) * 100}%`,
                  marginLeft: -scale(1.5),
                  height: Math.max(scale(8), Math.round(height * 0.5)),
                },
              ]}
            />
          ))}
        </View>

        <View style={[styles.markerOverlay, { height }]} pointerEvents="none">
          <Animated.View style={[styles.markerTrack, markerXStyle, { width: markerSize }]} accessible={false}>
            <View style={styles.markerStack}>
              <Animated.View
                style={[
                  styles.markerGlow,
                  glowPulseStyle,
                  {
                    width: markerSize * 1.55,
                    height: markerSize * 1.55,
                    borderRadius: markerSize * 0.775,
                  },
                ]}
              />
              <View style={[styles.indicatorLine, { width: lineW, height: lineAbove }]} />
              <View style={[styles.markerPlate, { width: markerSize, height: markerSize, borderRadius: markerSize / 2 }]}>
                <LinearGradient colors={[...FILL_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.markerGem, { borderRadius: markerSize / 2 - scale(3) }]} />
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  label: {
    color: "rgba(226,232,240,0.92)",
    fontSize: fontPixel(11),
    fontWeight: "700",
    letterSpacing: scale(2),
    marginBottom: heightPixel(6),
  },
  badgeLane: {
    minHeight: heightPixel(28),
    marginBottom: heightPixel(4),
  },
  badgeMeasure: {
    height: heightPixel(28),
  },
  badgeMeasureStretch: {
    height: heightPixel(28),
    width: "100%",
  },
  badgePlaceholder: {
    height: scale(4),
  },
  badgePill: {
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: scale(14),
    minWidth: BADGE_MIN_W,
    overflow: "hidden",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.32,
    shadowRadius: scale(8),
    elevation: 5,
  },
  badgeGradient: {
    paddingHorizontal: scale(12),
    paddingVertical: heightPixel(5),
    alignItems: "center",
    justifyContent: "center",
    minWidth: BADGE_MIN_W,
  },
  badgeText: {
    color: "#F8FAFC",
    fontSize: fontPixel(12),
    fontWeight: "800",
    letterSpacing: 0.6,
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  trackStack: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  trackShell: {
    width: "100%",
    borderWidth: scale(1),
    borderColor: "rgba(51,65,85,0.96)",
  },
  trackInnerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: scale(1),
    borderColor: "rgba(148,163,184,0.1)",
  },
  trackFace: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  markerOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
  },
  fillClip: {
    position: "absolute",
    left: scale(1),
    top: scale(2),
    bottom: scale(2),
    overflow: "hidden",
  },
  segment: {
    position: "absolute",
    top: "50%",
    marginTop: -heightPixel(8),
    width: scale(2),
    borderRadius: scale(1),
    backgroundColor: "rgba(248,250,252,0.14)",
  },
  markerTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    alignItems: "center",
  },
  markerStack: {
    alignItems: "center",
    marginBottom: -scale(1),
  },
  markerGlow: {
    position: "absolute",
    bottom: scale(2),
    backgroundColor: "rgba(56,189,248,0.55)",
  },
  indicatorLine: {
    marginBottom: scale(2),
    backgroundColor: "rgba(226,232,240,0.48)",
    borderRadius: scale(1),
  },
  markerPlate: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,250,252,0.97)",
    borderWidth: scale(1),
    borderColor: "rgba(148,163,184,0.38)",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    elevation: 3,
  },
  markerGem: {
    width: "70%",
    height: "70%",
  },
});

/**
 * Usage:
 *
 * import GameProgressBar from "./components/GameProgressBar";
 *
 * <GameProgressBar
 *   progress={Math.min(100, (speed / MAX_SPEED) * 100)}
 *   height={22}
 *   label="RUN PROGRESS"
 *   showPercentage
 *   animated
 * />
 */
