/**
 * Mix targets — tune globally; effective level is `clamp(0,1)(base * categoryMaster)`.
 */
export const AUDIO_MIX = {
  /** Background gameplay / menu loops */
  music: 0.28,
  /** Ship hum / ambient hero loop */
  ambient: 0.16,
  /** One-shots: coin, zone, power-up, UI */
  sfx: 1,
  /** Category masters (multiply into each play) */
  musicMaster: 1,
  sfxMaster: 1,
  ambientMaster: 1,
} as const;

/** Per-asset gain (0–1) relative to category before masters */
export const AUDIO_GAIN = {
  bgGameplay: 1,
  bgMenu: 1,
  shipHum: 1,
  coin: 0.42,
  powerup: 0.52,
  zoneUp: 0.48,
  death: 0.72,
  buttonTap: 0.28,
  obstacleHit: 0.5,
} as const;

export const AUDIO_TIMING = {
  musicFadeInMs: 420,
  musicFadeOutMs: 320,
  duckMusicMult: 0.22,
  coinMinIntervalMs: 52,
  coinComboResetMs: 140,
  coinComboPitchStep: 0.028,
  coinComboPitchMax: 0.22,
} as const;
