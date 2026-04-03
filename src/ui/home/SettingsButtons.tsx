import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius } from "./theme";
import { useResponsive } from "./useResponsive";
import { scale } from "../../../utils/responsive";

type Props = {
  onSettings?: () => void;
  onAudio?: () => void;
  muted?: boolean;
};

export default function SettingsButtons({ onSettings, onAudio, muted = false }: Props) {
  const { scale } = useResponsive();
  return (
    <View style={styles.root}>
      <TouchableOpacity
        onPress={onAudio}
        style={[styles.btn, { width: scale(38), height: scale(38), borderRadius: scale(radius.pill) }]}
        activeOpacity={0.9}
      />
      <TouchableOpacity
        onPress={onSettings}
        style={[styles.btn, { width: scale(38), height: scale(38), borderRadius: scale(radius.pill), marginLeft: scale(10) }]}
        activeOpacity={0.9}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  btn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: scale(1),
    borderColor: "rgba(255,255,255,0.2)",
  },
});

