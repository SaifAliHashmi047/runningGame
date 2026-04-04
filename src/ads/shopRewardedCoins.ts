import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SHOP_VIDEO_REWARD_CLAIMS_MS_KEY,
  SHOP_VIDEO_REWARD_LAST_CLAIM_MS_KEY,
} from "../storage/persistenceKeys";
import { AD_REQUEST_OPTIONS, resolveRewardedUnitId } from "./adUnitIds";
import { ensureMobileAdsInitialized } from "./mobileAdsInit";

/** Coins granted after a successful rewarded completion (game-facing; AdMob “amount” can differ). */
export const SHOP_REWARDED_COIN_GRANT = 2000;

/** Rolling window for shop coin rewarded ads. */
export const SHOP_VIDEO_WINDOW_MS = 8 * 60 * 60 * 1000;

/** Max rewarded ads for coins per `SHOP_VIDEO_WINDOW_MS`. */
export const SHOP_VIDEO_MAX_PER_WINDOW = 3;

/** @deprecated Use `SHOP_VIDEO_WINDOW_MS`. */
export const SHOP_VIDEO_COOLDOWN_MS = SHOP_VIDEO_WINDOW_MS;

async function readClaimTimestamps(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(SHOP_VIDEO_REWARD_CLAIMS_MS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (x): x is number =>
            typeof x === "number" && Number.isFinite(x) && !Number.isNaN(x),
        );
      }
    }
    const legacy = await AsyncStorage.getItem(
      SHOP_VIDEO_REWARD_LAST_CLAIM_MS_KEY,
    );
    if (legacy != null) {
      const t = parseInt(legacy, 10);
      if (!Number.isNaN(t)) return [t];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function claimsInWindow(claims: number[], now: number): number[] {
  const cutoff = now - SHOP_VIDEO_WINDOW_MS;
  return claims.filter((t) => t > cutoff).sort((a, b) => a - b);
}

/**
 * Ms until another shop coin video is allowed, or `0` if under the per-window cap.
 * With 3 claims in the window, this is time until the oldest claim ages out.
 */
export async function getShopVideoCooldownRemainingMs(): Promise<number> {
  const now = Date.now();
  try {
    const all = await readClaimTimestamps();
    const inW = claimsInWindow(all, now);
    if (inW.length < SHOP_VIDEO_MAX_PER_WINDOW) return 0;
    const oldest = inW[0]!;
    return Math.max(0, oldest + SHOP_VIDEO_WINDOW_MS - now);
  } catch {
    return 0;
  }
}

export async function recordShopVideoRewardClaimed(): Promise<void> {
  const now = Date.now();
  try {
    const all = await readClaimTimestamps();
    const inW = claimsInWindow(all, now);
    const next = [...inW, now];
    await AsyncStorage.setItem(SHOP_VIDEO_REWARD_CLAIMS_MS_KEY, JSON.stringify(next));
    await AsyncStorage.removeItem(SHOP_VIDEO_REWARD_LAST_CLAIM_MS_KEY);
  } catch {
    /* ignore */
  }
}

let ad: RewardedAd | null = null;
let pipelineCreated = false;
let loaded = false;
let pendingAutoShow = false;
let pendingOnClose: (() => void) | null = null;
let pendingOnReward: ((coins: number) => void) | null = null;
let rewardFlowBusy = false;

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
          pendingOnReward = null;
          rewardFlowBusy = false;
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
        pendingOnReward = null;
        rewardFlowBusy = false;
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
      pendingOnReward?.(SHOP_REWARDED_COIN_GRANT);
      pendingOnReward = null;
      void recordShopVideoRewardClaimed();
      return;
    }
    if (type === AdEventType.CLOSED) {
      loaded = false;
      pendingOnReward = null;
      const d = pendingOnClose;
      pendingOnClose = null;
      rewardFlowBusy = false;
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

/**
 * Preload a rewarded ad while the shop is open.
 */
export function prepareShopRewardedAd(): void {
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
 * Shows a rewarded ad; calls `onRewarded` with the coin grant if the user earns it, and always `onDone` when the flow ends (close / error / not ready).
 */
export function showShopRewardedForCoins(
  onRewarded: (coins: number) => void,
  onDone: () => void,
): void {
  if (rewardFlowBusy) {
    onDone();
    return;
  }

  void (async () => {
    const cooldownLeft = await getShopVideoCooldownRemainingMs();
    if (cooldownLeft > 0) {
      onDone();
      return;
    }

    rewardFlowBusy = true;
    pendingOnClose = onDone;
    pendingOnReward = onRewarded;

    try {
      await ensureMobileAdsInitialized();
    } catch {
      pendingOnClose = null;
      pendingOnReward = null;
      rewardFlowBusy = false;
      onDone();
      return;
    }

    try {
      attachPipeline();
    } catch {
      pendingOnClose = null;
      pendingOnReward = null;
      rewardFlowBusy = false;
      onDone();
      return;
    }

    if (loaded && ad) {
      pendingAutoShow = false;
      void showLoadedAd().catch(() => {
        pendingOnClose = null;
        pendingOnReward = null;
        rewardFlowBusy = false;
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
      pendingOnReward = null;
      rewardFlowBusy = false;
      onDone();
    }
  })();
}
