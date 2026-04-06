import React, { memo, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { heightPixel, scale } from "../../../utils/responsive";

type Particle = {
  leftPct: number;
  topPct: number;
  size: number;
  alpha: number;
  tint: "cyan" | "purple" | "white";
  phase: number;
};

type Props = {
  /** Lower = fewer particles (helps perf tiers). */
  density?: "low" | "medium";
};

function tintColor(t: Particle["tint"]) {
  switch (t) {
    case "cyan":
      return "rgba(0,229,255,0.9)";
    case "purple":
      return "rgba(167,139,250,0.9)";
    default:
      return "rgba(255,255,255,0.9)";
  }
}

/**
 * Subtle floating specks to add depth (premium arcade “atmosphere”).
 * UI-only: no touch interception.
 */
const ParticleDot = memo(function ParticleDot({
  p,
  t,
  wobbleAmp,
  driftAmp,
}: {
  p: Particle;
  t: SharedValue<number>;
  wobbleAmp: number;
  driftAmp: number;
}) {
  const aStyle = useAnimatedStyle(() => {
    const wobble = Math.sin((t.value + p.phase) * Math.PI * 2) * wobbleAmp;
    const drift = Math.cos((t.value + p.phase) * Math.PI * 2) * driftAmp;
    const pulse = 0.75 + 0.25 * Math.sin((t.value + p.phase) * Math.PI * 2);
    return {
      transform: [{ translateX: wobble }, { translateY: drift }, { scale: pulse }],
      opacity: p.alpha * (0.7 + 0.3 * pulse),
    };
  }, [driftAmp, wobbleAmp]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          left: `${p.leftPct}%`,
          top: `${p.topPct}%`,
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,
          backgroundColor: tintColor(p.tint),
          shadowColor:
            p.tint === "purple" ? "#a78bfa" : p.tint === "cyan" ? "#00e5ff" : "#ffffff",
        },
        aStyle,
      ]}
    />
  );
});

function AmbientParticlesInner({ density = "medium" }: Props) {
  // Keep a stable max set; density just changes how many are shown.
  const maxN = 18;
  const visibleN = density === "low" ? 10 : 18;
  const particles = useMemo<Particle[]>(() => {
    const out: Particle[] = [];
    for (let i = 0; i < maxN; i++) {
      const r = (i * 9301 + 49297) % 233280; // deterministic-ish
      const u = (r / 233280) * 0.999;
      const leftPct = 8 + ((i * 37) % 84);
      const topPct = 6 + ((i * 29) % 58);
      const size = Math.round(scale(1.2 + ((i * 13) % 18) / 10));
      const alpha = 0.12 + (u % 0.18);
      const tint = (i % 7 === 0 ? "purple" : i % 5 === 0 ? "cyan" : "white") as Particle["tint"];
      const phase = (i % 9) / 9;
      out.push({ leftPct, topPct, size, alpha, tint, phase });
    }
    return out;
  }, []);

  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = 0;
    t.value = withRepeat(
      withTiming(1, { duration: 7200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [t]);

  // Must not call `scale` / `heightPixel` inside `useAnimatedStyle` — that runs on the UI thread.
  const wobbleAmp = scale(6);
  const driftAmp = heightPixel(4);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {particles.slice(0, visibleN).map((p, idx) => (
        <ParticleDot key={`p-${idx}`} p={p} t={t} wobbleAmp={wobbleAmp} driftAmp={driftAmp} />
      ))}
    </View>
  );
}

export default memo(AmbientParticlesInner);

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      default: { elevation: 6 },
    }),
  },
});

