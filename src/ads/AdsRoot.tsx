import React, { useEffect } from "react";
import { AppOpenColdStart } from "./AppOpenColdStart";
import { ensureMobileAdsInitialized } from "./mobileAdsInit";
import { preparePlayInterstitial } from "./playInterstitial";

type Props = {
  isHome: boolean;
  /** App-open (and other full-screen promos) must wait until splash has finished. */
  canPresentAppOpen: boolean;
};

/**
 * Root-level ad wiring: no layout, no gameplay hooks. Mount once next to the app shell.
 * Start Mobile Ads init immediately so home banner + app-open load aren’t blocked behind it.
 */
export function AdsRoot({ isHome, canPresentAppOpen }: Props) {
  useEffect(() => {
    void ensureMobileAdsInitialized();
  }, []);

  useEffect(() => {
    if (isHome) preparePlayInterstitial();
  }, [isHome]);

  return <AppOpenColdStart isOnHomeScreen={isHome} canPresentAppOpen={canPresentAppOpen} />;
}
