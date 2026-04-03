import type { ObstacleVisual } from "./types";
import {
  DEBUG_DRAW_COLLISION_BOXES,
  DEBUG_DRAW_VISUAL_BOUNDS,
  MIN_COLLISION_DIMENSION_PX,
  OBSTACLE_HITBOX_INSETS,
  OBSTACLE_VISUAL_SCALE,
  PLAYER_HITBOX_INSETS,
  type ObstacleHitboxInsets,
} from "./hitboxConfig";

export type { ObstacleHitboxInsets };

/** Re-export debug flags for UI overlays. */
export { DEBUG_DRAW_COLLISION_BOXES, DEBUG_DRAW_VISUAL_BOUNDS };

export type ObstacleSpawnTypeForHitbox = "block" | "fast" | "wide" | "zigzag";

export type ObstacleHitboxInput = {
  x: number;
  y: number;
  size: number;
  type: ObstacleSpawnTypeForHitbox;
  visual: ObstacleVisual;
};

/**
 * Render / layout size (what `GameObstacle` receives). SVGs sit inside this box; transparent
 * padding in art is why collision uses tighter `obstacleCollisionRect`.
 */
export function obstacleVisualSize(visual: ObstacleVisual, size: number, typeWide: boolean): { w: number; h: number } {
  const wide = typeWide ? 1.45 : 1;
  const s = OBSTACLE_VISUAL_SCALE;
  let w: number;
  let h: number;
  switch (visual) {
    case "laser":
      w = size * wide;
      h = Math.max(26, size * 0.36);
      break;
    case "mine":
      w = size * 0.92 * wide;
      h = size * 0.95;
      break;
    case "drone":
      w = size * wide;
      h = Math.max(34, size * 0.65);
      break;
    case "crystal":
      w = size * 0.9 * wide;
      h = size * 1.18;
      break;
    default:
      w = size * wide;
      h = size;
  }
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

/** @deprecated Use `obstacleVisualSize` — same function, clearer name. */
export const obstacleHitSize = obstacleVisualSize;

/**
 * Tight collision AABB in screen space (same origin as `obs.x` / `obs.y` as used for rendering).
 */
export function obstacleCollisionRect(obs: ObstacleHitboxInput): { x: number; y: number; w: number; h: number } {
  const { w: vw, h: vh } = obstacleVisualSize(obs.visual, obs.size, obs.type === "wide");
  const ins = OBSTACLE_HITBOX_INSETS[obs.visual];
  const sc = OBSTACLE_VISUAL_SCALE;
  const il = Math.round(ins.left * sc);
  const ir = Math.round(ins.right * sc);
  const it = Math.round(ins.top * sc);
  const ib = Math.round(ins.bottom * sc);
  const w = Math.max(MIN_COLLISION_DIMENSION_PX, vw - il - ir);
  const h = Math.max(MIN_COLLISION_DIMENSION_PX, vh - it - ib);
  return {
    x: obs.x + il,
    y: obs.y + it,
    w,
    h,
  };
}

export function obstacleCollisionAabb(obs: ObstacleHitboxInput): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const r = obstacleCollisionRect(obs);
  return {
    left: r.x,
    right: r.x + r.w,
    top: r.y,
    bottom: r.y + r.h,
  };
}

export function obstacleVisualAabb(obs: ObstacleHitboxInput): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const { w, h } = obstacleVisualSize(obs.visual, obs.size, obs.type === "wide");
  return {
    left: obs.x,
    right: obs.x + w,
    top: obs.y,
    bottom: obs.y + h,
  };
}

/**
 * Player collision in screen coordinates (matches `collides` in App: y increases downward).
 */
export function playerCollisionAabb(input: {
  playerX: number;
  playerY: number;
  playerWidth: number;
  playerHeight: number;
  screenHeight: number;
  groundHeight: number;
  inset?: ObstacleHitboxInsets;
}): { left: number; right: number; top: number; bottom: number } {
  const pi = input.inset ?? PLAYER_HITBOX_INSETS;
  const { playerX, playerY, playerWidth, playerHeight, screenHeight, groundHeight } = input;

  const left = playerX + pi.left;
  const right = playerX + playerWidth - pi.right;
  const top = screenHeight - (groundHeight + playerY + playerHeight) + pi.top;
  const bottom = screenHeight - (groundHeight + playerY) - pi.bottom;

  if (right <= left || bottom <= top) {
    const cx = (playerX + playerWidth / 2) | 0;
    const cy = (top + bottom) / 2;
    return {
      left: cx - MIN_COLLISION_DIMENSION_PX / 2,
      right: cx + MIN_COLLISION_DIMENSION_PX / 2,
      top: cy - MIN_COLLISION_DIMENSION_PX / 2,
      bottom: cy + MIN_COLLISION_DIMENSION_PX / 2,
    };
  }

  return { left, right, top, bottom };
}

export function aabbOverlap(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number }
): boolean {
  const h = a.left < b.right && a.right > b.left;
  const v = a.top < b.bottom && a.bottom > b.top;
  return h && v;
}
