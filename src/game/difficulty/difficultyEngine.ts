/**
 * Pure difficulty / progression logic — no React. Tune via difficultyConfig.
 */

import type { DifficultyPhaseId, ObstacleSpawnType } from "./difficultyConfig";
import type { ObstacleVisual } from "../types";
import { obstacleVisualSize } from "../hitboxes";
import {
  COMBO_MAX_TIER,
  COMBO_SCORE_MULT_PER_TIER,
  COMBO_SURVIVAL_FRAMES_FOR_TIER,
  DANGER_BURST_MS,
  DANGER_CLEAR_SCORE_BASE,
  DANGER_CLEAR_SCORE_PER_PHASE,
  DANGER_COOLDOWN_MS,
  DANGER_FALL_MULT,
  DANGER_FIRST_DELAY_MS,
  DANGER_MIN_SCORE_TO_START,
  DANGER_RAMP_MULT,
  DANGER_SPAWN_COMPRESSION,
  DANGER_WARN_MS,
  DIFFICULTY_PHASES,
  FEVER_BASE_DURATION_MS,
  FEVER_BUILD_SOFT_CAP_PER_FRAME,
  FEVER_DRAIN_PER_FRAME_WHEN_IDLE,
  FEVER_DURATION_PER_COMBO_TIER_MS,
  FEVER_METER_MAX,
  FEVER_METER_PER_COIN,
  FEVER_METER_PER_NEAR_MISS,
  FEVER_METER_PER_POWER_PICKUP,
  FEVER_METER_SURVIVAL_CHUNK,
  FEVER_METER_SURVIVAL_CHUNK_FRAMES,
  FEVER_SCORE_MULT_BASE,
  FEVER_SCORE_MULT_PER_PHASE,
  FEVER_WORLD_SPEED_MULT,
  MAX_SPEED_CAP,
  MIN_DUO_SEPARATION_MULT,
  MIN_GAP_PLAYER_ESCAPE_PX,
  NEAR_MISS_COOLDOWN_FRAMES,
  NEAR_MISS_HORIZONTAL_PX,
  NEAR_MISS_SCORE_BASE,
  NEAR_MISS_SCORE_PHASE_SCALE,
  NEAR_MISS_VERTICAL_BAND,
  SPEED_MILESTONE_DELTA,
  SPEED_MILESTONES,
  SPEED_RAMP_BASE,
  SPAWN_INTERVAL_BASE_MAX,
  SPAWN_INTERVAL_BASE_MIN,
  STACK_REJECT_BAND_Y,
  STACK_REJECT_MIN_SEPARATION_X,
  TIME_TENSION_HALF_LIFE_FRAMES,
  WORLD_FALL_MULT,
} from "./difficultyConfig";
import { RUNNER_SPEED_PRESSURE_FLOOR } from "../runner/runnerConfig";

export type DangerVisual = "none" | "warn" | "burst";

export type ResolvedRunPressure = {
  phaseIndex: number;
  phaseId: DifficultyPhaseId;
  tension01: number;
  spawnMin: number;
  spawnMax: number;
  fallSpeedMul: number;
  speedRampMult: number;
  duoSpawnChance: number;
  powerCooldownMul: number;
  coinCooldownMul: number;
  dangerVisual: DangerVisual;
  dangerBurstActive: boolean;
  feverScoreMult: number;
  comboScoreMult: number;
};

export type DangerZoneState = {
  warnEndAt: number;
  burstEndAt: number;
  nextEligibleAt: number;
};

export function createInitialDangerZone(now: number): DangerZoneState {
  return {
    warnEndAt: 0,
    burstEndAt: 0,
    nextEligibleAt: now + DANGER_FIRST_DELAY_MS,
  };
}

