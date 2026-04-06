import React, { memo, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

type Dot = { x: number; y: number; w: number; opacity: number };

function makeStars(count: number, w: number, h: number): Dot[] {
  const out: Dot[] = [];
  for (let i = 0; i < count; i++) {
    const x = ((i * 137.517) % 997) / 997;
    const y = ((i * 211.423 + 41) % 991) / 991;
    out.push({
      x: x * w,
      y: y * h,
      w: 1 + (i % 3),
      opacity: 0.2 + ((i * 17) % 50) / 100,
    });
  }
  return out;
}

/**
 * Lightweight star dots (Views only) — animate opacity on a parent `Animated.View`.
 */
function StarfieldInner({ starTint = "rgba(224,242,254,0.92)" }: { starTint?: string }) {
  const { width, height } = useWindowDimensions();
  const dots = useMemo(() => makeStars(52, width, height), [width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((d, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              left: d.x,
              top: d.y,
              width: d.w,
              height: d.w,
              opacity: d.opacity,
              backgroundColor: starTint,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default memo(StarfieldInner);

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    borderRadius: 2,
  },
});
