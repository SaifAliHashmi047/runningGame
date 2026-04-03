import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, ImageBackground, ImageSourcePropType, ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";

export type BackgroundType = "solid" | "gradient" | "image";

export interface BackgroundWrapperProps {
  type?: BackgroundType;
  solidColor?: string;
  colors?: string[];
  imageSource?: ImageSourcePropType;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  children?: React.ReactNode;
  transitionMs?: number;
}

/**
 * BackgroundWrapper
 * - Renders a background (solid | gradient | image) behind its children
 * - Crossfades smoothly when background props change
 * - Keeps content layer separate for easy reuse across screens
 */
export default function BackgroundWrapper({
  type = "solid",
  solidColor = "#0b1730",
  colors = ["#0b1730", "#1b3358"],
  imageSource,
  style,
  contentContainerStyle,
  children,
  transitionMs = 300,
}: BackgroundWrapperProps) {
  const [prevConfig, setPrevConfig] = useState<{ type: BackgroundType; solidColor: string; colors: string[]; imageSource?: ImageSourcePropType } | null>(null);
  const [currConfig, setCurrConfig] = useState<{ type: BackgroundType; solidColor: string; colors: string[]; imageSource?: ImageSourcePropType }>({
    type,
    solidColor,
    colors,
    imageSource,
  });

  const fadeIn = useSharedValue(1);
  const fadeOut = useSharedValue(0);

  const configKey = useMemo(() => {
    const imgKey = imageSource && (typeof imageSource === "number" ? String(imageSource) : (imageSource as any)?.uri ?? "img");
    return `${type}|${solidColor}|${colors.join(",")}|${imgKey ?? ""}`;
  }, [type, solidColor, colors, imageSource]);

  const lastKeyRef = useRef(configKey);

  useEffect(() => {
    if (lastKeyRef.current !== configKey) {
      // Start crossfade: current becomes previous, and new config fades in
      setPrevConfig(currConfig);
      setCurrConfig({ type, solidColor, colors, imageSource });
      fadeIn.value = 0;
      fadeOut.value = 1;
      fadeIn.value = withTiming(1, { duration: transitionMs, easing: Easing.out(Easing.cubic) });
      fadeOut.value = withTiming(0, { duration: transitionMs, easing: Easing.out(Easing.cubic) });
      lastKeyRef.current = configKey;
    }
  }, [configKey, type, solidColor, colors, imageSource, transitionMs, currConfig, fadeIn, fadeOut]);

  const currStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));
  const prevStyle = useAnimatedStyle(() => ({ opacity: fadeOut.value }));

  const renderBg = (cfg: { type: BackgroundType; solidColor: string; colors: string[]; imageSource?: ImageSourcePropType }) => {
    if (cfg.type === "image" && cfg.imageSource) {
      return (
        <ImageBackground source={cfg.imageSource} resizeMode="cover" style={styles.fill} imageStyle={styles.imageRound} />
      );
    }
    if (cfg.type === "gradient") {
      return <LinearGradient colors={cfg.colors.length ? cfg.colors : colors} style={styles.fill} />;
    }
    return <View style={[styles.fill, { backgroundColor: cfg.solidColor || solidColor }]} />;
  };

  return (
    <View style={[styles.root, style]}>
      {prevConfig && <Animated.View style={[styles.absolute, prevStyle]}>{renderBg(prevConfig)}</Animated.View>}
      <Animated.View style={[styles.absolute, currStyle]}>{renderBg(currConfig)}</Animated.View>
      <View style={[styles.content, contentContainerStyle]} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
  fill: {
    flex: 1,
  },
  imageRound: {
    // keeps defaults; customize if you want rounded corners
  },
  content: {
    flex: 1,
  },
});

