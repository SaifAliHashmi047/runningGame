import React from "react";
import { View, StyleSheet } from "react-native";

type Props = {
  skyTopColor: string;
  skyMidColor: string;
  horizonOpacity?: number;
  phase?: number; // for parallax drift
  variant?: "day" | "sunset" | "night" | "dawn";
};

export default function Background({
  skyTopColor,
  skyMidColor,
  horizonOpacity = 0.35,
  phase = 0,
  variant = "day",
}: Props) {
  const cloudOffset1 = Math.sin(phase * 0.4) * 20;
  const cloudOffset2 = Math.cos(phase * 0.35) * 28;
  const isNight = variant === "night";
  return (
    <>
      <View style={[styles.skyTop, { backgroundColor: skyTopColor }]} />
      <View style={[styles.skyMid, { backgroundColor: skyMidColor }]} />
      <View style={[styles.horizon, { backgroundColor: `rgba(255,200,120,${horizonOpacity})` }]} />
      {!isNight ? (
        <View style={[styles.sun, { backgroundColor: variant === "sunset" ? "#ffad60" : "#ffd166" }]} />
      ) : (
        <View style={styles.moon} />
      )}
      {/* clouds */}
      <View style={[styles.cloud, { left: `12%`, top: "14%", transform: [{ translateX: cloudOffset1 }] }]} />
      <View
        style={[
          styles.cloud,
          { left: "58%", top: "10%", opacity: 0.85, transform: [{ translateX: cloudOffset2 }] },
        ]}
      />
      {/* stars at night */}
      {isNight && (
        <>
          <View style={[styles.star, { left: "18%", top: "12%" }]} />
          <View style={[styles.star, { left: "42%", top: "9%" }]} />
          <View style={[styles.star, { left: "67%", top: "16%" }]} />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  skyTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
  },
  skyMid: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    height: "22%",
  },
  horizon: {
    position: "absolute",
    top: "52%",
    left: 0,
    right: 0,
    height: 3,
  },
  sun: {
    position: "absolute",
    top: "8%",
    right: "10%",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffd166",
  },
  moon: {
    position: "absolute",
    top: "9%",
    right: "12%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
  },
  cloud: {
    position: "absolute",
    width: 72,
    height: 22,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  star: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
});

