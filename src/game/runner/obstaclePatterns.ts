import type { ObstacleSpawnType } from "../difficulty/difficultyConfig";
import type { ObstacleVisual } from "../types";
import type { ObstaclePatternId } from "./runnerConfig";

const VISUALS: ObstacleVisual[] = ["laser", "mine", "drone", "crystal"];

export type ObstacleSpawnSpec = {
  lane: number;
  /** Extra Y subtract (more negative = higher on screen when spawned). */
  yExtra: number;
  type: ObstacleSpawnType;
  visual: ObstacleVisual;
};

function rv(rng: () => number): ObstacleVisual {
  return VISUALS[Math.floor(rng() * VISUALS.length)];
}

function rt(rng: () => number, phase: number): ObstacleSpawnType {
  const roll = rng();
  if (phase <= 0) return roll < 0.72 ? "block" : roll < 0.9 ? "wide" : "zigzag";
  if (phase === 1) {
    if (roll < 0.28) return "fast";
    if (roll < 0.52) return "block";
    if (roll < 0.78) return "wide";
    return "zigzag";
  }
  if (phase === 2) {
    if (roll < 0.34) return "fast";
    if (roll < 0.52) return "zigzag";
    if (roll < 0.76) return "wide";
    return "block";
  }
  if (roll < 0.4) return "fast";
  if (roll < 0.65) return "zigzag";
  if (roll < 0.85) return "wide";
  return "block";
}

const PATTERN_WEIGHTS: Record<number, { id: ObstaclePatternId; w: number }[]> = {
  0: [
    { id: "singleBlock", w: 50 },
    { id: "centerBlock", w: 22 },
    { id: "lowBarrierThenCoinTrail", w: 18 },
    { id: "jumpThenSwitch", w: 10 },
  ],
  1: [
    { id: "singleBlock", w: 22 },
    { id: "leftRightGap", w: 20 },
    { id: "centerBlock", w: 14 },
    { id: "doubleLaneBlock", w: 18 },
    { id: "jumpThenSwitch", w: 14 },
    { id: "lowBarrierThenCoinTrail", w: 12 },
  ],
  2: [
    { id: "leftRightGap", w: 18 },
    { id: "doubleLaneBlock", w: 22 },
    { id: "jumpThenSwitch", w: 16 },
    { id: "dangerZoneWithSafeLane", w: 20 },
    { id: "singleBlock", w: 12 },
    { id: "lowBarrierThenCoinTrail", w: 12 },
  ],
  3: [
    { id: "dangerZoneWithSafeLane", w: 28 },
    { id: "doubleLaneBlock", w: 24 },
    { id: "leftRightGap", w: 16 },
    { id: "jumpThenSwitch", w: 14 },
    { id: "lowBarrierThenCoinTrail", w: 10 },
    { id: "singleBlock", w: 8 },
  ],
};

export function pickObstaclePattern(phaseIndex: number, rng: () => number): ObstaclePatternId {
  const table = PATTERN_WEIGHTS[Math.min(3, Math.max(0, phaseIndex))];
  const sum = table.reduce((s, e) => s + e.w, 0);
  let t = rng() * sum;
  for (const row of table) {
    t -= row.w;
    if (t <= 0) return row.id;
  }
  return "singleBlock";
}

/**
 * Each spec is one obstacle. Patterns always leave ≥1 lane clear at the primary row (fairness).
 */
export function materializeObstaclePattern(
  id: ObstaclePatternId,
  phaseIndex: number,
  rng: () => number
): ObstacleSpawnSpec[] {
  const ph = Math.min(3, phaseIndex);
  const r = rng();

  switch (id) {
    case "singleBlock": {
      const lane = Math.floor(rng() * 3);
      return [{ lane, yExtra: 0, type: rt(rng, ph), visual: rv(rng) }];
    }
    case "centerBlock":
      return [{ lane: 1, yExtra: 0, type: rt(rng, ph), visual: rv(rng) }];
    case "leftRightGap": {
      return [
        { lane: 0, yExtra: 0, type: ph >= 2 ? "fast" : "block", visual: rv(rng) },
        { lane: 2, yExtra: -34 - ph * 8, type: rt(rng, ph), visual: rv(rng) },
      ];
    }
    case "doubleLaneBlock": {
      const safe = Math.floor(rng() * 3);
      const blocked = [0, 1, 2].filter((l) => l !== safe);
      return [
        { lane: blocked[0], yExtra: 0, type: rt(rng, ph), visual: rv(rng) },
        { lane: blocked[1], yExtra: -40 - ph * 10, type: rt(rng, ph), visual: rv(rng) },
      ];
    }
    case "jumpThenSwitch": {
      const a = Math.floor(rng() * 3);
      const r = rng();
      const b = (a + (r < 0.5 ? 1 : 2)) % 3;
      return [
        { lane: a, yExtra: 0, type: "wide", visual: rv(rng) },
        { lane: b, yExtra: -52 - ph * 12, type: ph >= 1 ? "fast" : "block", visual: rv(rng) },
      ];
    }
    case "lowBarrierThenCoinTrail": {
      const lane = Math.floor(rng() * 3);
      return [{ lane, yExtra: 0, type: "block", visual: rv(rng) }];
    }
    case "dangerZoneWithSafeLane": {
      const safe = Math.floor(rng() * 3);
      const o = [0, 1, 2].filter((l) => l !== safe);
      return [
        { lane: o[0], yExtra: 0, type: "fast", visual: rv(rng) },
        { lane: o[1], yExtra: -36 - ph * 10, type: "zigzag", visual: rv(rng) },
      ];
    }
    default:
      return [{ lane: 1, yExtra: 0, type: "block", visual: rv(rng) }];
  }
}
