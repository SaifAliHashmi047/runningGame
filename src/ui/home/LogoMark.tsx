import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";

const LOGO_SRC = require("../../assets/brand/galaxy_runner_logo.png");

type Props = {
  size?: number;
  /** Raster logo already includes a badge; disk is optional (old SVG ship used it). */
  showBackgroundDisk?: boolean;
};

/**
 * Pixel box for the logo when `size` is the **longest** side (same convention as the old square SVG).
 */
export function resolveLogoMarkBox(size: number): { width: number; height: number } {
  const s = Math.max(1, Math.round(size));
  const meta = Image.resolveAssetSource(LOGO_SRC);
  const iw = meta.width;
  const ih = meta.height;
  if (!iw || !ih || iw <= 0 || ih <= 0) {
    return { width: s, height: s };
  }
  const aspect = iw / ih;
  if (aspect >= 1) {
    return { width: s, height: Math.max(1, Math.round(s / aspect)) };
  }
  return { width: Math.max(1, Math.round(s * aspect)), height: s };
}

export default function LogoMark({ size = 300, showBackgroundDisk = false }: Props) {
  const { width, height } = useMemo(() => resolveLogoMarkBox(size), [size]);

  return (
    <View style={[styles.wrap, { width, height }]}>
      {showBackgroundDisk ? <View style={styles.disk} /> : null}
      <Image
        source={LOGO_SRC}
        style={styles.image}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  disk: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    backgroundColor: "rgba(6,10,24,0.45)",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
});
