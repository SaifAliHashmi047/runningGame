import React from "react";
import { View, Image, Text, StyleSheet, Platform } from "react-native";
import { assets, colors } from "./theme";
import { useResponsive } from "./useResponsive";

export default function TitleLogo() {
  const { scale, fontPixel, heightPixel } = useResponsive();
  return (
    <View style={styles.root}>
      <Image source={assets.logo} style={{ width: scale(200), height: scale(70), resizeMode: "contain" }} />
      <Text style={[styles.subtitle, { fontSize: fontPixel(12), marginTop: heightPixel(6) }]}>ARCADE RUNNER</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  subtitle: {
    color: colors.textTertiary,
    letterSpacing: 4,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});

