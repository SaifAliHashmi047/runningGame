/**
 * Single tunable surface for progression, phases, danger, fever, and fair spawn limits.
 * Adjust here for balance passes — avoid scattering magic numbers in the sim loop.
 */

import { widthDesignScale } from "../../../utils/designMetrics";

export type DifficultyPhaseId = "warmup" | "medium" | "hard" | "extreme";

export type ObstacleSpawnType = "block" | "fast" | "wide" | "zigzag";

/** Core run speed — exported for physics that must match. */
export const BASE_SPEED = 3.5;
export const MAX_SPEED_CAP = 16.8;
/** Per-frame base increment before modifiers (small = smooth curve). */
export const SPEED_RAMP_BASE = 0.00155;

/** Score thresholds that grant a one-time speed “bump” (fair telegraph via phase UI). */
export const SPEED_MILESTONES = [2500, 6000, 14000, 28000, 52000] as const;
/** Additive speed at each milestone index (clamp applied later). */
export const SPEED_MILESTONE_DELTA = [0.42, 0.38, 0.48, 0.52, 0.55] as const;

/** Run time (frames) used to blend “time tension” on top of score phase. */
export const TIME_TENSION_HALF_LIFE_FRAMES = 4200;

/**
 * Phases: as score rises, spawn pressure and variety increase; rewards tighten slightly in extreme
 * to keep risk/reward meaningful (still fair — see spawn validation).
 */
export const DIFFICULTY_PHASES: readonly {
  id: DifficultyPhaseId;
  minScore: number;
  /** Name for debug / future UI */
  label: string;
  /** Multiplier on base spawn interval (lower = more frequent). */
  spawnIntervalMul: number;
  /** Extra duo-lane spawn chance added on top of curve. */
  duoSpawnBonus: number;
  /** Multiplier on vertical fall speed (obstacles / pickups / coins). */
  fallSpeedMul: number;
  /** Multiplier on per-frame speed ramp. */
  speedRampMul: number;
  /** Weighted obstacle types (need not sum to 1 — normalized at pick time). */
  typeWeights: Record<ObstacleSpawnType, number>;
  /** Power-up spawn cooldown multiplier vs baseline (>1 rarer). */
  powerCooldownMul: number;
  coinCooldownMul: number;
}[] = [
  {
    id: "warmup",
    minScore: 0,
    label: "Warmup",
    spawnIntervalMul: 1.12,
    duoSpawnBonus: 0.06,
    fallSpeedMul: 1.0,
    speedRampMul: 0.78,
    typeWeights: { block: 0.38, fast: 0.12, wide: 0.22, zigzag: 0.28 },
    powerCooldownMul: 0.92,
    coinCooldownMul: 0.95,
  },
  {
    id: "medium",
    minScore: 3500,
    label: "Medium",
    spawnIntervalMul: 0.88,
    duoSpawnBonus: 0.14,
    fallSpeedMul: 1.08,
    speedRampMul: 1.05,
    typeWeights: { block: 0.22, fast: 0.22, wide: 0.26, zigzag: 0.3 },
    powerCooldownMul: 1.0,
    coinCooldownMul: 1.02,
  },
  {
    id: "hard",
    minScore: 11000,
    label: "Hard",
    spawnIntervalMul: 0.72,
    duoSpawnBonus: 0.22,
    fallSpeedMul: 1.16,
    speedRampMul: 1.28,
    typeWeights: { block: 0.16, fast: 0.3, wide: 0.24, zigzag: 0.3 },
    powerCooldownMul: 1.08,
    coinCooldownMul: 1.05,
  },
  {
    id: "extreme",
    minScore: 26000,
    label: "Extreme",
    spawnIntervalMul: 0.58,
    duoSpawnBonus: 0.3,
    fallSpeedMul: 1.24,
    speedRampMul: 1.45,
    typeWeights: { block: 0.12, fast: 0.34, wide: 0.24, zigzag: 0.3 },
    powerCooldownMul: 1.12,
    coinCooldownMul: 1.08,
  },
];

