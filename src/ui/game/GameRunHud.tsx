import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fontPixel, heightPixel } from "../../../utils/responsive";

export type GameRunHudProps = {
  score: number;
  distanceFloor: number;
};

function GameRunHudInner({ score, distanceFloor }: GameRunHudProps) {
  return (
    <View style={styles.runHud} pointerEvents="none">
      <Text style={styles.runHudScore}>{score.toLocaleString()}</Text>
      <Text style={styles.runHudDistance}>{distanceFloor.toLocaleString()} m</Text>
    </View>
  );
}

export default memo(GameRunHudInner);

const styles = StyleSheet.create({
  runHud: {
    position: "absolute",
    top: heightPixel(8),
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  runHudScore: {
    fontSize: fontPixel(26),
    fontWeight: "800",
    color: "#f8fafc",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  runHudDistance: {
    marginTop: 2,
    fontSize: fontPixel(13),
    fontWeight: "600",
    color: "rgba(226,232,240,0.82)",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
