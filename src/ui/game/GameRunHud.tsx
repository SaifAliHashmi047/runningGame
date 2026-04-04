import React, { memo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";

export type GameRunHudProps = {
  score: number;
  distanceFloor: number;
  gameOver?: boolean;
  shopOpen?: boolean;
  runPaused?: boolean;
  onToggleRunPause?: () => void;
  onOpenShop?: () => void;
  onExitToHome?: () => void;
};

function GameRunHudInner({
  score,
  distanceFloor,
  gameOver = false,
  shopOpen = false,
  runPaused = false,
  onToggleRunPause,
  onOpenShop,
  onExitToHome,
}: GameRunHudProps) {
  const showRunPauseControls = !gameOver && !shopOpen && onToggleRunPause;
  const pauseLabel = runPaused ? "Resume" : "Pause";

  return (
    <View style={styles.runHud} pointerEvents="box-none">
      <View pointerEvents="none" style={styles.runHudCenter}>
        <Text style={styles.runHudScore}>{score.toLocaleString()}</Text>
        <Text style={styles.runHudDistance}>{distanceFloor.toLocaleString()} m</Text>
      </View>
      {showRunPauseControls ? (
        runPaused && onExitToHome ? (
          <View style={styles.leftBtnCol} pointerEvents="box-none">
            <Pressable
              style={({ pressed }) => [
                styles.hudSideBtn,
                styles.hudSideBtnInCol,
                {
                  backgroundColor: "rgba(34,197,94,0.35)",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={onToggleRunPause}
              hitSlop={8}
            >
              <Text style={styles.hudSideBtnText}>{pauseLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.hudSideBtn,
                styles.hudSideBtnInCol,
                {
                  backgroundColor: "rgba(30,41,59,0.88)",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={onExitToHome}
              hitSlop={8}
            >
              <Text style={styles.hudSideBtnText}>Home</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.hudSideBtn,
              styles.hudSideLeft,
              {
                backgroundColor: runPaused ? "rgba(34,197,94,0.35)" : "rgba(15,23,42,0.72)",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={onToggleRunPause}
            hitSlop={8}
          >
            <Text style={styles.hudSideBtnText}>{pauseLabel}</Text>
          </Pressable>
        )
      ) : null}
      {onOpenShop ? (
        <Pressable
          style={({ pressed }) => [styles.hudSideBtn, styles.hudSideRight, { opacity: pressed ? 0.85 : 1 }]}
          onPress={onOpenShop}
          hitSlop={8}
        >
          <Text style={styles.hudSideBtnText}>Skins</Text>
        </Pressable>
      ) : null}
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
  runHudCenter: {
    alignItems: "center",
  },
  hudSideBtn: {
    position: "absolute",
    top: 0,
    paddingVertical: heightPixel(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(56,189,248,0.45)",
  },
  hudSideLeft: {
    left: scale(10),
  },
  leftBtnCol: {
    position: "absolute",
    top: 0,
    left: scale(10),
    flexDirection: "column",
    gap: heightPixel(6),
    alignItems: "stretch",
  },
  hudSideBtnInCol: {
    position: "relative",
  },
  hudSideRight: {
    right: scale(10),
    backgroundColor: "rgba(15,23,42,0.72)",
  },
  hudSideBtnText: {
    color: "#e0f2fe",
    fontWeight: "800",
    fontSize: fontPixel(12),
    letterSpacing: 0.4,
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
