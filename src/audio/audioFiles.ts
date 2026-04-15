/**
 * Filenames must exist in:
 * - Android: `android/app/src/main/res/raw/` (lowercase, underscores). Release shrinking: keep
 *   rules live in `android/app/src/main/res/xml/rn_sound_audio_keep.xml` (not `res/raw/keep.xml` —
 *   RN codegen overwrites that path for drawable keeps).
 * - iOS: `ios/StackHouse/` (in Xcode target Resources)
 *
 * Run `node scripts/gen-game-audio-wavs.mjs` to emit placeholder WAVs.
 */
export const BUNDLE_AUDIO = {
  shipHum: "ship_hum_loop.wav",
  /** Single coin pickup clip — one `Sound` instance, preloaded once (Mixkit success alert). */
  coin: "coin_pickup.wav",
  /** Obstacle collision / game-over explosion (MP3). */
  death: "obstacle_explosion.mp3",
  /** Game-over sting layered after explosion (MP3). */
  gameOver: "game_over.mp3",
  zoneUp: "zone_speed_up.wav",
  /** Power-up pickup (MP3). */
  powerup: "powerup_pickup.mp3",
  buttonTap: "button_tap.wav",
  obstacleHit: "obstacle_hit.wav",
} as const;

export type BundleAudioKey = keyof typeof BUNDLE_AUDIO;