/** Baseline spawn interval bounds (frames) before phase + danger multipliers. */
export const SPAWN_INTERVAL_BASE_MIN = 22;
export const SPAWN_INTERVAL_BASE_MAX = 44;

/** Global fall-speed tuning (game feel). */
export const WORLD_FALL_MULT = 1.28;

/**
 * Obstacle / pickup sizes — design px @ 375w, then scaled to device via `scale`.
 * Slightly reduced vs earlier builds (smaller “wide” feel + smaller power-ups).
 */
export const OBSTACLE_SIZE_MIN = widthDesignScale(66);
export const OBSTACLE_SIZE_MAX = widthDesignScale(104);
export const POWERUP_WORLD_SIZE = widthDesignScale(44);
export const COIN_SIZE = widthDesignScale(21);

/** Danger zone: short burst of higher pressure after a clear warning. */
export const DANGER_MIN_SCORE_TO_START = 1800;
export const DANGER_WARN_MS = 2200;
export const DANGER_BURST_MS = 5200;
export const DANGER_COOLDOWN_MS = 32000;
export const DANGER_FIRST_DELAY_MS = 28000;
/** During burst: spawn interval × this (<1 = denser). */
export const DANGER_SPAWN_COMPRESSION = 0.62;
/** During burst: extra multiplier on world fall speed. */
export const DANGER_FALL_MULT = 1.14;
/** During burst: extra speed ramp multiplier (frames feel hotter). */
export const DANGER_RAMP_MULT = 1.35;

/** Fever: skill-based activation via meter + bonuses. */
export const FEVER_METER_MAX = 100;
export const FEVER_DRAIN_PER_FRAME_WHEN_IDLE = 0.04;
export const FEVER_METER_PER_NEAR_MISS = 3.8;
export const FEVER_METER_PER_COIN = 0.55;
export const FEVER_METER_PER_POWER_PICKUP = 2.2;
export const FEVER_METER_SURVIVAL_CHUNK_FRAMES = 120;
export const FEVER_METER_SURVIVAL_CHUNK = 1.15;
export const FEVER_BASE_DURATION_MS = 9000;
export const FEVER_DURATION_PER_COMBO_TIER_MS = 900;
export const FEVER_SCORE_MULT_BASE = 2.4;
export const FEVER_SCORE_MULT_PER_PHASE = 0.35;
export const FEVER_WORLD_SPEED_MULT = 1.12;
export const FEVER_BUILD_SOFT_CAP_PER_FRAME = 2.8;

/** Near-miss: competitive bonus + fever juice. */
export const NEAR_MISS_HORIZONTAL_PX = 22;
export const NEAR_MISS_VERTICAL_BAND = 110;
export const NEAR_MISS_SCORE_BASE = 35;
export const NEAR_MISS_SCORE_PHASE_SCALE = 22;
export const NEAR_MISS_COOLDOWN_FRAMES = 38;

/** Combo survival: passive score multiplier growth (resets on shield break is optional — we keep simple). */
export const COMBO_SURVIVAL_FRAMES_FOR_TIER = 360;
export const COMBO_MAX_TIER = 8;
export const COMBO_SCORE_MULT_PER_TIER = 0.04;

/** Danger survival: bonus score when exiting a burst without dying (applied once). */
export const DANGER_CLEAR_SCORE_BASE = 220;
export const DANGER_CLEAR_SCORE_PER_PHASE = 90;

/** Fair spawn: minimum horizontal solvability */
export const MIN_GAP_PLAYER_ESCAPE_PX = 56;
export const MIN_DUO_SEPARATION_MULT = 1.15;
export const STACK_REJECT_BAND_Y = 240;
export const STACK_REJECT_MIN_SEPARATION_X = 70;
