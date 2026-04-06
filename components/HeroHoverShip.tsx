import React, { memo } from "react";
import { StyleSheet, View, Image, type ViewStyle, type ImageSourcePropType } from "react-native";
import type { VisualQualityTier } from "../src/game/performanceConfig";
import { HeroHoverShipSvg } from "../src/game/assets";
import { GameSvgArt } from "../src/game/svgArt";

type Props = {
  style?: ViewStyle;
  width?: number;
  height?: number;
  /** Kept for API compatibility with callers; no motion tied to tier. */
  qualityTier?: VisualQualityTier;
  /** When set, replaces the default SVG hero (bitmap skins). */
  skinImage?: ImageSourcePropType;
};

function HeroHoverShipInner({
  style,
  width = 56,
  height = 60,
  skinImage,
}: Props) {
  return (
    <View style={[styles.wrap, { width, height }, style]}>
      {skinImage ? (
        <Image source={skinImage} style={{ width, height }} resizeMode="contain" />
      ) : (
        <GameSvgArt module={HeroHoverShipSvg} width={width} height={height} />
      )}
    </View>
  );
}

export default memo(HeroHoverShipInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
