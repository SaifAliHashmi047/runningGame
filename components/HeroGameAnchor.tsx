import React, { memo } from "react";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import type { VisualQualityTier } from "../src/game/performanceConfig";
import HeroHoverShip from "./HeroHoverShip";

type Props = {
  width: number;
  height: number;
  steerSV: SharedValue<number>;
  leftSV: SharedValue<number>;
  bottomSV: SharedValue<number>;
  pulseScaleSV: SharedValue<number>;
  magnetYSV: SharedValue<number>;
  qualityTier: VisualQualityTier;
  children?: React.ReactNode;
};

/**
 * Positions the hero with Reanimated shared values (updated from the RAF loop)
 * so React does not reconcile `left` / `bottom` on the ship every frame.
 */
function HeroGameAnchorInner({
  width,
  height,
  steerSV,
  leftSV,
  bottomSV,
  pulseScaleSV,
  magnetYSV,
  qualityTier,
  children,
}: Props) {
  const posStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: leftSV.value,
    bottom: bottomSV.value,
    width,
    height,
    transform: [{ scale: pulseScaleSV.value }, { translateY: magnetYSV.value }],
  }));

  return (
    <Animated.View style={posStyle}>
      <HeroHoverShip width={width} height={height} steerSV={steerSV} qualityTier={qualityTier} />
      {children}
    </Animated.View>
  );
}

export default memo(HeroGameAnchorInner);
