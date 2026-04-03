import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  size: number;
  /** 1 = full time remaining, 0 = empty */
  progress: number;
  trackColor: string;
  accentColor: string;
  strokeWidth?: number;
};

function PowerTimerRingInner({ size, progress, trackColor, accentColor, strokeWidth = 2.5 }: Props) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const dash = circumference * p;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" opacity={0.35} />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={accentColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
    </View>
  );
}

export default memo(PowerTimerRingInner);
