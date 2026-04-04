import type { ObstacleVisual } from "./types";

/**
 * Global scale for obstacle render + collision base box (layout size for textures / previews).
 * Insets in `OBSTACLE_HITBOX_INSETS` are multiplied by this in `obstacleCollisionRect`.
 */
/** Global scale vs spawn `size` — ~0.9 reads as “medium” next to the hero. */
export const OBSTACLE_VISUAL_SCALE = 0.9;

/**
 * Tune collision fairness here. Insets shrink the collision AABB **inward** from the visual/render box.
 * Naming matches PNG art in `src/assets/obstacles/`.
 */
export type ObstacleHitboxInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Per-visual collision insets (pixels) applied after `obstacleVisualSize` is computed. */
export const OBSTACLE_HITBOX_INSETS: Record<ObstacleVisual, ObstacleHitboxInsets> = {
  rock: { top: 10, bottom: 10, left: 8, right: 8 },
  fireball: { top: 10, bottom: 8, left: 10, right: 10 },
  roundBomb: { top: 10, bottom: 10, left: 10, right: 10 },
  aeroBomb: { top: 8, bottom: 10, left: 12, right: 12 },
};

/** Smaller core for the ship — reduces false positives vs obstacle collision insets. */
export const PLAYER_HITBOX_INSETS: ObstacleHitboxInsets = {
  top: 8,
  bottom: 12,
  left: 10,
  right: 10,
};

export const MIN_COLLISION_DIMENSION_PX = 4;

/** Set `true` while tuning to draw collision (green) and optional visual (cyan) bounds. */
export const DEBUG_DRAW_COLLISION_BOXES = false;
export const DEBUG_DRAW_VISUAL_BOUNDS = false;
