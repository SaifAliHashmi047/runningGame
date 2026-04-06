import React, { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";
import HudPressable from "./HudPressable";
import { colors, fontUi } from "../home/theme";

type Props = {
  label?: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

const SIZE = scale(52);

/**
 * Left-side ability — same glass language as GameRunHud.
 */
function PowerActionButtonInner({
  label = "PWR",
  active = false,
  disabled = false,
  onPress,
}: Props) {
  const ring = active ? "rgba(0,229,255,0.55)" : "rgba(56,189,248,0.22)";

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <HudPressable disabled={disabled} onPress={onPress} style={styles.pressable}>
        <View style={[styles.ring, { borderColor: ring, opacity: disabled ? 0.4 : 1 }]} />
        <View style={[styles.core, { opacity: disabled ? 0.55 : 1 }]}>
          <LinearGradient
            colors={["rgba(255,255,255,0.09)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.coreEdge} pointerEvents="none" />
          <Text style={[styles.iconGlyph, { color: active ? colors.accent : colors.sky }]}>✦</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </HudPressable>
    </View>
  );
}

export default memo(PowerActionButtonInner);

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: scale(12),
    top: "42%",
    zIndex: 40,
  },
  pressable: {
    borderRadius: scale(999),
    overflow: "visible",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      default: { elevation: 8 },
    }),
  },
  ring: {
    position: "absolute",
    left: -scale(4),
    top: -scale(4),
    width: SIZE + scale(8),
    height: SIZE + scale(8),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  core: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.42)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(56,189,248,0.38)",
    overflow: "hidden",
  },
  coreEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    opacity: 0.5,
    margin: StyleSheet.hairlineWidth,
  },
  iconGlyph: {
    fontSize: fontPixel(17),
    marginTop: -heightPixel(3),
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  label: {
    marginTop: heightPixel(1),
    fontSize: fontPixel(7),
    letterSpacing: scale(2),
    color: "rgba(224,242,254,0.55)",
    fontWeight: "800",
    textTransform: "uppercase",
    fontFamily: fontUi.mono,
  },
});
