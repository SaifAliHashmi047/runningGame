import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { AD_REQUEST_OPTIONS, resolveBannerUnitId } from "./adUnitIds";
import { ensureMobileAdsInitialized } from "./mobileAdsInit";

/**
 * Small anchored adaptive banner for the home screen only (unmounts when navigating to the game).
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
        onAdFailedToLoad={() => setFailed(true)}
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
