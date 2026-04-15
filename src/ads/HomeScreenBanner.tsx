import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { AD_REQUEST_OPTIONS, resolveBannerUnitId } from "./adUnitIds";
import { ensureMobileAdsInitialized } from "./mobileAdsInit";

/**
 * Small anchored adaptive banner — home and gameplay (same AdMob unit); transparent native BG via patch.
 */
export function HomeScreenBanner() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void ensureMobileAdsInitialized();
  }, []);

  if (failed) return null;

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={resolveBannerUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ ...AD_REQUEST_OPTIONS }}
        onAdFailedToLoad={(e) => {
          if (__DEV__) console.warn("[Ads] Banner failed to load:", e);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
});
