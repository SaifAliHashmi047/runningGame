import React, { memo } from "react";
import { View, Image, StyleSheet } from "react-native";
import HeroHoverShip from "../../../components/HeroHoverShip";
import { heroImageForSkinId } from "../../game/heroSkinCatalog";
import { scale, heightPixel } from "../../../utils/responsive";

/** Match `App.tsx` gameplay hero aspect (56×60 design units). */
const GAMEPLAY_HERO_W = 56;
const GAMEPLAY_HERO_H = 60;

type Props = { skinId: string };

function HomeHeroPreviewInner({ skinId }: Props) {
  const img = heroImageForSkinId(skinId);
  const box = scale(100);
  const vectorH = Math.min(scale(GAMEPLAY_HERO_H), box);
  const vectorW = Math.round((GAMEPLAY_HERO_W / GAMEPLAY_HERO_H) * vectorH);

  if (img) {
    return (
      <View style={[styles.wrap, { width: box, height: box }]}>
        <Image source={img} style={styles.image} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: box, height: box }]}>
      <HeroHoverShip
        width={vectorW}
        height={vectorH}
        style={{ position: "relative", left: 0, bottom: 0 }}
      />
    </View>
  );
}

export default memo(HomeHeroPreviewInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    marginTop: heightPixel(4),
  },
});
