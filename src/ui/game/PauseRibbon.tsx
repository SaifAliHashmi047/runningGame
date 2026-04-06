import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";
import { colors, fontUi } from "../home/theme";

type Props = { visible: boolean };

/**
 * Non-blocking pause hint — does not intercept touches (pause/resume stays on HUD).
 */
function PauseRibbonInner({ visible }: Props) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.host} pointerEvents="none">
      <View style={styles.pill}>
        <Text style={styles.title}>Paused</Text>
        <Text style={styles.sub}>Tap resume when you are ready</Text>
      </View>
    </Animated.View>
  );
}

export default memo(PauseRibbonInner);

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "22%",
    alignItems: "center",
    zIndex: 45,
  },
  pill: {
    paddingVertical: heightPixel(10),
    paddingHorizontal: scale(20),
    borderRadius: scale(999),
    backgroundColor: "rgba(8,12,24,0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
    alignItems: "center",
  },
  title: {
    color: colors.ice,
    fontWeight: "800",
    fontSize: fontPixel(12),
    letterSpacing: scale(2.4),
    fontFamily: fontUi.mono,
  },
  sub: {
    marginTop: heightPixel(4),
    color: colors.textTertiary,
    fontSize: fontPixel(11),
    fontWeight: "600",
  },
});
