import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { scale } from "../utils/responsive";

export type HeroPowerFxSharedValues = {
  /** Phase; update every frame for pulses. */
  time: SharedValue<number>;
  shield: SharedValue<number>;
  magnet: SharedValue<number>;
  boost: SharedValue<number>;
  slowTime: SharedValue<number>;
  x2: SharedValue<number>;
  ghost: SharedValue<number>;
};

type Props = {
  width: number;
  height: number;
  fx: HeroPowerFxSharedValues;
};

/** Richer per-power palettes (fill halo + rings) — distinct from each other on screen. */
const AURA_PALETTES = {
  shield: {
    halo: "rgba(56,189,248,0.2)",
    halo2: "rgba(147,197,253,0.12)",
    ring: "rgba(125,211,252,0.95)",
    ringInner: "rgba(224,242,254,0.75)",
  },
  magnet: {
    halo: "rgba(34,197,94,0.2)",
    halo2: "rgba(74,222,128,0.1)",
    ring: "rgba(74,222,128,0.92)",
    ringInner: "rgba(187,247,208,0.8)",
  },
  boost: {
    halo: "rgba(168,85,247,0.22)",
    halo2: "rgba(192,132,252,0.12)",
    ring: "rgba(216,180,254,0.95)",
    ringInner: "rgba(245,208,254,0.78)",
  },
  slowTime: {
    halo: "rgba(13,148,136,0.2)",
    halo2: "rgba(45,212,191,0.11)",
    ring: "rgba(94,234,212,0.92)",
    ringInner: "rgba(204,251,241,0.72)",
  },
  multiplier: {
    halo: "rgba(234,88,12,0.2)",
    halo2: "rgba(251,191,36,0.14)",
    ring: "rgba(251,146,60,0.94)",
    ringInner: "rgba(254,215,170,0.85)",
  },
  ghostPhase: {
    halo: "rgba(109,40,217,0.2)",
    halo2: "rgba(167,139,250,0.12)",
    ring: "rgba(165,180,252,0.9)",
    ringInner: "rgba(221,214,254,0.75)",
  },
} as const;

type Rhythm = {
  /** Primary breathing speed (multiplies global time). */
  breath: number;
  /** Secondary shimmer speed. */
  shimmer: number;
  /** Scale swing amplitude when active (0..1). */
  scaleAmp: number;
  /** Outer halo scales this much larger than base. */
  haloBoost: number;
};

const RHYTHMS: Record<keyof typeof AURA_PALETTES, Rhythm> = {
  shield: { breath: 1.05, shimmer: 2.2, scaleAmp: 0.09, haloBoost: 1.22 },
  magnet: { breath: 1.65, shimmer: 3.1, scaleAmp: 0.1, haloBoost: 1.26 },
  boost: { breath: 1.45, shimmer: 2.8, scaleAmp: 0.11, haloBoost: 1.24 },
  slowTime: { breath: 0.72, shimmer: 1.4, scaleAmp: 0.07, haloBoost: 1.18 },
  multiplier: { breath: 1.9, shimmer: 4.2, scaleAmp: 0.08, haloBoost: 1.2 },
  ghostPhase: { breath: 0.88, shimmer: 1.6, scaleAmp: 0.1, haloBoost: 1.28 },
};

type AuraStackProps = {
  width: number;
  height: number;
  pad: number;
  br: number;
  active: SharedValue<number>;
  time: SharedValue<number>;
  phase: number;
  palette: (typeof AURA_PALETTES)[keyof typeof AURA_PALETTES];
  rhythm: Rhythm;
};

/**
 * Three layers: soft outer halo, mid stroke ring, tight inner accent — each with its own motion.
 */
