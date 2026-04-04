/**
 * Subway-style endless runner tuning: time-based speed, phased difficulty, lane grid.
 * Values are in simulation units (same space as existing `speed` / frame dt).
 *
 * **Speed progression** — edit `RUNNER_SPEED_*` first when balancing feel.
 */

// ─── Run speed over elapsed time (primary tuning surface) ─────────────────

/** Comfortable starting scroll — low so the first zones stay relaxed. */
export const RUNNER_SPEED_BASE = 1.38;

/**
 * Asymptotic target from the exponential curve (before global MAX_SPEED_CAP).
 * Effective extra tops out at (RUNNER_SPEED_MAX - RUNNER_SPEED_BASE).
 */
export const RUNNER_SPEED_MAX = 11.6;

/**
 * τ in: `extra = maxExtra * (1 - exp(-(elapsedSec * ramp) / τ))`.
 * **Larger** = flatter curve; strong scroll waits until late zones + long runtime.
 */
export const RUNNER_SPEED_SCALING_FACTOR_SEC = 168;

/**
 * Scales elapsed time inside the exponential (1 = default).
 * **Lower** = reaches high pace later (pairs with zone 5–6 speed multipliers).
 */
export const RUNNER_SPEED_RAMP_RATE = 0.5;

/**
 * Speed (sim units) at/above which spawn/fall/`duo`pressure uses `speedProgress` > 0.
 * Keep **above** RUNNER_SPEED_BASE so early run stays free of “speed tax” on density.
 */
export const RUNNER_SPEED_PRESSURE_FLOOR = 3.25;

/** Convenience bundle for designers / debugging. */
export const RUNNER_SPEED_TUNING = {
  baseSpeed: RUNNER_SPEED_BASE,
  maxSpeed: RUNNER_SPEED_MAX,
  scalingFactor: RUNNER_SPEED_SCALING_FACTOR_SEC,
  speedRampRate: RUNNER_SPEED_RAMP_RATE,
  pressureFloor: RUNNER_SPEED_PRESSURE_FLOOR,
} as const;

// ─── Back-compat names (prefer RUNNER_SPEED_BASE) ──────────────────────────

/** @deprecated Use `RUNNER_SPEED_BASE`. */
export const RUNNER_START_SPEED = RUNNER_SPEED_BASE;

/** @deprecated Derived from max − base; prefer tuning RUNNER_SPEED_MAX. */
export const RUNNER_MAX_EXTRA_SPEED = Math.max(0, RUNNER_SPEED_MAX - RUNNER_SPEED_BASE);

// ─── Obstacle spawn interval vs elapsed time (density follows speed gently) ─

/** Interval at run start (frames) — higher = calmer early waves. */
export const RUNNER_SPAWN_BASE_INTERVAL_FRAMES = 78;

/** How much the interval can shrink asymptotically (still floored by min). */
export const RUNNER_SPAWN_INTERVAL_DROP_FRAMES = 26;

/**
 * Seconds τ for spawn tightening (same shape as speed: slow early, faster later).
 * **Larger** = obstacle streams stay sparse longer.
 */
export const RUNNER_SPAWN_TIME_SCALE_SEC = 168;

export const RUNNER_SPAWN_MIN_INTERVAL_FRAMES = 20;

// ─── Runner pattern phase (ties to `runnerPhaseIndex` in App) ──────────────

/** Seconds per step 0→1→2→3 for pattern tier — larger = easier compositions longer. */
export const RUNNER_PHASE_STEP_SECONDS = 38;

/** @deprecated Use exponential spawn tuning above. */
export const RUNNER_SPAWN_DECAY_PER_SEC = 0.38;

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
