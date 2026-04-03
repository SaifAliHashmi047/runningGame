import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";
import { scale } from "../../../utils/responsive";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function HeroCard({ children, style }: Props) {
  const { scale, heightPixel } = useResponsive();
  return (
    <View
      style={[
        styles.root,
        {
          borderRadius: scale(radius.xl),
          paddingHorizontal: scale(18),
          paddingVertical: heightPixel(18),
        },
        style,
      ]}
    >
      <View style={styles.softLayer} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.card,
    borderWidth: scale(1),
    borderColor: colors.cardBorder,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.light,
  },
  softLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "46%",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
});

