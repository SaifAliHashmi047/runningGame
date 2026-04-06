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

/** Per-visual collision insets (pixels) — lower = larger hitbox vs art. */
export const OBSTACLE_HITBOX_INSETS: Record<ObstacleVisual, ObstacleHitboxInsets> = {
  rock: { top: 5, bottom: 5, left: 4, right: 4 },
  fireball: { top: 5, bottom: 4, left: 5, right: 5 },
  roundBomb: { top: 5, bottom: 5, left: 5, right: 5 },
  aeroBomb: { top: 4, bottom: 5, left: 6, right: 6 },
};

/** Ship collision vs obstacles — lower values = larger (more forgiving) hitbox. */
export const PLAYER_HITBOX_INSETS: ObstacleHitboxInsets = {
  top: 4,
  bottom: 6,
  left: 5,
  right: 5,
};

export const MIN_COLLISION_DIMENSION_PX = 4;

/** Set `true` while tuning to draw collision (green) and optional visual (cyan) bounds. */
export const DEBUG_DRAW_COLLISION_BOXES = false;
export const DEBUG_DRAW_VISUAL_BOUNDS = false;
