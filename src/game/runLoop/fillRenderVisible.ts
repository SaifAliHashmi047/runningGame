import { obstacleHitSize } from "../hitboxes";
import type { ObstacleVisual } from "../types";

type ObstacleLike = {
  x: number;
  y: number;
  size: number;
  type: "block" | "fast" | "wide" | "zigzag";
  visual: ObstacleVisual;
  visW?: number;
  visH?: number;
};

type CoinLike = { x: number; y: number; size: number };
type PowerLike = { x: number; y: number; size: number };

/** Exported for sim removal — keep in sync with render cull. */
export const ENTITY_CULL_ABOVE = -200;
export const ENTITY_CULL_BELOW_SCREEN_PAD = 72;
const CULL_ABOVE = ENTITY_CULL_ABOVE;
const CULL_BELOW_PAD = ENTITY_CULL_BELOW_SCREEN_PAD;
/** Horizontal slack for wide art, zigzag drift, and safe overlap with the viewport (not player band). */
export const ENTITY_VIEWPORT_X_PAD = 96;

/** Same AABB test as render culling — used to cap simultaneous hazards in the play frustum. */
export function obstacleOverlapsPlayViewport(
  screenWidth: number,
  screenHeight: number,
  o: ObstacleLike
): boolean {
  const hit = obstacleHitSize(o.visual, o.size, o.type === "wide");
  const w = o.visW ?? hit.w;
  const h = o.visH ?? hit.h;
  const belowY = screenHeight + CULL_BELOW_PAD;
  const bandLeft = -ENTITY_VIEWPORT_X_PAD;
  const bandRight = screenWidth + ENTITY_VIEWPORT_X_PAD;
  if (o.y + h < CULL_ABOVE || o.y > belowY) return false;
  if (o.x + w < bandLeft || o.x > bandRight) return false;
  return true;
}

export function countObstaclesInPlayViewport(
  screenWidth: number,
  screenHeight: number,
  obstacles: readonly ObstacleLike[]
): number {
  let c = 0;
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacleOverlapsPlayViewport(screenWidth, screenHeight, obstacles[i])) c++;
  }
  return c;
}

/**
 * Fills parallel arrays with entities likely visible on screen.
 * Horizontal cull uses the full viewport ± pad — not the player AABB (lane-side props must stay visible).
 */
export function fillRenderVisible(
  screenWidth: number,
  screenHeight: number,
  obstacles: readonly ObstacleLike[],
  coins: readonly CoinLike[],
  powerUps: readonly PowerLike[],
  outObs: ObstacleLike[],
  outCoins: CoinLike[],
  outPow: PowerLike[]
): { obsN: number; coinN: number; powN: number } {
  const bandLeft = -ENTITY_VIEWPORT_X_PAD;
  const bandRight = screenWidth + ENTITY_VIEWPORT_X_PAD;
  const belowY = screenHeight + CULL_BELOW_PAD;
  let obsN = 0;
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (!obstacleOverlapsPlayViewport(screenWidth, screenHeight, o)) continue;
    outObs[obsN++] = o;
  }
  let coinN = 0;
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    if (c.y + c.size < CULL_ABOVE || c.y > belowY) continue;
    const cr = c.x + c.size;
    if (cr < bandLeft || c.x > bandRight) continue;
    outCoins[coinN++] = c;
  }
  let powN = 0;
  for (let i = 0; i < powerUps.length; i++) {
    const p = powerUps[i];
    if (p.y + p.size < CULL_ABOVE || p.y > belowY) continue;
    const pr = p.x + p.size;
    if (pr < bandLeft || p.x > bandRight) continue;
    outPow[powN++] = p;
  }
  return { obsN, coinN, powN };
}