function AuraStack({
  width,
  height,
  pad,
  br,
  active,
  time,
  phase,
  palette,
  rhythm,
}: AuraStackProps) {
  const ringW = width + pad * 2;
  const ringH = height + pad * 2;
  const left = -pad;
  const top = -pad;

  const haloOuter = useAnimatedStyle(() => {
    const a = active.value;
    const t = time.value * rhythm.breath + phase;
    const breathe = 0.35 + 0.4 * Math.sin(t);
    const s =
      rhythm.haloBoost *
      (1 +
        rhythm.scaleAmp * a * Math.sin(t * 0.85) +
        0.08 * a * Math.sin(time.value * rhythm.shimmer + phase));
    return {
      opacity: a * 0.95 * breathe,
      transform: [{ scale: s }],
    };
  });

  const haloInner = useAnimatedStyle(() => {
    const a = active.value;
    const t = time.value * rhythm.breath * 1.15 + phase + 1.2;
    const pulse = 0.3 + 0.45 * Math.sin(t);
    const s =
      rhythm.haloBoost *
      0.9 *
      (1 + rhythm.scaleAmp * 0.85 * a * Math.sin(t * 1.05 + 0.5));
    return {
      opacity: a * 0.9 * pulse,
      transform: [{ scale: s }],
    };
  });

  const ringMain = useAnimatedStyle(() => {
    const a = active.value;
    const t = time.value * rhythm.shimmer + phase;
    const flicker = 0.55 + 0.4 * Math.sin(t);
    const s = 1 + rhythm.scaleAmp * 0.65 * a * Math.sin(time.value * rhythm.breath * 1.3 + phase * 0.7);
    return {
      opacity: a * flicker,
      transform: [{ scale: s }],
    };
  });

  const ringCore = useAnimatedStyle(() => {
    const a = active.value;
    const t = time.value * rhythm.shimmer * 1.4 + phase + 2.1;
    const tw = 0.5 + 0.45 * Math.sin(t);
    const s = 1 - 0.04 * a * Math.sin(time.value * rhythm.breath * 1.8 + phase);
    return {
      opacity: a * tw,
      transform: [{ scale: s }],
    };
  });

  const baseBox = useMemo(
    () => ({
      position: "absolute" as const,
      left,
      top,
      width: ringW,
      height: ringH,
      borderRadius: br,
    }),
    [left, top, ringW, ringH, br],
  );

  return (
    <>
      <Animated.View
        style={[baseBox, { backgroundColor: palette.halo }, haloOuter]}
      />
      <Animated.View
        style={[baseBox, { backgroundColor: palette.halo2 }, haloInner]}
      />
      <Animated.View
        style={[
          baseBox,
          {
            borderWidth: scale(2.8),
            borderColor: palette.ring,
            backgroundColor: "transparent",
          },
          ringMain,
        ]}
      />
      <Animated.View
        style={[
          baseBox,
          {
            borderWidth: scale(1.25),
            borderColor: palette.ringInner,
            backgroundColor: "transparent",
          },
          ringCore,
        ]}
      />
    </>
  );
}

/**
 * Layered auras behind the ship while timed powers are active (SharedValues from the sim loop).
 */
function HeroPowerEffectsInner({ width, height, fx }: Props) {
  const pad = scale(14);
  const br = scale(14);

  return (
    <View style={styles.host} pointerEvents="none">
      <AuraStack
        width={width}
        height={height}
        pad={pad}
        br={br}
        active={fx.shield}
        time={fx.time}
        phase={0}
        palette={AURA_PALETTES.shield}
        rhythm={RHYTHMS.shield}
      />
      <AuraStack
        width={width}
        height={height}
        pad={pad}
        br={br}
        active={fx.magnet}
        time={fx.time}
        phase={1.1}
        palette={AURA_PALETTES.magnet}
        rhythm={RHYTHMS.magnet}
      />
      <AuraStack
        width={width}
        height={height}
        pad={pad}
        br={br}
        active={fx.boost}
        time={fx.time}
        phase={2.3}
        palette={AURA_PALETTES.boost}
        rhythm={RHYTHMS.boost}
      />
      <AuraStack
        width={width}
        height={height}
        pad={pad}
        br={br}
        active={fx.slowTime}
        time={fx.time}
        phase={3.5}
        palette={AURA_PALETTES.slowTime}
        rhythm={RHYTHMS.slowTime}
      />
      <AuraStack
        width={width}
        height={height}
        pad={pad}
        br={br}
        active={fx.x2}
        time={fx.time}
        phase={4.7}
        palette={AURA_PALETTES.multiplier}
        rhythm={RHYTHMS.multiplier}
      />
      <AuraStack
        width={width}
        height={height}
        pad={pad}
        br={br}
        active={fx.ghost}
        time={fx.time}
        phase={5.9}
        palette={AURA_PALETTES.ghostPhase}
        rhythm={RHYTHMS.ghostPhase}
      />
    </View>
  );
}

export default memo(HeroPowerEffectsInner);

/** Purple wash on the ship while ghost phase is active (drawn above `HeroHoverShip`). */
export function HeroGhostPowerTint({ width, height, fx }: Pick<Props, "width" | "height" | "fx">) {
  const tint = useAnimatedStyle(() => {
    const g = fx.ghost.value;
    const wash = 0.22 + 0.16 * Math.sin(fx.time.value * 1.1);
    return { opacity: g * wash };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ghostTint,
        {
          width,
          height,
          borderRadius: scale(8),
          backgroundColor: "rgba(91,33,182,0.42)",
          borderWidth: scale(1.5),
          borderColor: "rgba(167,139,250,0.55)",
        },
        tint,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  ghostTint: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 2,
  },
});