export function stepDangerZone(
  d: DangerZoneState,
  input: { now: number; score: number; feverActive: boolean; phaseIndex: number }
): { next: DangerZoneState; clearBonus: number } {
  let clearBonus = 0;
  let next = { ...d };

  // Burst finished → bonus + cooldown
  if (next.burstEndAt > 0 && input.now >= next.burstEndAt) {
    clearBonus = DANGER_CLEAR_SCORE_BASE + input.phaseIndex * DANGER_CLEAR_SCORE_PER_PHASE;
    next = {
      warnEndAt: 0,
      burstEndAt: 0,
      nextEligibleAt: input.now + DANGER_COOLDOWN_MS,
    };
  }

  // Schedule new danger (not during fever — keeps readability / fairness)
  const idle = next.warnEndAt === 0 && next.burstEndAt === 0;
  if (
    idle &&
    !input.feverActive &&
    input.score >= DANGER_MIN_SCORE_TO_START &&
    input.now >= next.nextEligibleAt
  ) {
    const warnEnd = input.now + DANGER_WARN_MS;
    next = {
      warnEndAt: warnEnd,
      burstEndAt: warnEnd + DANGER_BURST_MS,
      nextEligibleAt: Number.MAX_SAFE_INTEGER,
    };
  }

  return { next, clearBonus };
}

export function getPhaseIndexForScore(score: number): number {
  let idx = 0;
  for (let i = DIFFICULTY_PHASES.length - 1; i >= 0; i--) {
    if (score >= DIFFICULTY_PHASES[i].minScore) {
      idx = i;
      break;
    }
  }
  return idx;
}

function tensionFromRunTick(runTick: number): number {
  const t = runTick / (TIME_TENSION_HALF_LIFE_FRAMES + runTick);
  return Math.min(1, Math.max(0, t));
}

export function resolveRunPressure(
  input: {
    score: number;
    runTick: number;
    speed: number;
    now: number;
    dangerWarnEndAt: number;
    dangerBurstEndAt: number;
    feverActive: boolean;
    feverMultiplier: number;
    survivalComboTier: number;
  },
  opts?: { phaseIndexOverride?: number }
): ResolvedRunPressure {
  const phaseIndex =
    opts?.phaseIndexOverride !== undefined
      ? Math.min(DIFFICULTY_PHASES.length - 1, Math.max(0, opts.phaseIndexOverride))
      : getPhaseIndexForScore(input.score);
  const phase = DIFFICULTY_PHASES[phaseIndex];
  const phaseT = Math.min(
    1,
    Math.max(0, (input.score - phase.minScore) / Math.max(1, 8000 + phaseIndex * 3500))
  );
  const timeT = tensionFromRunTick(input.runTick);
  const tension01 = Math.min(1, phaseT * 0.64 + timeT * 0.4 + (phaseIndex / 3) * 0.18);

  const burstActive =
    input.dangerBurstEndAt > 0 &&
    input.now >= input.dangerWarnEndAt &&
    input.now < input.dangerBurstEndAt;
  let dangerVisual: DangerVisual = "none";
  if (input.dangerWarnEndAt > 0 && input.now < input.dangerWarnEndAt) dangerVisual = "warn";
  else if (burstActive) dangerVisual = "burst";

  const denom = Math.max(0.001, MAX_SPEED_CAP - RUNNER_SPEED_PRESSURE_FLOOR);
  const speedProgress = Math.min(
    1,
    Math.max(0, (input.speed - RUNNER_SPEED_PRESSURE_FLOOR) / denom)
  );

  const spawnMul = phase.spawnIntervalMul * (burstActive ? DANGER_SPAWN_COMPRESSION : 1);
  const phaseSpawnMin = Math.max(
    10,
    Math.floor(SPAWN_INTERVAL_BASE_MIN * spawnMul - tension01 * 11 - speedProgress * 7)
  );
  const phaseSpawnMax = Math.max(
    phaseSpawnMin + 5,
    Math.floor(SPAWN_INTERVAL_BASE_MAX * spawnMul - tension01 * 13 - speedProgress * 9)
  );

  const fallMul =
    WORLD_FALL_MULT *
    phase.fallSpeedMul *
    (1 + tension01 * 0.1 + speedProgress * 0.08) *
    (burstActive ? DANGER_FALL_MULT : 1) *
    (input.feverActive ? FEVER_WORLD_SPEED_MULT : 1);

  const rampMult =
    phase.speedRampMul *
    (1 + tension01 * 0.55) *
    (burstActive ? DANGER_RAMP_MULT : 1) *
    (input.feverActive ? 1.08 : 1);

  const duoBase = 0.1 + tension01 * 0.34 + speedProgress * 0.22;
  const duoSpawnChance = Math.min(0.75, duoBase + phase.duoSpawnBonus + (burstActive ? 0.15 : 0));

  const tier = Math.min(COMBO_MAX_TIER, Math.max(0, input.survivalComboTier));
  const comboScoreMult = 1 + tier * COMBO_SCORE_MULT_PER_TIER;

  return {
    phaseIndex,
    phaseId: phase.id,
    tension01,
    spawnMin: phaseSpawnMin,
    spawnMax: phaseSpawnMax,
    fallSpeedMul: fallMul,
    speedRampMult: rampMult,
    duoSpawnChance,
    powerCooldownMul: phase.powerCooldownMul * (burstActive ? 1.14 : 0.97),
    coinCooldownMul: phase.coinCooldownMul * (burstActive ? 1.1 : 1),
    dangerVisual,
    dangerBurstActive: burstActive,
    feverScoreMult: input.feverActive ? input.feverMultiplier : 1,
    comboScoreMult,
  };
}

