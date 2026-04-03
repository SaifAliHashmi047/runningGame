/**
 * Distance milestones and tuning for endless-runner zones.
 * Speed multipliers apply on top of the time-based curve from `runnerProgression`.
 */

export type RunnerZoneConfig = {
  /** 1-based label for UI */
  zone: number;
  /** Enter this zone when `runDistance >= minDistance`. */
  minDistance: number;
  /** Multiplier on `runnerSpeedFromElapsedSec` target (per-zone cap still applies). */
  speedMult: number;
  /** >1 = obstacles spawn more often (cooldown ÷ this). */
  obstacleRateMult: number;
  /** >1 = tighter coin cadence + riskier pattern tier bias. */
  coinRiskMult: number;
};

/**
 * Ordered by `minDistance`. Last entry is the endless cap (Zone 5+).
 */
export const RUNNER_ZONES: readonly RunnerZoneConfig[] = [
  { zone: 1, minDistance: 0, speedMult: 1.0, obstacleRateMult: 1.0, coinRiskMult: 1.0 },
  { zone: 2, minDistance: 200, speedMult: 1.15, obstacleRateMult: 1.2, coinRiskMult: 1.1 },
  { zone: 3, minDistance: 500, speedMult: 1.3, obstacleRateMult: 1.4, coinRiskMult: 1.25 },
  { zone: 4, minDistance: 900, speedMult: 1.45, obstacleRateMult: 1.6, coinRiskMult: 1.4 },
  { zone: 5, minDistance: 1400, speedMult: 1.6, obstacleRateMult: 1.8, coinRiskMult: 1.6 },
] as const;

/** Sim speed units → distance units per second (tune so zone milestones feel right). */
export const RUN_DISTANCE_PER_SPEED_SECOND = 2.65;

/** Per “unit” frame at k=1 — matches user’s ~0.05 lerp feel at 60Hz. */
export const ZONE_SPEED_LERP = 0.065;

export function getRunnerZoneByDistance(distance: number): RunnerZoneConfig & { index: number } {
  const d = Math.max(0, distance);
  let idx = 0;
  for (let i = RUNNER_ZONES.length - 1; i >= 0; i--) {
    if (d >= RUNNER_ZONES[i].minDistance) {
      idx = i;
      break;
    }
  }
  const c = RUNNER_ZONES[idx];
  return { ...c, index: idx };
}

/** Obstacle / pattern tier 0..3 from zone (caps at 3 for existing pattern tables). */
export function patternPhaseFromZoneIndex(zoneIndex: number): number {
  return Math.min(3, Math.max(0, zoneIndex));
}

/** Coin patterns: bias toward riskier tables as zone + coinRisk climb. */
export function coinPatternPhaseFromZone(zoneIndex: number, coinRiskMult: number): number {
  const riskBoost = Math.round(Math.max(0, coinRiskMult - 1) * 2.2);
  return Math.min(3, Math.max(0, zoneIndex + riskBoost));
}
