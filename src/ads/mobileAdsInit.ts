import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads";

let initPromise: Promise<void> | null = null;

/**
 * Single-flight Mobile Ads SDK init. Safe to call from multiple components; never throws.
 */
export function ensureMobileAdsInitialized(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (__DEV__) {
        try {
          await mobileAds().setRequestConfiguration({
            testDeviceIdentifiers: ["EMULATOR"],
            maxAdContentRating: MaxAdContentRating.T,
          });
        } catch {
          /* non-fatal */
        }
      }
      await mobileAds().initialize();
    } catch (e) {
      if (__DEV__) {
        console.warn("[Ads] Mobile Ads initialize failed:", e);
      }
    }
  })();

  return initPromise;
}
