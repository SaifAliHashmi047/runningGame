import React, { useEffect, useRef } from "react";
import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";
import { AD_REQUEST_OPTIONS, resolveAppOpenUnitId } from "./adUnitIds";
import { ensureMobileAdsInitialized } from "./mobileAdsInit";

type Props = { isOnHomeScreen: boolean };

/** One cold-start sequence per JS runtime (avoids duplicate loads under React Strict Mode). */
let appOpenColdStartStarted = false;

function deferShowAppOpen(
  ad: AppOpenAd,
  isHomeRef: React.MutableRefObject<boolean>,
  cancelled: () => boolean,
  onShown: () => void,
): void {
  // Skip InteractionManager — it can wait a long time (animations, lists) and makes ads feel “late”.
  // Two rAFs ≈ wait until after first paint; short timeout keeps Activity stable for show().
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const delayMs = 100;
      setTimeout(() => {
        if (cancelled() || !isHomeRef.current) return;

        const attemptShow = (isRetry: boolean) => {
          if (cancelled() || !isHomeRef.current) return;
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
 * the user is still on the home screen (never during gameplay).
 */
export function AppOpenColdStart({ isOnHomeScreen }: Props) {
  const isHomeRef = useRef(isOnHomeScreen);
  isHomeRef.current = isOnHomeScreen;

  useEffect(() => {
    if (appOpenColdStartStarted) return;
    appOpenColdStartStarted = true;

    let removeListener: (() => void) | undefined;
    let cancelled = false;
    const sessionShown = { current: false };
    let loadErrorRetries = 0;
    let showPipelineScheduled = false;

    const isCancelled = () => cancelled;

    void (async () => {
      try {
        await ensureMobileAdsInitialized();
      } catch {
        return;
      }
      if (cancelled) return;

      let ad: AppOpenAd;
      try {
        ad = AppOpenAd.createForAdRequest(resolveAppOpenUnitId(), {
          ...AD_REQUEST_OPTIONS,
        });
      } catch {
        return;
      }

      removeListener = ad.addAdEventsListener(({ type }) => {
        if (type === AdEventType.ERROR) {
          if (sessionShown.current || cancelled) return;
          const next = loadErrorRetries + 1;
          if (next > 1) return;
          loadErrorRetries = next;
          setTimeout(() => {
            if (cancelled || sessionShown.current) return;
            try {
              ad.load();
            } catch {
              /* ignore */
            }
          }, 1200);
          return;
        }

        if (type !== AdEventType.LOADED) return;
        if (cancelled || sessionShown.current || !isHomeRef.current) return;
        if (showPipelineScheduled) return;
        showPipelineScheduled = true;

        deferShowAppOpen(ad, isHomeRef, isCancelled, () => {
          sessionShown.current = true;
        });
      });

      try {
        ad.load();
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  return null;
}
