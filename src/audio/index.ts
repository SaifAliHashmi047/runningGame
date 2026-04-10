export { GameAudioManager, getAudioManager } from "./AudioManager";
export { AUDIO_GAIN, AUDIO_MIX, AUDIO_TIMING } from "./audioConstants";
export { BUNDLE_AUDIO, type BundleAudioKey } from "./audioFiles";
export { mainBundleFilename } from "./bundleFilename";
export {
  GlobalMusicManager,
  ensureBackgroundMusicLoaded,
  setBackgroundMusicRoute,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  releaseGlobalMusic,
  stopBackgroundMusic,
  resetBackgroundMusicRoute,
  setBackgroundMusicUserEnabled,
  getBackgroundMusicUserEnabled,
  BGM_UI_VOLUME,
  BGM_GAME_VOLUME,
} from "./globalMusicManager";
