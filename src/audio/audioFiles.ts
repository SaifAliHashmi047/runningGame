/**
 * Filenames must exist in:
 * - Android: `android/app/src/main/res/raw/` (lowercase, underscores)
 * - iOS: `ios/StackHouse/` (in Xcode target Resources)
 *
 * Replace placeholder WAVs from `scripts/gen-game-audio-wavs.mjs` with real MP3/WAV.
 */
export const BUNDLE_AUDIO = {
  bgGameplay: "bg_gameplay_loop.wav",
  bgMenu: "bg_menu_loop.wav",
  shipHum: "ship_hum_loop.wav",
  coin1: "coin_collect_1.wav",
  coin2: "coin_collect_2.wav",
  death: "hero_dead.wav",
  zoneUp: "zone_speed_up.wav",
  powerup: "powerup_collect.wav",
  buttonTap: "button_tap.wav",
  obstacleHit: "obstacle_hit.wav",
} as const;

export type BundleAudioKey = keyof typeof BUNDLE_AUDIO;
