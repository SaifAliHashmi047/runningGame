export type ObstacleLaneSpawnType = "block" | "fast" | "wide" | "zigzag";

/**
 * Minimal fields for vertical band culling + lane filter.
 * `visH` — bottom of render/visual bounds (band must cover near-miss which uses visual AABB).
 */
export type MinimalObstacle = {
  x: number;
  y: number;
  lane: number;
  type: ObstacleLaneSpawnType;
  visH: number;
};

/**
 * Bottom edge of obstacle visual box (for vertical broadphase — includes near-miss range).
 */
export function obstacleBottomScreen(ob: MinimalObstacle): number {
  return ob.y + ob.visH;
}

/** Margin expands the player band so fast fallers still get checked. */
/** Lane-based culling — combined with X broadphase preserves outcomes for this lane layout. */
export function obstacleLaneRelevantForPlayer(
  obstacleLane: number,
  type: ObstacleLaneSpawnType,
  playerLane: number
): boolean {
  if (type === "wide" || type === "zigzag") {
    return Math.abs(obstacleLane - playerLane) <= 1;
  }
  return obstacleLane === playerLane;
}

export function forEachObstacleInVerticalBand<T extends MinimalObstacle>(
  obstacles: readonly T[],
  playerScreenTop: number,
  playerScreenBottom: number,
  marginY: number,
  fn: (ob: T) => void,
  preFilter?: (ob: T) => boolean
): void {
  const bandTop = playerScreenTop - marginY;
  const bandBottom = playerScreenBottom + marginY;
  for (let i = 0; i < obstacles.length; i++) {
    const ob = obstacles[i];
    if (preFilter && !preFilter(ob)) continue;
    const bottom = obstacleBottomScreen(ob);
    if (bottom < bandTop || ob.y > bandBottom) continue;
    fn(ob);
  }
}
