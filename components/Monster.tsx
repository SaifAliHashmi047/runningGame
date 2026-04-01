import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type Props = {
  width: number;
  height: number;
  color: string;
  style?: ViewStyle;
};

export default function Monster({ width, height, color, style }: Props) {
  return (
    <View style={[styles.wrap, style, { width }]}>
      <View style={[styles.body, { height, backgroundColor: color }]}>
        <View style={styles.eye} />
        <View style={styles.pupil} />
      </View>
      <View style={[styles.fin, { borderBottomColor: color, left: width * 0.1 }]} />
      <View style={styles.teethRow}>
        <View style={styles.tooth} />
        <View style={[styles.tooth, { marginLeft: 6 }]} />
        <View style={[styles.tooth, { marginLeft: 6 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
  },
  body: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.25)",
  },
  eye: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  pupil: {
    position: "absolute",
    top: 9,
    left: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000",
    opacity: 0.7,
  },
  fin: {
    position: "absolute",
    top: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  teethRow: {
    position: "absolute",
    bottom: -6,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  tooth: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
});

