import React, { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";
import type { PowerUpKind } from "../../game/powers";
import { defFor, POWERUP_DEFS } from "../../game/powers";
import PowerUpIcon from "./PowerUpIcon";
import PowerTimerRing from "./PowerTimerRing";

export type ActivePowerSlot = {
  kind: PowerUpKind;
  remaining01: number;
  endsAt: number;
};

export type ActivePowerUpsHudProps = {
  shieldUntil: number;
  multiplierUntil: number;
  magnetUntil: number;
  boostUntil: number;
  slowTimeUntil: number;
  ghostPhaseUntil: number;
};

function buildSlots(props: ActivePowerUpsHudProps, now: number): ActivePowerSlot[] {
  const out: ActivePowerSlot[] = [];
  const push = (kind: PowerUpKind, until: number) => {
    if (until <= now) return;
    const def = POWERUP_DEFS[kind];
    const total = def.durationMs;
    if (total <= 0) return;
    const remaining = Math.max(0, until - now);
    out.push({ kind, remaining01: remaining / total, endsAt: until });
  };

  push("shield", props.shieldUntil);
  push("multiplier", props.multiplierUntil);
  push("magnet", props.magnetUntil);
  push("boost", props.boostUntil);
  push("slowTime", props.slowTimeUntil);
  push("ghostPhase", props.ghostPhaseUntil);

  out.sort((a, b) => defFor(a.kind).sortOrder - defFor(b.kind).sortOrder);
  return out;
}

const HUD_NOW_INTERVAL_MS = 200;

function useHudClock(stepMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(id);
  }, [stepMs]);
  return now;
}

function ActivePowerUpsHudInner(props: ActivePowerUpsHudProps) {
  const { width } = useWindowDimensions();
  const now = useHudClock(HUD_NOW_INTERVAL_MS);
  const slots = useMemo(
    () => buildSlots(props, now),
    [
      now,
      props.shieldUntil,
      props.multiplierUntil,
      props.magnetUntil,
      props.boostUntil,
      props.slowTimeUntil,
      props.ghostPhaseUntil,
    ]
  );

  if (slots.length === 0) return null;

  const compact = width < 380;
  const cardSize = compact ? 46 : 52;
  const ringSize = cardSize + 10;
  const iconSize = Math.round(cardSize * 0.65);

  return (
    <View style={styles.row} pointerEvents="none">
      {slots.map((s) => {
        const def = defFor(s.kind);
        return (
          <View key={s.kind} style={[styles.card, { width: ringSize, minHeight: ringSize + heightPixel(18) }]}>
            <View style={styles.ringWrap}>
              <PowerTimerRing
                size={ringSize}
                progress={s.remaining01}
                trackColor="rgba(255,255,255,0.22)"
                accentColor={def.ring}
                strokeWidth={scale(2.5)}
              />
              <View style={[styles.iconCenter, { width: ringSize, height: ringSize }]}>
                <PowerUpIcon kind={s.kind} size={iconSize} />
              </View>
            </View>
            <Text style={styles.timerText} numberOfLines={1}>
              {Math.max(0, Math.ceil((s.endsAt - now) / 1000))}s
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default memo(ActivePowerUpsHudInner);

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    top: heightPixel(10),
    right: scale(8),
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    maxWidth: "72%",
    gap: scale(6),
    zIndex: 60,
  },
  card: {
    alignItems: "center",
  },
  ringWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCenter: {
    position: "absolute",
    left: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(10),
    fontWeight: "800",
    color: "rgba(226,232,240,0.92)",
    letterSpacing: 0.3,
  },
});
