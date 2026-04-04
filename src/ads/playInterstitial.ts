import { AdEventType, InterstitialAd } from "react-native-google-mobile-ads";
import { AD_REQUEST_OPTIONS, resolveInterstitialUnitId } from "./adUnitIds";
import { ensureMobileAdsInitialized } from "./mobileAdsInit";

let ad: InterstitialAd | null = null;
let loaded = false;
let pipelineCreated = false;
/** Fired when the interstitial is dismissed (or if show fails / we skip). */
let pendingOnClose: (() => void) | null = null;
/** Ignore duplicate Play taps while an interstitial flow is in progress. */
let playGateBusy = false;

function attachPipeline(): void {
  if (pipelineCreated) return;
  pipelineCreated = true;
  ad = InterstitialAd.createForAdRequest(resolveInterstitialUnitId(), {
    ...AD_REQUEST_OPTIONS,
  });
  ad.addAdEventsListener(({ type }) => {
    if (type === AdEventType.LOADED) {
      loaded = true;
      return;
    }
    if (type === AdEventType.ERROR) {
      loaded = false;
      setTimeout(() => {
        try {
          ad?.load();
        } catch {
          /* ignore */
        }
      }, 900);
      return;
    }
    if (type === AdEventType.CLOSED) {
      loaded = false;
      const finish = pendingOnClose;
      pendingOnClose = null;
      finish?.();
      try {
        ad?.load();
      } catch {
        /* ignore */
      }
    }
  });
}

/**
 * Start loading an interstitial while the user is on the home screen so Play can show it quickly.
 */
export function preparePlayInterstitial(): void {
  void (async () => {
    try {
      await ensureMobileAdsInitialized();
    } catch {
      return;
    }
    try {
      attachPipeline();
      ad?.load();
    } catch {
      /* ignore */
    }
  })();
}

/**
 * Shows a loaded interstitial, then runs `onComplete` after dismiss (or immediately if none ready / show fails).
 */
export function showPlayInterstitialThen(onComplete: () => void): void {
  if (playGateBusy) return;
  playGateBusy = true;
  const finish = () => {
    playGateBusy = false;
    onComplete();
  };

  void (async () => {
    try {
      await ensureMobileAdsInitialized();
    } catch {
      finish();
      return;
    }

    try {
      attachPipeline();
    } catch {
      finish();
      return;
    }

    if (!loaded || !ad) {
      finish();
      try {
        ad?.load();
      } catch {
        /* ignore */
      }
      return;
    }

    pendingOnClose = finish;
    void ad.show().catch(() => {
      if (pendingOnClose === finish) {
        pendingOnClose = null;
        finish();
      }
    });
  })();
}
