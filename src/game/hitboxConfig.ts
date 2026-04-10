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

/**
 * Ship collision vs obstacles — insets shrink the **layout** rect (same as the hero
 * `width`/`height` passed to `HeroHoverShip`). Use 0 so the hit square wraps the full PNG/SVG.
 * Collision is the smallest **square containing** that rect (centered), so the art stays inside it.
 */
export const PLAYER_HITBOX_INSETS: ObstacleHitboxInsets = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

export const MIN_COLLISION_DIMENSION_PX = 4;

/** Hitbox outlines only in dev builds (`__DEV__`); release builds ship with overlays off. */
const DEBUG_HITBOX_OVERLAY =
  typeof __DEV__ !== "undefined" && __DEV__;

/** Pink outline for the hero collision square. */
export const DEBUG_DRAW_PLAYER_HITBOX = DEBUG_HITBOX_OVERLAY;

/**
 * Draw each obstacle’s **collision** AABB (same rects as `collides()` / `obstacleCollisionRect`).
 * Uses playfield coords — stays aligned with `HitboxDebugOverlay`’s `screenHeight` prop.
 */
export const DEBUG_DRAW_OBSTACLE_HITBOX = DEBUG_HITBOX_OVERLAY;

/** Legacy: obstacle collision (green) — prefer `DEBUG_DRAW_OBSTACLE_HITBOX` (sky blue). */
export const DEBUG_DRAW_COLLISION_BOXES = false;
export const DEBUG_DRAW_VISUAL_BOUNDS = false;
