import type { CoinPatternKind } from "./runnerConfig";
import { RUNNER_LANE_COUNT, RUNNER_LANE_MARGIN } from "./runnerConfig";
import { computeLaneGeometry } from "./lanes";

export type CoinSpawn = { x: number; y: number; size: number };

const PICK_WEIGHTS: Record<number, { kind: CoinPatternKind; w: number }[]> = {
  0: [
    { kind: "straight", w: 55 },
    { kind: "arc", w: 25 },
    { kind: "zigzag", w: 12 },
    { kind: "laneSwitchTrail", w: 8 },
  ],
  1: [
    { kind: "straight", w: 22 },
    { kind: "arc", w: 28 },
    { kind: "zigzag", w: 22 },
    { kind: "laneSwitchTrail", w: 16 },
    { kind: "riskTrail", w: 12 },
  ],
  2: [
    { kind: "zigzag", w: 26 },
    { kind: "arc", w: 22 },
    { kind: "laneSwitchTrail", w: 22 },
    { kind: "riskTrail", w: 20 },
    { kind: "straight", w: 10 },
  ],
  3: [
    { kind: "riskTrail", w: 32 },
    { kind: "laneSwitchTrail", w: 28 },
    { kind: "zigzag", w: 22 },
    { kind: "arc", w: 12 },
    { kind: "straight", w: 6 },
  ],
};

export function pickCoinPattern(phaseIndex: number, rng: () => number): CoinPatternKind {
  const table = PICK_WEIGHTS[Math.min(3, Math.max(0, phaseIndex))];
  const sum = table.reduce((s, e) => s + e.w, 0);
  let t = rng() * sum;
  for (const row of table) {
    t -= row.w;
    if (t <= 0) return row.kind;
  }
  return "straight";
}

/**
 * Build a short coin string above the player field. `coinSpacing` already scales with speed.
 */
export function materializeCoinPattern(params: {
  kind: CoinPatternKind;
  phaseIndex: number;
  screenW: number;
  coinSize: number;
  playerW: number;
  coinSpacing: number;
  /** Lane to bias “safe” rewards toward (player lane). */
  preferredLane: number;
  /** For riskTrail: lane with recent hazard. */
  hazardLane?: number;
  /** Match obstacle/lane grid (e.g. `scale(RUNNER_LANE_MARGIN)` from UI). */
  laneMargin?: number;
  rng: () => number;
}): CoinSpawn[] {
  const { kind, phaseIndex, screenW, coinSize, playerW, coinSpacing, preferredLane, rng } = params;
  const margin = params.laneMargin ?? RUNNER_LANE_MARGIN;
  const geo = computeLaneGeometry(screenW, playerW, margin);
  const count = 4 + Math.min(5, phaseIndex + Math.floor(rng() * 3));
  const out: CoinSpawn[] = [];

  const leftForLane = (lane: number) =>
    Math.max(6, Math.min(screenW - coinSize - 6, geo.obstacleLeftFromLane(lane, coinSize)));

  let lane = Math.max(0, Math.min(RUNNER_LANE_COUNT - 1, preferredLane));

  switch (kind) {
    case "straight":
      for (let i = 0; i < count; i++) {
        out.push({
          x: leftForLane(lane),
          y: -coinSize - 24 - i * (coinSize + coinSpacing),
          size: coinSize,
        });
      }
      break;
    case "arc": {
      const amp = 10 + phaseIndex * 6 + rng() * 8;
      for (let i = 0; i < count; i++) {
        const t = (i / Math.max(1, count - 1)) * Math.PI;
        const dx = Math.sin(t) * amp;
        out.push({
          x: Math.max(6, Math.min(screenW - coinSize - 6, leftForLane(lane) + dx)),
          y: -coinSize - 24 - i * (coinSize + coinSpacing * 0.92),
          size: coinSize,
        });
      }
      break;
    }
    case "zigzag":
      for (let i = 0; i < count; i++) {
        if (i > 0 && i % 2 === 0) lane = Math.max(0, Math.min(2, lane + (rng() < 0.5 ? -1 : 1)));
        out.push({
          x: leftForLane(lane),
          y: -coinSize - 28 - i * (coinSize + coinSpacing),
          size: coinSize,
        });
      }
      break;
    case "laneSwitchTrail":
      for (let i = 0; i < count; i++) {
        lane = i % 3;
        out.push({
          x: leftForLane(lane),
          y: -coinSize - 26 - i * (coinSize + coinSpacing * 1.05),
          size: coinSize,
        });
      }
      break;
    case "riskTrail": {
      const bait = params.hazardLane ?? ((preferredLane + 1) % 3);
      const reward = (bait + 1) % 3;
      const mix = 0.35 + rng() * 0.25;
      for (let i = 0; i < count; i++) {
        const useBait = i >= count - 2 && phaseIndex >= 2 ? rng() < mix : false;
        const ln = useBait ? bait : reward;
        out.push({
          x: leftForLane(ln),
          y: -coinSize - 30 - i * (coinSize + coinSpacing * 1.08),
          size: coinSize,
        });
      }
      break;
    }
    default:
      for (let i = 0; i < count; i++) {
        out.push({
          x: leftForLane(lane),
          y: -coinSize - 24 - i * (coinSize + coinSpacing),
          size: coinSize,
        });
      }
  }

  return out;
}
