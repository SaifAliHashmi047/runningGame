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
  /** ~82–88% of visual bounds — forgiving vs art padding. */
  laser: { top: 10, bottom: 10, left: 15, right: 15 },
  mine: { top: 17, bottom: 17, left: 17, right: 17 },
  drone: { top: 13, bottom: 13, left: 19, right: 19 },
  crystal: { top: 22, bottom: 11, left: 13, right: 13 },
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