export function pickWeightedObstacleType(phaseIndex: number, rng: number): ObstacleSpawnType {
  const w = DIFFICULTY_PHASES[phaseIndex].typeWeights;
  const entries = Object.entries(w) as [ObstacleSpawnType, number][];
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  let t = rng * sum;
  for (const [k, v] of entries) {
    t -= v;
    if (t <= 0) return k;
  }
  return "zigzag";
}

/** Apply only milestones not yet folded into `speed` (`appliedCount` milestones already granted). */
export function applyNewMilestonesOnly(
  speed: number,
  score: number,
  appliedCount: number
): { speed: number; appliedCount: number } {
  let s = speed;
  let c = appliedCount;
  while (c < SPEED_MILESTONES.length && score >= SPEED_MILESTONES[c]) {
    s += SPEED_MILESTONE_DELTA[c];
    c += 1;
  }
  return { speed: Math.min(MAX_SPEED_CAP, s), appliedCount: c };
}

export function speedRampStep(speed: number, pressure: ResolvedRunPressure): number {
  return Math.min(MAX_SPEED_CAP, speed + SPEED_RAMP_BASE * pressure.speedRampMult);
}

export function survivalComboTier(survivalFrames: number): number {
  return Math.min(COMBO_MAX_TIER, Math.floor(survivalFrames / COMBO_SURVIVAL_FRAMES_FOR_TIER));
}

/** Expanded AABB overlap without counting as collision — near-miss band. */
export function nearMissCheck(input: {
  pLeft: number;
  pRight: number;
  pTop: number;
  pBottom: number;
  oLeft: number;
  oRight: number;
  oTop: number;
  oBottom: number;
}): boolean {
  const hPad = NEAR_MISS_HORIZONTAL_PX;
  const vBand = NEAR_MISS_VERTICAL_BAND;
  const hx = !(input.oRight < input.pLeft - hPad || input.oLeft > input.pRight + hPad);
  const vy = !(input.oBottom < input.pTop - vBand || input.oTop > input.pBottom + vBand);
  if (!hx || !vy) return false;
  // not a full collision
  const collide =
    input.oLeft < input.pRight &&
    input.oRight > input.pLeft &&
    input.oTop < input.pBottom &&
    input.oBottom > input.pTop;
  return !collide;
}

export function nearMissScore(phaseIndex: number): number {
  return Math.floor(NEAR_MISS_SCORE_BASE + phaseIndex * NEAR_MISS_SCORE_PHASE_SCALE);
}

