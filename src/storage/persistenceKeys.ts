/** AsyncStorage keys for profile / progression (keep in sync across readers/writers). */
export const HIGH_SCORE_KEY = "@stackRunner/highScore";
export const OWNED_SKINS_KEY = "@stackRunner/ownedSkins";
export const CURRENT_SKIN_KEY = "@stackRunner/currentSkin";
export const TOTAL_RUNS_KEY = "@stackRunner/totalRuns";
export const SAVED_COINS_KEY = "@stackRunner/savedCoins";
/** @deprecated Legacy single-stamp; see `SHOP_VIDEO_REWARD_CLAIMS_MS_KEY`. */
export const SHOP_VIDEO_REWARD_LAST_CLAIM_MS_KEY =
  "@stackRunner/shopVideoRewardLastClaimMs";
/** JSON number[] — timestamps (ms) of coin rewarded ads in the current 8h window (max 3). */
export const SHOP_VIDEO_REWARD_CLAIMS_MS_KEY =
  "@stackRunner/shopVideoRewardClaimsMs";
/** `"1"` = background music on, `"0"` = off (see `GlobalMusicManager`). */
export const MUSIC_ENABLED_KEY = "@stackRunner/musicEnabled";
/** `"1"` = tilt ship with gyro, `"0"` = drag to steer (see `GameScreen`). */
export const GYRO_STEERING_ENABLED_KEY = "@stackRunner/gyroSteeringEnabled";
