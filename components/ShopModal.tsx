import React from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, Modal } from "react-native";
import Ship, { ShipVariant } from "./Ship";
import { fontPixel, heightPixel, scale } from "../utils/responsive";

type Skin = { id: string; name: string; price: number; variant: ShipVariant; hull: string; sail: string };

type Props = {
  open: boolean;
  coins: number;
  ownedSkins: string[];
  currentSkin: string;
  skins: Skin[];
  onClose: () => void;
  onBuyOrEquip: (skinId: string, price: number, variant: ShipVariant, hull: string, sail: string) => void;
  controlButtonStyle: any;
  controlTextStyle: any;
};

export default function ShopModal({
  open,
  coins,
  ownedSkins,
  currentSkin,
  skins,
  onClose,
  onBuyOrEquip,
  controlButtonStyle,
  controlTextStyle,
}: Props) {
  return (
    <Modal
      transparent
      statusBarTranslucent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalCenter}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Customize Ship</Text>
            <Text style={styles.modalSubTitle}>Coins {formatWithSpaces(coins)}</Text>
            <View style={{ width: "100%", marginTop: heightPixel(12) }}>
              {skins.map((skin) => {
                const owned = ownedSkins.includes(skin.id);
                const equipped = currentSkin === skin.id;
                return (
                  <View key={skin.id} style={styles.shopRow}>
                    <View style={{ width: scale(64), height: heightPixel(48), justifyContent: "center" }}>
                      <Ship style={{ position: "relative", left: 0, bottom: 0 }} variant={skin.variant} hullColor={skin.hull} sailColor={skin.sail} />
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: scale(8) }}>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: fontPixel(15) }}>{skin.name}</Text>
                      {!owned && (
                        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: fontPixel(13) }}>{formatWithSpaces(skin.price)} coins</Text>
                      )}
                      {owned && (
                        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: fontPixel(12) }}>{equipped ? "Equipped" : "Owned"}</Text>
                      )}
                    </View>
                    <View style={[controlButtonStyle, { backgroundColor: owned ? "#22c55e" : "#f59e0b" }]}>
                      <Text onPress={() => onBuyOrEquip(skin.id, skin.price, skin.variant, skin.hull, skin.sail)} style={controlTextStyle}>
                        {owned ? (equipped ? "Equip✓" : "Equip") : "Buy"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={[controlButtonStyle, { backgroundColor: "#6c5ce7", marginTop: heightPixel(16) }]}>
              <Text onPress={onClose} style={controlTextStyle}>
                Close
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatWithSpaces(n: number): string {
  const s = Math.floor(Math.max(0, n)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  modalCard: {
    width: "100%",
    maxWidth: scale(420),
    borderRadius: scale(18),
    backgroundColor: "rgba(18,26,42,0.98)",
    paddingVertical: heightPixel(18),
    paddingHorizontal: scale(16),
    borderWidth: scale(1),
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.35,
    shadowRadius: scale(24),
    elevation: 10,
  },
  modalTitle: {
    fontSize: fontPixel(18),
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  modalSubTitle: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(13),
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  shopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: heightPixel(8),
    paddingHorizontal: scale(10),
    borderRadius: scale(10),
    marginTop: heightPixel(8),
  },
});