export function feverMeterPassiveTick(meter: number, feverActive: boolean, tension01: number): number {
  if (feverActive) return meter;
  const decay = FEVER_DRAIN_PER_FRAME_WHEN_IDLE * (0.65 + tension01 * 0.35);
  return Math.max(0, meter - decay);
}

export function feverMeterAddClamped(meter: number, add: number): number {
  return Math.min(FEVER_METER_MAX, meter + Math.min(add, FEVER_BUILD_SOFT_CAP_PER_FRAME));
}

export function feverMeterSurvivalChunk(survivalFrames: number): number {
  if (survivalFrames > 0 && survivalFrames % FEVER_METER_SURVIVAL_CHUNK_FRAMES === 0) {
    return FEVER_METER_SURVIVAL_CHUNK;
  }
  return 0;
}

export function startFever(phaseIndex: number, survivalComboTier: number): { mult: number; until: number } {
  const mult = FEVER_SCORE_MULT_BASE + phaseIndex * FEVER_SCORE_MULT_PER_PHASE + Math.min(3, survivalComboTier) * 0.12;
  const tier = Math.min(COMBO_MAX_TIER, survivalComboTier);
  const duration = FEVER_BASE_DURATION_MS + tier * FEVER_DURATION_PER_COMBO_TIER_MS;
  return { mult, until: duration };
}

export function pickSpawnX(params: {
  width: number;
  screenW: number;
  playerX: number;
  playerW: number;
  lastSpawnX: number;
  tension01: number;
  rng: () => number;
}): number {
  const minGap = Math.max(
    MIN_GAP_PLAYER_ESCAPE_PX - 8,
    52 - params.tension01 * 24
  );
  let startX = params.rng() * (params.screenW - params.width - 16) + 8;
  if (Math.abs(startX - params.lastSpawnX) < minGap) {
    startX = Math.min(
      params.screenW - params.width - 8,
      Math.max(8, startX + (startX < params.lastSpawnX ? -minGap : minGap))
    );
  }
  if (params.tension01 < 0.28 && Math.abs(startX - params.playerX) < 40) {
    startX = Math.min(params.screenW - params.width - 8, Math.max(8, params.playerX + 62));
  }
  return startX;
}

/** Reject spawn if it would stack an unfair vertical cluster at similar X. */
export function shouldRejectStackingSpawn(
  candidateX: number,
  candidateW: number,
  obstacles: readonly { x: number; y: number; size: number; visual: ObstacleVisual; type: ObstacleSpawnType }[],
  rngYCut: number
): boolean {
  for (const o of obstacles) {
    const ow = obstacleVisualSize(o.visual, o.size, o.type === "wide").w;
    const oLeft = o.x;
    const oRight = o.x + ow;
    const cLeft = candidateX;
    const cRight = candidateX + candidateW;
    const xOverlap = !(cRight < oLeft || cLeft > oRight);
    if (xOverlap && o.y > -STACK_REJECT_BAND_Y && o.y < rngYCut) {
      const sep = Math.min(Math.abs(cLeft - oRight), Math.abs(cRight - oLeft));
      if (sep < STACK_REJECT_MIN_SEPARATION_X && rngYCut < 180) return true;
    }
  }
  return false;
}

export function duoSecondX(
  firstX: number,
  width: number,
  screenW: number,
  rng: () => number
): number {
  const dx = screenW * (0.26 + rng() * 0.26);
  let otherX = Math.max(8, Math.min(screenW - width - 8, firstX + (rng() < 0.5 ? -dx : dx)));
  if (Math.abs(otherX - firstX) < width * MIN_DUO_SEPARATION_MULT) {
    otherX = Math.min(screenW - width - 8, Math.max(8, otherX + width * MIN_DUO_SEPARATION_MULT));
  }
  return otherX;
}

export {
  FEVER_METER_PER_NEAR_MISS,
  FEVER_METER_PER_COIN,
  FEVER_METER_PER_POWER_PICKUP,
  NEAR_MISS_COOLDOWN_FRAMES,
};
