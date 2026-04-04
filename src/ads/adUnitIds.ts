/**
 * Central place for AdMob ad unit IDs.
 *
 * When going live, set `USE_TEST_AD_IDS` to `false` and fill production unit IDs
 * from the AdMob console (separate IDs per format and platform).
 *
 * @see https://docs.page/invertase/react-native-google-mobile-ads
 */
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

/** Keep `true` until you replace placeholders below and verify on real devices. */
export const USE_TEST_AD_IDS = true;

/** Production — App Open */
export const PRODUCTION_APP_OPEN_ANDROID = "ca-app-pub-6931427565019966/________";
export const PRODUCTION_APP_OPEN_IOS = "ca-app-pub-xxxxxxxxxxxxxxxx/________";

/** Production — Banner (home / menus only) */
export const PRODUCTION_BANNER_ANDROID = "ca-app-pub-6931427565019966/________";
export const PRODUCTION_BANNER_IOS = "ca-app-pub-xxxxxxxxxxxxxxxx/________";

/** Production — Interstitial (e.g. before starting a run) */
export const PRODUCTION_INTERSTITIAL_ANDROID = "ca-app-pub-6931427565019966/________";
export const PRODUCTION_INTERSTITIAL_IOS = "ca-app-pub-xxxxxxxxxxxxxxxx/________";

/** Production — Rewarded (e.g. shop: watch video for coins) */
export const PRODUCTION_REWARDED_ANDROID = "ca-app-pub-6931427565019966/________";
export const PRODUCTION_REWARDED_IOS = "ca-app-pub-xxxxxxxxxxxxxxxx/________";

export function resolveAppOpenUnitId(): string {
  if (USE_TEST_AD_IDS) return TestIds.APP_OPEN;
  return Platform.OS === "android" ? PRODUCTION_APP_OPEN_ANDROID : PRODUCTION_APP_OPEN_IOS;
}

export function resolveBannerUnitId(): string {
  if (USE_TEST_AD_IDS) return TestIds.ADAPTIVE_BANNER;
  return Platform.OS === "android" ? PRODUCTION_BANNER_ANDROID : PRODUCTION_BANNER_IOS;
}

export function resolveInterstitialUnitId(): string {
  if (USE_TEST_AD_IDS) return TestIds.INTERSTITIAL;
  return Platform.OS === "android"
    ? PRODUCTION_INTERSTITIAL_ANDROID
    : PRODUCTION_INTERSTITIAL_IOS;
}

export function resolveRewardedUnitId(): string {
  if (USE_TEST_AD_IDS) return TestIds.REWARDED;
  return Platform.OS === "android"
    ? PRODUCTION_REWARDED_ANDROID
    : PRODUCTION_REWARDED_IOS;
}

/** Shared request options — conservative defaults. */
export const AD_REQUEST_OPTIONS = {
  requestNonPersonalizedAdsOnly: true,
} as const;
