import React, { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";
import { colors } from "../home/theme";
import type { PowerUpKind } from "../../game/powers";
import { defFor, POWERUP_DEFS } from "../../game/powers";
import PowerUpIcon from "./PowerUpIcon";

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
  const iconSize = Math.round(cardSize * 0.72);
  const barW = cardSize + scale(4);

  return (
    <View style={styles.row} pointerEvents="none">
      {slots.map((s) => {
        const def = defFor(s.kind);
        return (
          <View key={s.kind} style={[styles.card, { width: barW }]}>
            <PowerUpIcon kind={s.kind} size={iconSize} />
            <View style={[styles.barTrack, { width: barW }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.round(s.remaining01 * 1000) / 10}%`,
                    backgroundColor: def.accent,
                  },
                ]}
              />
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

/** Clears `GameRunHud` score block (incl. coins) + side chips on the top-right. */
const POWER_HUD_TOP = heightPixel(122);

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    top: POWER_HUD_TOP,
    right: scale(10),
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignContent: "flex-start",
    maxWidth: "58%",
    gap: scale(6),
    zIndex: 60,
  },
  card: {
    alignItems: "center",
  },
  barTrack: {
    marginTop: heightPixel(4),
    height: heightPixel(3),
    borderRadius: heightPixel(2),
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: heightPixel(2),
  },
  timerText: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(10),
    fontWeight: "800",
    color: colors.ice,
    letterSpacing: 0.3,
    fontVariant: ["tabular-nums"],
  },
});
