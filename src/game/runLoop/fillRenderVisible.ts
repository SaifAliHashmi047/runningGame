import { obstacleHitSize } from "../hitboxes";
import type { ObstacleVisual } from "../types";

type ObstacleLike = {
  x: number;
  y: number;
  size: number;
  type: "block" | "fast" | "wide" | "zigzag";
  visual: ObstacleVisual;
  visW?: number;
};

type CoinLike = { x: number; y: number; size: number };
type PowerLike = { x: number; y: number; size: number };

/** Exported for sim removal — keep in sync with render cull. */
export const ENTITY_CULL_ABOVE = -200;
export const ENTITY_CULL_BELOW_SCREEN_PAD = 72;
const CULL_ABOVE = ENTITY_CULL_ABOVE;
const CULL_BELOW_PAD = ENTITY_CULL_BELOW_SCREEN_PAD;
/** Horizontal slack for wide art, zigzag drift, and safe overlap with the viewport (not player band). */
const VIEWPORT_X_PAD = 96;

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
  const bandLeft = -VIEWPORT_X_PAD;
  const bandRight = screenWidth + VIEWPORT_X_PAD;
  let obsN = 0;
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.y < CULL_ABOVE || o.y > screenHeight + CULL_BELOW_PAD) continue;
    const w = o.visW ?? obstacleHitSize(o.visual, o.size, o.type === "wide").w;
    if (o.x + w < bandLeft || o.x > bandRight) continue;
    outObs[obsN++] = o;
  }
  let coinN = 0;
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    if (c.y < CULL_ABOVE || c.y > screenHeight + CULL_BELOW_PAD) continue;
    const cr = c.x + c.size;
    if (cr < bandLeft || c.x > bandRight) continue;
    outCoins[coinN++] = c;
  }
  let powN = 0;
  for (let i = 0; i < powerUps.length; i++) {
    const p = powerUps[i];
    if (p.y < CULL_ABOVE || p.y > screenHeight + CULL_BELOW_PAD) continue;
    const pr = p.x + p.size;
    if (pr < bandLeft || p.x > bandRight) continue;
    outPow[powN++] = p;
  }
  return { obsN, coinN, powN };
}
