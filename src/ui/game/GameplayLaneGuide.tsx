import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { heightPixel, scale } from "../../../utils/responsive";

type Props = {
  screenW: number;
  screenH: number;
  groundH: number;
};

/**
 * Light holographic lane cues only — no vertical beams or dark columns.
 */
function GameplayLaneGuideInner({ screenW, screenH, groundH }: Props) {
  const midW = Math.round(screenW * 0.72);
  const midLeft = Math.round((screenW - midW) / 2);
  void groundH;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {/* Soft center volume — fades at edges, not a column */}
      <LinearGradient
        colors={["rgba(0,229,255,0.07)", "rgba(0,229,255,0.02)", "transparent"]}
        locations={[0, 0.35, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.softCorridor,
          {
            left: midLeft,
            width: midW,
            top: heightPixel(56),
            height: Math.max(0, screenH - groundH - heightPixel(72)),
            borderRadius: scale(28),
          },
        ]}
      />

      {/* Sparse horizontal guide ticks — short segments, not full-width rails */}
      <LinearGradient
        colors={["transparent", "rgba(125,211,252,0.14)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.holoTick, { top: screenH * 0.22, left: "18%", right: "18%", height: StyleSheet.hairlineWidth }]}
      />
      <LinearGradient
        colors={["transparent", "rgba(167,139,250,0.10)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.holoTick, { top: screenH * 0.38, left: "22%", right: "22%", height: StyleSheet.hairlineWidth }]}
      />
    </View>
  );
}

export default memo(GameplayLaneGuideInner);

const styles = StyleSheet.create({
  softCorridor: {
    position: "absolute",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(56,189,248,0.10)",
  },
  holoTick: {
    position: "absolute",
  },
});
