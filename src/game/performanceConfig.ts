/**
 * Performance / adaptive quality — separate from gameplay balance.
 * Tune targets here; gameplay math uses `frameScale` from the RAF loop.
 */

/** Target 60 FPS budget in ms. */
export const TARGET_FRAME_MS = 1000 / 60;

/**
 * Max 60Hz-style sim ticks per `requestAnimationFrame` callback.
 * Higher values catch up physics after a stall but multiply JS work and tank FPS — keep at 2 for 60fps headroom.
 */
export const MAX_SIM_SUBSTEPS_PER_FRAME = 2;

/** Do not simulate more than this wall-clock gap in one frame (avoids tunneling / huge jumps). */
export const MAX_DELTA_MS = 48;

/**
 * After a spike, scale simulation by at most this factor in a single frame
 * (prevents one slow frame from fast-forwarding the world).
 */
export const MAX_FRAME_SCALE = 2.35;

/** Rolling window for FPS / frame-time estimates. */
export const PERF_SAMPLE_WINDOW = 45;

/** How often (ms) to push sampler stats to React for HUD / adaptive tier. */
export const PERF_UI_REFRESH_MS = 1500;

/** Enable FPS overlay (also requires `DEBUG_PERF_OVERLAY` true). */
export const DEBUG_PERF_OVERLAY = __DEV__ && false;

export type VisualQualityTier = 0 | 1 | 2 | 3 | 4;

/** Frame-time thresholds (ms, rolling avg) → tier. Gameplay unchanged; visuals simplify. */
export const TIER_FROM_AVG_FRAME_MS: { maxAvgMs: number; tier: VisualQualityTier }[] = [
  { maxAvgMs: 17.8, tier: 0 },
  { maxAvgMs: 22, tier: 1 },
  { maxAvgMs: 28, tier: 2 },
  { maxAvgMs: 36, tier: 3 },
  { maxAvgMs: Infinity, tier: 4 },
];

export function tierFromAvgFrameTime(avgMs: number): VisualQualityTier {
  for (const row of TIER_FROM_AVG_FRAME_MS) {
    if (avgMs <= row.maxAvgMs) return row.tier;
  }
  return 4;
}
