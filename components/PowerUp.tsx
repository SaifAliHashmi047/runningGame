import React, { memo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import type { PowerUpKind } from "../src/game/powers";
import PowerUpIcon from "../src/ui/powerups/PowerUpIcon";
import { scale } from "../utils/responsive";

/** Padding around the world `size` box — parent places root at `(x - this, y - this)`. */
export function powerUpWorldRenderOutset(size: number): number {
  return Math.round(scale(6) + size * 0.06);
}

type Props = {
  kind: PowerUpKind;
  size: number;
  style?: ViewStyle;
  embedded?: boolean;
};

function PowerUpInner({ kind, size, style, embedded }: Props) {
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
      <PowerUpIcon kind={kind} size={size} ambient />
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
});
