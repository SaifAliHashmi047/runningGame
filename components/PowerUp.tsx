import React, { memo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import type { PowerUpKind } from "../src/game/powers";
import { defFor } from "../src/game/powers";
import PowerUpIcon from "../src/ui/powerups/PowerUpIcon";
import { scale } from "../utils/responsive";

/** Padding around the world `size` box — parent should place the root at `(x - this, y - this)` when using embedded world coords. */
export function powerUpWorldRenderOutset(size: number): number {
  return Math.round(scale(10) + size * 0.12);
}

type Props = {
  kind: PowerUpKind;
  size: number;
  style?: ViewStyle;
  embedded?: boolean;
};

function PowerUpInner({ kind, size, style, embedded }: Props) {
  const def = defFor(kind);

  const pad = powerUpWorldRenderOutset(size);
  return (
    <View
      style={[
        styles.wrap,
        !embedded && styles.absolute,
        style,
        { width: size + pad * 2, height: size + pad * 2 },
      ]}
    >
      {!embedded && (
        <View
          style={[
            styles.glow,
            {
              width: size + pad * 2 + scale(10),
              height: size + pad * 2 + scale(10),
              borderColor: def.accent,
            },
          ]}
        />
      )}
      <View style={[styles.pedestal, { width: size + scale(12), height: size + scale(12), borderColor: def.ring }]}>
        <PowerUpIcon kind={kind} size={size} ambient style={{ backgroundColor: "rgba(15,23,42,0.2)" }} />
      </View>
    </View>
  );
}

export default memo(PowerUpInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  absolute: {
    position: "absolute",
  },
  pedestal: {
    borderRadius: scale(18),
    borderWidth: scale(1.5),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: scale(2),
    opacity: 0.35,
  },
});
