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
 * Ordered by `minDistance`. Last entry is the endless cap (Zone 6+).
 * Zones 5–6 stay **harder** than mid-game but ramp is smoothed so runs stay fair/readable.
 */
export const RUNNER_ZONES: readonly RunnerZoneConfig[] = [
  { zone: 1, minDistance: 0, speedMult: 0.9, obstacleRateMult: 0.55, coinRiskMult: 0.88 },
  { zone: 2, minDistance: 340, speedMult: 0.95, obstacleRateMult: 0.68, coinRiskMult: 0.94 },
  { zone: 3, minDistance: 760, speedMult: 1.0, obstacleRateMult: 0.82, coinRiskMult: 1.0 },
  { zone: 4, minDistance: 1320, speedMult: 1.08, obstacleRateMult: 0.98, coinRiskMult: 1.1 },
  { zone: 5, minDistance: 2050, speedMult: 1.24, obstacleRateMult: 1.2, coinRiskMult: 1.22 },
  { zone: 6, minDistance: 3000, speedMult: 1.38, obstacleRateMult: 1.3, coinRiskMult: 1.28 },
] as const;

/**
 * Caps zone obstacle density in spawn math so late zones don’t compress cooldowns past solvable play
 * (UI zone label can still reflect full `obstacleRateMult` intent for telemetry).
 */
export const ZONE_OBSTACLE_SPAWN_RATE_CAP = 1.32;

export function zoneObstacleRateForSpawn(zoneObstacleRateMult: number): number {
  return Math.min(zoneObstacleRateMult, ZONE_OBSTACLE_SPAWN_RATE_CAP);
}

/** Sim speed units → distance units per second (lower = longer real time between zone gates). */
export const RUN_DISTANCE_PER_SPEED_SECOND = 2.02;

/** Per “unit” frame at k=1 — lower = scroll eases toward target over more frames (no instant rush). */
export const ZONE_SPEED_LERP = 0.044;

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

/** Obstacle / pattern tier 0..3 from zone (caps at 3; zones 5–6 share the top table). */
export function patternPhaseFromZoneIndex(zoneIndex: number): number {
  return Math.min(3, Math.max(0, zoneIndex));
}

/** Coin patterns: bias toward riskier tables as zone + coinRisk climb (gentler than raw mult). */
export function coinPatternPhaseFromZone(zoneIndex: number, coinRiskMult: number): number {
  const riskBoost = Math.round(Math.max(0, coinRiskMult - 1) * 1.45);
  return Math.min(3, Math.max(0, zoneIndex + riskBoost));
}
