import { MAX_SPEED_CAP } from "../difficulty/difficultyConfig";
import {
  RUNNER_MAX_EXTRA_SPEED,
  RUNNER_SPAWN_BASE_INTERVAL_FRAMES,
  RUNNER_SPAWN_DECAY_PER_SEC,
  RUNNER_SPAWN_MIN_INTERVAL_FRAMES,
  RUNNER_SPEED_SCALING_FACTOR_SEC,
  RUNNER_START_SPEED,
} from "./runnerConfig";

/** `runTick` advances by ~1 per 16.67ms target frame — treat as 60Hz clock. */
export function runElapsedSeconds(runTick: number): number {
  return runTick / 60;
}

/**
 * Smooth asymptotic speed curve (no harsh jumps). Soft-clamped to `MAX_SPEED_CAP`.
 */
export function runnerSpeedFromElapsedSec(elapsedSec: number): number {
  const extra = RUNNER_MAX_EXTRA_SPEED * (1 - Math.exp(-elapsedSec / RUNNER_SPEED_SCALING_FACTOR_SEC));
  const v = RUNNER_START_SPEED + extra;
  return Math.min(MAX_SPEED_CAP, Math.max(RUNNER_START_SPEED, v));
}

/** Every 20s of run time, difficulty level steps once (spawn + pattern tier). */
export function runnerDifficultyLevel(elapsedSec: number): number {
  return Math.floor(elapsedSec / 20);
}

/**
 * Maps to 0..3 for `DIFFICULTY_PHASES` indices and pattern weights.
 */
export function runnerPhaseIndex(difficultyLevel: number): number {
  return Math.min(3, Math.max(0, difficultyLevel));
}

export function obstacleSpawnIntervalFrames(elapsedSec: number): number {
  const raw = RUNNER_SPAWN_BASE_INTERVAL_FRAMES - elapsedSec * RUNNER_SPAWN_DECAY_PER_SEC;
  return Math.max(RUNNER_SPAWN_MIN_INTERVAL_FRAMES, Math.floor(raw));
}
