import React, { useEffect, useMemo } from "react";
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useWindowDimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import type { SvgProps } from "react-native-svg";
import { SvgUri } from "react-native-svg";
import { BgDay, BgMorning, BgNight, BgSunset } from "../assets/dayCycle";
import type { VisualQualityTier } from "../game/performanceConfig";

export type DayCycleTiming = {
  /** Time each “morning” beat stays fully visible before crossfading. */
  morningHoldMs: number;
  dayHoldMs: number;
  sunsetHoldMs: number;
  nightHoldMs: number;
  /** Crossfade duration between consecutive beats (shared for all transitions). */
  transitionMs: number;
};

export const DEFAULT_DAY_CYCLE_TIMING: DayCycleTiming = {
  morningHoldMs: 6500,
  dayHoldMs: 6500,
  sunsetHoldMs: 6500,
  nightHoldMs: 6500,
  transitionMs: 3200,
};

export type AnimatedDayCycleBackgroundProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Partial overrides for any phase; merges on top of defaults. */
  timing?: Partial<DayCycleTiming>;
  parallaxEnabled?: boolean;
  /** Subtle edge darkening to keep mid-screen UI readable. */
  readabilityVignetteEnabled?: boolean;
  /** Adaptive: reduce layers / motion on weaker devices (gameplay unchanged). */
  visualQualityTier?: VisualQualityTier;
  /**
   * Rotates which SVG is tied to each timeline beat (morning→day→sunset→night).
   * E.g. `1` starts the cycle on “day” art instead of “morning”. Use with score tiers for different skies without retinting the canvas.
   */
  phaseRotation?: number;
  /** Increment when a run resets so the phase timeline restarts from 0 (avoids stale `progress`). */
  runSessionKey?: number;
  /**
   * Pixel size for rendered SVG layers. When omitted, falls back to {@link useWindowDimensions}.
   * Pass the same size as your gameplay `View` (e.g. from `onLayout` on the root inside
   * `SafeAreaView`) so background “slice” scale matches entity coordinates — otherwise art
   * is laid out for the full window while the game uses the smaller safe-area box and looks shifted.
   */
  artWidth?: number;
  artHeight?: number;
};

type SvgComponent = React.ComponentType<SvgProps>;
type BgModule = SvgComponent | number;

const PHASE_BACKGROUNDS: BgModule[] = [BgMorning, BgDay, BgSunset, BgNight];

