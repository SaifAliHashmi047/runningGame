/**
 * Subway-style endless runner tuning: time-based speed, phased difficulty, lane grid.
 * Values are in simulation units (same space as existing `speed` / frame dt).
 */

/** Starting scroll speed — deliberately slow for onboarding. */
export const RUNNER_START_SPEED = 2.35;

/** Asymptotic cap added on top of start: final ≈ RUNNER_START_SPEED + RUNNER_MAX_EXTRA_SPEED (before global clamp). */
export const RUNNER_MAX_EXTRA_SPEED = 9.25;

/** Seconds — higher = gentler ramp toward max speed. */
export const RUNNER_SPEED_SCALING_FACTOR_SEC = 48;

/** Spawn interval decay: frames subtracted per elapsed run second (after base). */
export const RUNNER_SPAWN_BASE_INTERVAL_FRAMES = 52;
export const RUNNER_SPAWN_DECAY_PER_SEC = 0.62;
export const RUNNER_SPAWN_MIN_INTERVAL_FRAMES = 14;

/** Lane swipe: min horizontal travel (dp) to commit one lane change. */
export const LANE_SWIPE_THRESHOLD_PX = 32;

/** Frames of input lockout after a lane commit (reduces jitter / double taps). */
export const LANE_CHANGE_COOLDOWN_FRAMES = 14;

/** Horizontal lerp toward lane center each frame at k=1 (scaled by `k` in sim). */
export const LANE_MOVEMENT_SMOOTHING = 0.22;

/** Coin trail spacing: base vertical gap + speed × factor (readability at high speed). */
export const COIN_SPACING_BASE = 11;
export const COIN_SPACING_SPEED_FACTOR = 1.35;

export const RUNNER_LANE_COUNT = 3;

/** Side inset for lane grid (dp). */
export const RUNNER_LANE_MARGIN = 14;

export type ObstaclePatternId =
  | "singleBlock"
  | "leftRightGap"
  | "centerBlock"
  | "doubleLaneBlock"
  | "jumpThenSwitch"
  | "lowBarrierThenCoinTrail"
  | "dangerZoneWithSafeLane";

export type CoinPatternKind = "straight" | "arc" | "zigzag" | "riskTrail" | "laneSwitchTrail";
