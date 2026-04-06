import React, { memo } from "react";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import type { ImageSourcePropType } from "react-native";
import type { VisualQualityTier } from "../src/game/performanceConfig";
import HeroHoverShip from "./HeroHoverShip";

type Props = {
  width: number;
  height: number;
  leftSV: SharedValue<number>;
  bottomSV: SharedValue<number>;
  qualityTier: VisualQualityTier;
  skinImage?: ImageSourcePropType;
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
      <HeroHoverShip width={width} height={height} qualityTier={qualityTier} skinImage={skinImage} />
      {children}
    </Animated.View>
  );
}

export default memo(HeroGameAnchorInner);
