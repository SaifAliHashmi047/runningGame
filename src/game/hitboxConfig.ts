/**
 * Global scale for obstacle render + collision base box (SVG layout size passed to `GameObstacle`).
 * Insets in `OBSTACLE_HITBOX_INSETS` are multiplied by this in `obstacleCollisionRect`.
 */
export const OBSTACLE_VISUAL_SCALE = 0.84;

/**
 * Tune collision fairness here. Insets shrink the collision AABB **inward** from the visual/render box.
 * Naming matches art: laser gate, hover mine, drone barrier, crystal spikes.
 */
export type ObstacleHitboxInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Per-visual collision insets (pixels) applied after `obstacleVisualSize` is computed. */
export const OBSTACLE_HITBOX_INSETS: Record<
  "laser" | "mine" | "drone" | "crystal",
  ObstacleHitboxInsets
> = {
  /** Tighter than visual — less “invisible” contact around SVG padding. */
  laser: { top: 15, bottom: 15, left: 22, right: 22 },
  mine: { top: 26, bottom: 26, left: 26, right: 26 },
  drone: { top: 19, bottom: 19, left: 28, right: 28 },
  crystal: { top: 30, bottom: 17, left: 20, right: 20 },
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
