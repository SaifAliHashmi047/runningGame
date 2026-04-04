import React, { memo } from "react";
import { StyleSheet, View, Image } from "react-native";
import { useWindowDimensions } from "react-native";
import { APP_LOGO } from "../../assets/brand";
import { scale } from "../../../utils/responsive";

/**
 * ArcadeRunner title art — PNG with alpha so the day-cycle background shows through.
 */
function LogoMarkHeroInner() {
  const { width: winW } = useWindowDimensions();
  const src = Image.resolveAssetSource(APP_LOGO);
  const aspect = src?.width && src?.height ? src.width / src.height : 3;
  const maxW = Math.min(scale(300), winW - scale(40));
  const logoH = maxW / aspect;

  return (
    <View style={[styles.wrap, { width: maxW, height: logoH + scale(8) }]}>
      <View pointerEvents="none" style={[styles.softGlow, { width: maxW * 1.02, height: logoH * 1.08 }]} />
      <Image source={APP_LOGO} style={{ width: maxW, height: logoH }} resizeMode="contain" />
    </View>
  );
}

export default memo(LogoMarkHeroInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  softGlow: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(56,189,248,0.12)",
    borderRadius: scale(12),
  },
});
