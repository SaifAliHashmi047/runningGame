import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";
import { AD_REQUEST_OPTIONS, resolveRewardedUnitId } from "./adUnitIds";
import { ensureMobileAdsInitialized } from "./mobileAdsInit";

let ad: RewardedAd | null = null;
let pipelineCreated = false;
let loaded = false;
let pendingAutoShow = false;
let pendingOnClose: (() => void) | null = null;
let pendingOnEarned: (() => void) | null = null;
let flowBusy = false;

function attachPipeline(): void {
  if (pipelineCreated) return;
  pipelineCreated = true;
  ad = RewardedAd.createForAdRequest(resolveRewardedUnitId(), {
    ...AD_REQUEST_OPTIONS,
  });
  ad.addAdEventsListener(({ type }) => {
    if (type === RewardedAdEventType.LOADED) {
      loaded = true;
      if (pendingAutoShow && ad) {
        pendingAutoShow = false;
        void showLoadedAd().catch(() => {
          const d = pendingOnClose;
          pendingOnClose = null;
          pendingOnEarned = null;
          flowBusy = false;
          d?.();
        });
      }
      return;
    }
    if (type === AdEventType.ERROR) {
      loaded = false;
      if (pendingAutoShow) {
        pendingAutoShow = false;
        const d = pendingOnClose;
        pendingOnClose = null;
        pendingOnEarned = null;
        flowBusy = false;
        d?.();
      }
      setTimeout(() => {
        try {
          ad?.load();
        } catch {
          /* ignore */
        }
      }, 1000);
      return;
    }
    if (type === RewardedAdEventType.EARNED_REWARD) {
      pendingOnEarned?.();
      pendingOnEarned = null;
      return;
    }
    if (type === AdEventType.CLOSED) {
      loaded = false;
      pendingOnEarned = null;
      const d = pendingOnClose;
      pendingOnClose = null;
      flowBusy = false;
      d?.();
      try {
        ad?.load();
      } catch {
        /* ignore */
      }
    }
  });
}

function showLoadedAd(): Promise<void> {
  if (!ad) return Promise.resolve();
  return ad.show().catch(() => undefined);
}

/** Preload while the game-over card is visible. */
export function prepareReviveRewardedAd(): void {
  void (async () => {
    try {
      await ensureMobileAdsInitialized();
    } catch {
      return;
    }
    try {
      attachPipeline();
      if (!loaded) ad?.load();
    } catch {
      /* ignore */
    }
  })();
}

/**
 * Rewarded ad to continue the same run after death. `onEarned` when the user completes the reward;
 * `onDone` when the flow ends (close / error / not ready).
 */
export function showReviveRewardedAd(
  onEarned: () => void,
  onDone: () => void,
): void {
  if (flowBusy) {
    onDone();
    return;
  }

  void (async () => {
    flowBusy = true;
    pendingOnClose = onDone;
    pendingOnEarned = onEarned;

    try {
      await ensureMobileAdsInitialized();
    } catch {
      pendingOnClose = null;
      pendingOnEarned = null;
      flowBusy = false;
      onDone();
      return;
    }

    try {
      attachPipeline();
    } catch {
      pendingOnClose = null;
      pendingOnEarned = null;
      flowBusy = false;
      onDone();
      return;
    }

    if (loaded && ad) {
      pendingAutoShow = false;
      void showLoadedAd().catch(() => {
        pendingOnClose = null;
        pendingOnEarned = null;
        flowBusy = false;
        onDone();
      });
      return;
    }

    pendingAutoShow = true;
    try {
      ad?.load();
    } catch {
      pendingAutoShow = false;
      pendingOnClose = null;
      pendingOnEarned = null;
      flowBusy = false;
      onDone();
    }
  })();
}
