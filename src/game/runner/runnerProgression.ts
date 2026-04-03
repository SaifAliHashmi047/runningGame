import { MAX_SPEED_CAP } from "../difficulty/difficultyConfig";
import {
  RUNNER_PHASE_STEP_SECONDS,
  RUNNER_SPAWN_BASE_INTERVAL_FRAMES,
  RUNNER_SPAWN_INTERVAL_DROP_FRAMES,
  RUNNER_SPAWN_MIN_INTERVAL_FRAMES,
  RUNNER_SPAWN_TIME_SCALE_SEC,
  RUNNER_SPEED_BASE,
  RUNNER_SPEED_MAX,
  RUNNER_SPEED_RAMP_RATE,
  RUNNER_SPEED_SCALING_FACTOR_SEC,
} from "./runnerConfig";

/** `runTick` advances by ~1 per 16.67ms target frame — treat as 60Hz clock. */
export function runElapsedSeconds(runTick: number): number {
  return runTick / 60;
}

/**
 * Smooth asymptotic speed: approaches RUNNER_SPEED_MAX slowly; soft-clamped to `MAX_SPEED_CAP`.
 * `current ≈ base + (max-base) * (1 - exp(-(t * ramp) / τ))`
 */
export function runnerSpeedFromElapsedSec(elapsedSec: number): number {
  const maxExtra = Math.max(0, RUNNER_SPEED_MAX - RUNNER_SPEED_BASE);
  const t = Math.max(0, elapsedSec);
  const u = (t * RUNNER_SPEED_RAMP_RATE) / Math.max(0.001, RUNNER_SPEED_SCALING_FACTOR_SEC);
  const extra = maxExtra * (1 - Math.exp(-u));
  const v = RUNNER_SPEED_BASE + extra;
  return Math.min(MAX_SPEED_CAP, Math.max(RUNNER_SPEED_BASE, v));
}

/**
 * Pattern / composition tier from survive time — see `RUNNER_PHASE_STEP_SECONDS` in runnerConfig.
 */
export function runnerDifficultyLevel(elapsedSec: number): number {
  return Math.floor(elapsedSec / RUNNER_PHASE_STEP_SECONDS);
}

/**
 * Maps to 0..3 for `DIFFICULTY_PHASES` indices and pattern weights.
 */
export function runnerPhaseIndex(difficultyLevel: number): number {
  return Math.min(3, Math.max(0, difficultyLevel));
}

/**
 * Spawn cadence tightens on the same *shape* as run speed: very slow early, faster later.
 */
export function obstacleSpawnIntervalFrames(elapsedSec: number): number {
  const t = Math.max(0, elapsedSec);
  const u = (t * RUNNER_SPEED_RAMP_RATE) / Math.max(0.001, RUNNER_SPAWN_TIME_SCALE_SEC);
  const progress = 1 - Math.exp(-u);
  const raw = RUNNER_SPAWN_BASE_INTERVAL_FRAMES - progress * RUNNER_SPAWN_INTERVAL_DROP_FRAMES;
  return Math.max(RUNNER_SPAWN_MIN_INTERVAL_FRAMES, Math.floor(raw));
}
