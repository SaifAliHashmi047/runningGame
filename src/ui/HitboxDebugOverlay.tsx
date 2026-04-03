import React from "react";
import { View, StyleSheet } from "react-native";
import type { ObstacleVisual } from "../game/types";
import {
  DEBUG_DRAW_COLLISION_BOXES,
  DEBUG_DRAW_VISUAL_BOUNDS,
  obstacleCollisionRect,
  obstacleVisualSize,
  playerCollisionAabb,
} from "../game/hitboxes";

export type HitboxDebugObstacle = {
  id: number;
  x: number;
  y: number;
  size: number;
  type: "block" | "fast" | "wide" | "zigzag";
  visual: ObstacleVisual;
};

type Props = {
  screenHeight: number;
  groundHeight: number;
  playerX: number;
  playerY: number;
  playerWidth: number;
  playerHeight: number;
  obstacles: readonly HitboxDebugObstacle[];
};

/**
 * Draws collision AABB (green) and optional visual bounds (cyan) for tuning `hitboxConfig`.
 * Toggle `DEBUG_DRAW_COLLISION_BOXES` / `DEBUG_DRAW_VISUAL_BOUNDS` in `src/game/hitboxConfig.ts`.
 */
export default function HitboxDebugOverlay({
  screenHeight,
  groundHeight,
  playerX,
  playerY,
  playerWidth,
  playerHeight,
  obstacles,
}: Props) {
  if (!DEBUG_DRAW_COLLISION_BOXES && !DEBUG_DRAW_VISUAL_BOUNDS) return null;

  const p = playerCollisionAabb({
    playerX,
    playerY,
    playerWidth,
    playerHeight,
    screenHeight,
    groundHeight,
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View
        style={[
          styles.debugRect,
          {
            left: p.left,
            top: p.top,
            width: Math.max(1, p.right - p.left),
            height: Math.max(1, p.bottom - p.top),
            borderColor: "rgba(248,113,113,0.95)",
          },
        ]}
      />

      {DEBUG_DRAW_VISUAL_BOUNDS &&
        obstacles.map((obs) => {
          const { w, h } = obstacleVisualSize(obs.visual, obs.size, obs.type === "wide");
          return (
            <View
              key={`v-${obs.id}`}
              style={[
                styles.debugRect,
                styles.visualRect,
                {
                  left: obs.x,
                  top: obs.y,
                  width: w,
                  height: h,
                },
              ]}
            />
          );
        })}

      {DEBUG_DRAW_COLLISION_BOXES &&
        obstacles.map((obs) => {
          const r = obstacleCollisionRect(obs);
          return (
            <View
              key={`c-${obs.id}`}
              style={[
                styles.debugRect,
                {
                  left: r.x,
                  top: r.y,
                  width: r.w,
                  height: r.h,
                  borderColor: "rgba(74,222,128,0.95)",
                },
              ]}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  debugRect: {
    position: "absolute",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  visualRect: {
    borderColor: "rgba(34,211,238,0.85)",
    borderWidth: 1,
  },
});