function rotateBackgroundModules(arr: readonly BgModule[], steps: number): BgModule[] {
  const n = arr.length;
  if (n === 0) return [];
  const k = ((Math.floor(steps) % n) + n) % n;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

function DayCycleArt({ Bg, width, height }: { Bg: BgModule; width: number; height: number }) {
  if (typeof Bg === "function") {
    const Cmp = Bg;
    return <Cmp width={width} height={height} preserveAspectRatio="xMidYMid slice" />;
  }

  const resolved = Image.resolveAssetSource(Bg);
  const uri = resolved?.uri ?? null;
  if (uri) {
    return (
      <SvgUri
        uri={uri}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid slice"
        fallback={<View style={[styles.svgFallback, { width, height }]} />}
      />
    );
  }

  return <View style={[styles.svgFallback, { width, height }]} />;
}

function DayCycleLayer({
  phaseIndex,
  Bg,
  width,
  height,
  progress,
  totalMs,
  timing,
  parallaxEnabled,
  heavyCompositing,
}: {
  phaseIndex: number;
  Bg: BgModule;
  width: number;
  height: number;
  progress: SharedValue<number>;
  totalMs: number;
  timing: DayCycleTiming;
  parallaxEnabled: boolean;
  /** When false, skips expensive offscreen alpha compositing (gameplay tier ≥2). */
  heavyCompositing: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const u = (progress.value * totalMs) % totalMs;
    const o = opacityForPhase(
      phaseIndex,
      u,
      timing.morningHoldMs,
      timing.dayHoldMs,
      timing.sunsetHoldMs,
      timing.nightHoldMs,
      timing.transitionMs
    );

    const tau = progress.value * Math.PI * 2;
    const parallaxX = parallaxEnabled ? Math.sin(tau * 0.38 + phaseIndex * 0.85) * (5 + phaseIndex) : 0;
    const parallaxY = parallaxEnabled ? Math.cos(tau * 0.29 + phaseIndex * 0.6) * (3 + phaseIndex * 0.5) : 0;
    const scale = 1 + (parallaxEnabled ? Math.sin(tau * 0.21 + phaseIndex * 0.5) * 0.008 : 0);

    return {
      opacity: o,
      transform: [{ translateX: parallaxX }, { translateY: parallaxY }, { scale }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.layer, animatedStyle]}
      needsOffscreenAlphaCompositing={heavyCompositing}
      collapsable={false}
    >
      <DayCycleArt Bg={Bg} width={width} height={height} />
    </Animated.View>
  );
}
/**
 * Linear timeline: hold → fade → hold → fade → … → night→morning fade (loops).
 * Opacities are pairwise crossfades only; never more than two phases blend at once.
 */
function opacityForPhase(
  phaseIndex: number,
  u: number,
  m: number,
  d: number,
  s: number,
  n: number,
  t: number
): number {
  "worklet";
  let cursor = 0;

  if (u < (cursor += m)) return phaseIndex === 0 ? 1 : 0;
  if (u < (cursor += t)) {
    const p = (u - (cursor - t)) / t;
    if (phaseIndex === 0) return 1 - p;
    if (phaseIndex === 1) return p;
    return 0;
  }
  if (u < (cursor += d)) return phaseIndex === 1 ? 1 : 0;
  if (u < (cursor += t)) {
    const p = (u - (cursor - t)) / t;
    if (phaseIndex === 1) return 1 - p;
    if (phaseIndex === 2) return p;
    return 0;
  }
  if (u < (cursor += s)) return phaseIndex === 2 ? 1 : 0;
  if (u < (cursor += t)) {
    const p = (u - (cursor - t)) / t;
    if (phaseIndex === 2) return 1 - p;
    if (phaseIndex === 3) return p;
    return 0;
  }
  if (u < (cursor += n)) return phaseIndex === 3 ? 1 : 0;
  {
    const p = (u - cursor) / t;
    if (phaseIndex === 3) return 1 - p;
    if (phaseIndex === 0) return p;
    return 0;
  }
}

function AnimatedDayCycleBackground({
  children,
  style,
  contentStyle,
  timing: timingOverrides,
  parallaxEnabled = true,
  readabilityVignetteEnabled = true,
  visualQualityTier = 0,
  phaseRotation = 0,
  runSessionKey = 0,
  artWidth,
  artHeight,
}: AnimatedDayCycleBackgroundProps) {
  const windowDims = useWindowDimensions();
  const width =
    artWidth != null && artWidth > 0 && Number.isFinite(artWidth) ? artWidth : windowDims.width;
  const height =
    artHeight != null && artHeight > 0 && Number.isFinite(artHeight) ? artHeight : windowDims.height;
  const progress = useSharedValue(0);
  const effectiveParallax = parallaxEnabled && visualQualityTier < 2;
  const effectiveVignette = readabilityVignetteEnabled && visualQualityTier < 1;
  const heavyCompositing = visualQualityTier < 2;

  const backgrounds = useMemo(
    () => rotateBackgroundModules(PHASE_BACKGROUNDS, phaseRotation),
    [phaseRotation]
  );

  const t = useMemo(
    () => ({ ...DEFAULT_DAY_CYCLE_TIMING, ...timingOverrides }),
    [timingOverrides]
  );

  const totalMs = useMemo(
    () =>
      t.morningHoldMs +
      t.transitionMs +
      t.dayHoldMs +
      t.transitionMs +
      t.sunsetHoldMs +
      t.transitionMs +
      t.nightHoldMs +
      t.transitionMs,
    [t]
  );

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: Math.max(1, totalMs), easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [progress, totalMs, phaseRotation, runSessionKey]);

  return (
    <View style={[styles.root, style]}>
      {backgrounds.map((Bg, i) => (
        <DayCycleLayer
          key={`${phaseRotation}-${i}`}
          phaseIndex={i}
          Bg={Bg}
          width={width}
          height={height}
          progress={progress}
          totalMs={totalMs}
          timing={t}
          parallaxEnabled={effectiveParallax}
          heavyCompositing={heavyCompositing}
        />
      ))}

      {effectiveVignette && (
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(0,0,0,0.42)",
            "rgba(0,0,0,0.06)",
            "rgba(0,0,0,0.06)",
            "rgba(0,0,0,0.38)",
          ]}
          locations={[0, 0.32, 0.68, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.vignette}
        />
      )}

      <View style={[styles.content, contentStyle]} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

export default React.memo(AnimatedDayCycleBackground);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#0b1020",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
  svgFallback: {
    backgroundColor: "#0b1020",
  },
});
