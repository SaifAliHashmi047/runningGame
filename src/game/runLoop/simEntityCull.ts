import { ENTITY_CULL_BELOW_SCREEN_PAD, ENTITY_VIEWPORT_X_PAD } from "./fillRenderVisible";

/**
 * Compact sim arrays: drop entities fully past the bottom fold, and drop lateral stragglers
 * that have fallen past the lane playfield (cannot collide or be collected).
 * Keeps work per frame proportional to on-screen / near-screen entities only.
 */

/** Obstacle top below standing feet + margin — cannot overlap the player AABB. */
function horizontalCullMinYTop(screenHeight: number, groundHeight: number): number {
  return screenHeight - groundHeight + 24;
}

export function compactObstaclesOffScreen<T extends { x: number; y: number; visW: number; visH: number }>(
  obstacles: T[],
  release: (o: T) => void,
  screenW: number,
  screenH: number,
  groundHeight: number
): void {
  const pad = ENTITY_CULL_BELOW_SCREEN_PAD;
  const belowFoldBottom = screenH + pad;
  const bl = -ENTITY_VIEWPORT_X_PAD;
  const br = screenW + ENTITY_VIEWPORT_X_PAD;
  const yTopPastFeet = horizontalCullMinYTop(screenH, groundHeight);
  let w = 0;
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.y + o.visH > belowFoldBottom) {
      release(o);
      continue;
    }
    if (o.y > yTopPastFeet && (o.x + o.visW < bl || o.x > br)) {
      release(o);
      continue;
    }
    if (w !== i) obstacles[w] = o;
    w++;
  }
  obstacles.length = w;
}

export function compactCoinsOffScreen<T extends { x: number; y: number; size: number }>(
  coins: T[],
  release: (c: T) => void,
  screenW: number,
  screenH: number,
  groundHeight: number
): void {
  const pad = ENTITY_CULL_BELOW_SCREEN_PAD;
  const belowFoldBottom = screenH + pad;
  const bl = -ENTITY_VIEWPORT_X_PAD;
  const br = screenW + ENTITY_VIEWPORT_X_PAD;
  const yTopPastFeet = horizontalCullMinYTop(screenH, groundHeight);
  let w = 0;
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    if (c.y + c.size > belowFoldBottom) {
      release(c);
      continue;
    }
    if (c.y > yTopPastFeet && (c.x + c.size < bl || c.x > br)) {
      release(c);
      continue;
    }
    if (w !== i) coins[w] = c;
    w++;
  }
  coins.length = w;
}

export function compactPowerUpsOffScreen<T extends { x: number; y: number; size: number }>(
  powerUps: T[],
  release: (p: T) => void,
  screenW: number,
  screenH: number,
  groundHeight: number
): void {
  const pad = ENTITY_CULL_BELOW_SCREEN_PAD;
  const belowFoldBottom = screenH + pad;
  const bl = -ENTITY_VIEWPORT_X_PAD;
  const br = screenW + ENTITY_VIEWPORT_X_PAD;
  const yTopPastFeet = horizontalCullMinYTop(screenH, groundHeight);
  let w = 0;
  for (let i = 0; i < powerUps.length; i++) {
    const p = powerUps[i];
    if (p.y + p.size > belowFoldBottom) {
      release(p);
      continue;
    }
    if (p.y > yTopPastFeet && (p.x + p.size < bl || p.x > br)) {
      release(p);
      continue;
    }
    if (w !== i) powerUps[w] = p;
    w++;
  }
  powerUps.length = w;
}
