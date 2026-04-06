import React, { useEffect, useRef } from "react";
import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";
import { AD_REQUEST_OPTIONS, resolveAppOpenUnitId } from "./adUnitIds";
import { ensureMobileAdsInitialized } from "./mobileAdsInit";

type Props = {
  isOnHomeScreen: boolean;
  /**
   * When false (e.g. splash still running), the ad may load but must not present.
   * When it flips true, a pending loaded ad will show once.
   */
  canPresentAppOpen: boolean;
};

/** One cold-start sequence per JS runtime (avoids duplicate loads under React Strict Mode). */
let appOpenColdStartStarted = false;

function deferShowAppOpen(
  ad: AppOpenAd,
  isHomeRef: React.MutableRefObject<boolean>,
  canPresentRef: React.MutableRefObject<boolean>,
  cancelled: () => boolean,
  onShown: () => void,
): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const delayMs = 100;
      setTimeout(() => {
        if (cancelled() || !isHomeRef.current || !canPresentRef.current) return;

        const attemptShow = (isRetry: boolean) => {
          if (cancelled() || !isHomeRef.current || !canPresentRef.current) return;
          void ad
            .show()
            .then(() => {
              onShown();
            })
            .catch(() => {
              if (!isRetry) {
                setTimeout(() => attemptShow(true), 280);
              }
            });
        };

        attemptShow(false);
      }, delayMs);
    });
  });
}

/**
 * Loads one app-open ad after SDK init; shows at most once per app session and only if
 * the user is still on the home screen (never during gameplay or splash).
 */
export function AppOpenColdStart({ isOnHomeScreen, canPresentAppOpen }: Props) {
  const isHomeRef = useRef(isOnHomeScreen);
  const canPresentRef = useRef(canPresentAppOpen);
  isHomeRef.current = isOnHomeScreen;
  canPresentRef.current = canPresentAppOpen;

  const pendingLoadedRef = useRef(false);
  const adRef = useRef<AppOpenAd | null>(null);
  const sessionShownRef = useRef(false);
  const showPipelineScheduledRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (appOpenColdStartStarted) return;
    appOpenColdStartStarted = true;

    let removeListener: (() => void) | undefined;
    cancelledRef.current = false;
    let loadErrorRetries = 0;

    const isCancelled = () => cancelledRef.current;

    const tryPresentIfReady = (ad: AppOpenAd) => {
      if (isCancelled() || sessionShownRef.current || !isHomeRef.current) return;
      if (!canPresentRef.current) {
        pendingLoadedRef.current = true;
        adRef.current = ad;
        return;
      }
      if (showPipelineScheduledRef.current) return;
      showPipelineScheduledRef.current = true;
      pendingLoadedRef.current = false;
      deferShowAppOpen(ad, isHomeRef, canPresentRef, isCancelled, () => {
        sessionShownRef.current = true;
      });
    };

    void (async () => {
      try {
        await ensureMobileAdsInitialized();
      } catch {
        return;
      }
      if (isCancelled()) return;

      let ad: AppOpenAd;
      try {
        ad = AppOpenAd.createForAdRequest(resolveAppOpenUnitId(), {
          ...AD_REQUEST_OPTIONS,
        });
      } catch {
        return;
      }

      adRef.current = ad;

      removeListener = ad.addAdEventsListener(({ type }) => {
        if (type === AdEventType.ERROR) {
          if (sessionShownRef.current || isCancelled()) return;
          const next = loadErrorRetries + 1;
          if (next > 1) return;
          loadErrorRetries = next;
          setTimeout(() => {
            if (isCancelled() || sessionShownRef.current) return;
            try {
              ad.load();
            } catch {
              /* ignore */
            }
          }, 1200);
          return;
        }

        if (type !== AdEventType.LOADED) return;
        if (isCancelled() || sessionShownRef.current || !isHomeRef.current) return;
        tryPresentIfReady(ad);
      });

      try {
        ad.load();
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelledRef.current = true;
      removeListener?.();
    };
  }, []);

  useEffect(() => {
    canPresentRef.current = canPresentAppOpen;
    if (!canPresentAppOpen) return;
    if (!pendingLoadedRef.current) return;
    if (sessionShownRef.current || !isHomeRef.current) return;
    const ad = adRef.current;
    if (!ad) return;
    if (showPipelineScheduledRef.current) return;
    pendingLoadedRef.current = false;
    showPipelineScheduledRef.current = true;
    deferShowAppOpen(ad, isHomeRef, canPresentRef, () => cancelledRef.current, () => {
      sessionShownRef.current = true;
    });
  }, [canPresentAppOpen]);

  return null;
}
