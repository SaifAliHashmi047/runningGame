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
  laser: { top: 8, bottom: 8, left: 12, right: 12 },
  mine: { top: 14, bottom: 14, left: 14, right: 14 },
  drone: { top: 10, bottom: 10, left: 16, right: 16 },
  crystal: { top: 18, bottom: 8, left: 10, right: 10 },
};

/** Smaller core for the ship — reduces false positives vs obstacle collision insets. */
export const PLAYER_HITBOX_INSETS: ObstacleHitboxInsets = {
  top: 6,
  bottom: 10,
  left: 8,
  right: 8,
};

export const MIN_COLLISION_DIMENSION_PX = 4;

/** Set `true` while tuning to draw collision (green) and optional visual (cyan) bounds. */
export const DEBUG_DRAW_COLLISION_BOXES = false;
export const DEBUG_DRAW_VISUAL_BOUNDS = false;
