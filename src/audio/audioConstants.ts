/**
 * Mix targets — tune globally; effective level is `clamp(0,1)(base * categoryMaster)`.
 */
export const AUDIO_MIX = {
  /** Ship hum / ambient hero loop */
  ambient: 0.16,
  /** One-shots: coin, zone, power-up, UI */
  sfx: 1,
  /** Category masters (multiply into each play) */
  sfxMaster: 1,
  ambientMaster: 1,
} as const;

/** Per-asset gain (0–1) relative to category before masters */
export const AUDIO_GAIN = {
  shipHum: 1,
  coin: 0.42,
  powerup: 0.52,
  zoneUp: 0.48,
  death: 0.58,
  gameOver: 0.52,
  buttonTap: 0.28,
  obstacleHit: 0.55,
} as const;

export const AUDIO_TIMING = {
  coinMinIntervalMs: 52,
} as const;
