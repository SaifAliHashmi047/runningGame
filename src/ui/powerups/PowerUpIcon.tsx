import React, { memo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { SvgProps } from "react-native-svg";
import type { PowerUpKind } from "../../game/powers";
import {
  PowerShieldSvg,
  PowerMagnetSvg,
  PowerBoostSvg,
  PowerSlowTimeSvg,
  PowerMultiplierSvg,
  PowerGhostPhaseSvg,
  PowerCoinBurstSvg,
} from "../../game/assets";
import { GameSvgArt } from "../../game/svgArt";

type SvgMod = React.ComponentType<SvgProps> | number;

const SVG_BY_KIND: Record<PowerUpKind, SvgMod> = {
  shield: PowerShieldSvg,
  magnet: PowerMagnetSvg,
  boost: PowerBoostSvg,
  slowTime: PowerSlowTimeSvg,
  multiplier: PowerMultiplierSvg,
  ghostPhase: PowerGhostPhaseSvg,
  coinBurst: PowerCoinBurstSvg,
};

export type PowerUpIconProps = {
  kind: PowerUpKind;
  size: number;
  style?: StyleProp<ViewStyle>;
  /** Softer look for world pickups */
  ambient?: boolean;
};

function PowerUpIconInner({ kind, size, style, ambient = false }: PowerUpIconProps) {
  const mod = SVG_BY_KIND[kind];
  const pad = ambient ? Math.max(2, Math.round(size * 0.08)) : 0;
  const inner = size - pad * 2;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.28 }, style]}>
      <View style={[styles.art, ambient && styles.artAmbient]}>
        <GameSvgArt module={mod} width={inner} height={inner} />
      </View>
    </View>
  );
}

export default memo(PowerUpIconInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(15,23,42,0.35)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
  art: {
    alignItems: "center",
    justifyContent: "center",
  },
  artAmbient: {
    opacity: 0.98,
  },
});
