import React, { memo } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import type { ImageSourcePropType } from "react-native";
import type { VisualQualityTier } from "../src/game/performanceConfig";
import HeroHoverShip from "./HeroHoverShip";
import HeroPowerEffects, {
  HeroGhostPowerTint,
  type HeroPowerFxSharedValues,
} from "./HeroPowerEffects";

type Props = {
  width: number;
  height: number;
  leftSV: SharedValue<number>;
  bottomSV: SharedValue<number>;
  qualityTier: VisualQualityTier;
  skinImage?: ImageSourcePropType;
  /** Timed power visuals (updated from the game loop). */
  powerFx: HeroPowerFxSharedValues;
  children?: React.ReactNode;
};

/**
 * Positions the hero with Reanimated shared values (updated from the RAF loop)
 * so React does not reconcile `left` / `bottom` every frame.
 */
function HeroGameAnchorInner({
  width,
  height,
  leftSV,
  bottomSV,
  qualityTier,
  skinImage,
  powerFx,
  children,
}: Props) {
  const posStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: leftSV.value,
    bottom: bottomSV.value,
    width,
    height,
  }));

  return (
    <Animated.View pointerEvents="none" style={posStyle}>
      <HeroPowerEffects width={width} height={height} fx={powerFx} />
      <View style={{ width, height, zIndex: 1 }}>
        <HeroHoverShip width={width} height={height} qualityTier={qualityTier} skinImage={skinImage} />
      </View>
      <HeroGhostPowerTint width={width} height={height} fx={powerFx} />
      {children}
    </Animated.View>
  );
}

export default memo(HeroGameAnchorInner);
