import React, { memo } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { PowerUpKind } from "../../game/powers";
import { POWERUP_BITMAP } from "../../game/assets/powers/powerupBitmaps";

export type PowerUpIconProps = {
  kind: PowerUpKind;
  size: number;
  style?: StyleProp<ViewStyle>;
  /** Softer look for world pickups */
  ambient?: boolean;
};

function PowerUpIconInner({ kind, size, style, ambient = false }: PowerUpIconProps) {
  const pad = ambient ? Math.max(2, Math.round(size * 0.08)) : 0;
  const inner = size - pad * 2;
  const source = POWERUP_BITMAP[kind];

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <View style={[styles.art, ambient && styles.artAmbient]}>
        <Image
          source={source}
          style={{ width: inner, height: inner }}
          resizeMode="contain"
          fadeDuration={Platform.OS === "android" ? 0 : undefined}
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}

export default memo(PowerUpIconInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  art: {
    alignItems: "center",
    justifyContent: "center",
  },
  artAmbient: {
    opacity: 0.98,
  },
});
