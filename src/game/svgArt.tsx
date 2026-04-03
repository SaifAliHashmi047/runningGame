import React from "react";
import { View, Image, StyleSheet } from "react-native";
import type { SvgProps } from "react-native-svg";
import { SvgUri } from "react-native-svg";

type SvgModule = React.ComponentType<SvgProps> | number;

export function GameSvgArt({ module: mod, width, height }: { module: SvgModule; width: number; height: number }) {
  if (typeof mod === "function") {
    const Cmp = mod;
    return <Cmp width={width} height={height} preserveAspectRatio="xMidYMid meet" />;
  }
  const resolved = Image.resolveAssetSource(mod);
  const uri = resolved?.uri ?? null;
  if (uri) {
    return (
      <SvgUri
        uri={uri}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        fallback={<View style={[styles.fallback, { width, height }]} />}
      />
    );
  }
  return <View style={[styles.fallback, { width, height }]} />;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: "transparent",
  },
});
