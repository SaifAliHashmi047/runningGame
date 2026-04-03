import type { ObstacleVisual } from "./types";
import { obstacleHitSize } from "./hitboxes";

export type MinimalObstacle = {
  x: number;
  y: number;
  size: number;
  type: "block" | "fast" | "wide" | "zigzag";
  visual: ObstacleVisual;
};

/**
 * Vertical screen band culling: skip obstacles that cannot overlap the player column this frame.
 * `playerScreenTop` / `playerScreenBottom` are same convention as App (`collides`): top < bottom.
 */
export function obstacleBottomScreen(ob: MinimalObstacle): number {
  const { h } = obstacleHitSize(ob.visual, ob.size, ob.type === "wide");
  return ob.y + h;
}

/** Margin expands the player band so fast fallers still get checked. */
export function forEachObstacleInVerticalBand<T extends MinimalObstacle>(
  obstacles: readonly T[],
  playerScreenTop: number,
  playerScreenBottom: number,
  marginY: number,
  fn: (ob: T) => void
): void {
  const bandTop = playerScreenTop - marginY;
  const bandBottom = playerScreenBottom + marginY;
  for (let i = 0; i < obstacles.length; i++) {
    const ob = obstacles[i];
    const bottom = obstacleBottomScreen(ob);
    if (bottom < bandTop || ob.y > bandBottom) continue;
    fn(ob);
  }
}
