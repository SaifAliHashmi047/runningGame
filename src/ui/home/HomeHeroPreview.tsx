import React, { memo } from "react";
import { View, Image, StyleSheet } from "react-native";
import Ship from "../../../components/Ship";
import { heroImageForSkinId, SHOP_SKIN_ROWS } from "../../game/heroSkinCatalog";
import { scale, heightPixel } from "../../../utils/responsive";

type Props = { skinId: string };

function HomeHeroPreviewInner({ skinId }: Props) {
  const row = SHOP_SKIN_ROWS.find((r) => r.id === skinId);
  const img = heroImageForSkinId(skinId);
  const box = scale(100);

  if (img) {
    return (
      <View style={[styles.wrap, { width: box, height: box }]}>
        <Image source={img} style={styles.image} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: box, height: box }]}>
      <Ship
        style={{ position: "relative", left: 0, bottom: 0 }}
        variant={row?.variant ?? "classic"}
        hullColor={row?.hull ?? "#8b4513"}
        sailColor={row?.sail ?? "#f1f5f9"}
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
