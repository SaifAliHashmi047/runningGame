import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontUi, gameCopy } from "./theme";
import { useResponsive } from "./useResponsive";

type IntroProps = { compact?: boolean };

function HomeIntroBlockInner({ compact = false }: IntroProps) {
  const { scale, fontPixel, heightPixel } = useResponsive();

  return (
    <View
      style={[
        styles.wrap,
        {
          marginTop: heightPixel(compact ? 8 : 18),
          paddingHorizontal: scale(6),
        },
      ]}
    >
      <View style={[styles.rule, { marginBottom: heightPixel(10) }]} />
      <Text style={[styles.label, { fontSize: fontPixel(10), letterSpacing: scale(3.2) }]}>{gameCopy.introLabel}</Text>
      <Text
        style={[
          styles.sub,
          {
            fontSize: fontPixel(compact ? 12 : 13),
            marginTop: heightPixel(compact ? 6 : 8),
            lineHeight: fontPixel(compact ? 17 : 19),
          },
        ]}
      >
        {gameCopy.introSub}
      </Text>
      <View style={[styles.rule, { marginTop: heightPixel(14) }]} />
    </View>
  );
}

export default memo(HomeIntroBlockInner);

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  rule: {
    width: "42%",
    maxWidth: 160,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(56,189,248,0.35)",
  },
  label: {
    color: colors.sky,
    fontWeight: "800",
    textAlign: "center",
    fontFamily: fontUi.mono,
  },
  sub: {
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
