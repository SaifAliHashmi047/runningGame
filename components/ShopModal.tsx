import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import Ship, { ShipVariant } from "./Ship";
import { fontPixel, heightPixel, scale } from "../utils/responsive";
import { getAudioManager } from "../src/audio";
import type { ShopSkinRow } from "../src/game/heroSkinCatalog";
import { skinMilestoneSatisfied } from "../src/game/milestoneUnlock";
import {
  getShopVideoCooldownRemainingMs,
  SHOP_REWARDED_COIN_GRANT,
  SHOP_VIDEO_MAX_PER_WINDOW,
} from "../src/ads/shopRewardedCoins";

type Props = {
  open: boolean;
  coins: number;
  ownedSkins: string[];
  currentSkin: string;
  skins: ShopSkinRow[];
  /** Personal bests for milestone progress (distance in meters, coins picked up in one run). */
  bestSingleRunDistanceM?: number;
  bestSingleRunCoins?: number;
  onClose: () => void;
  onBuyOrEquip: (
    skinId: string,
    price: number,
    variant: ShipVariant,
    hull: string,
    sail: string,
  ) => void;
  onWatchVideoForCoins?: () => void;
  videoRewardBusy?: boolean;
  controlButtonStyle: object;
  controlTextStyle: object;
};

export default function ShopModal({
  open,
  coins,
  ownedSkins,
  currentSkin,
  skins,
  bestSingleRunDistanceM = 0,
  bestSingleRunCoins = 0,
  onClose,
  onBuyOrEquip,
  onWatchVideoForCoins,
  videoRewardBusy = false,
  controlButtonStyle,
  controlTextStyle,
}: Props) {
  const { height: winH } = useWindowDimensions();
  const skinListMaxH = Math.min(heightPixel(400), winH * 0.42);
  const [videoCooldownMs, setVideoCooldownMs] = useState(0);

  useEffect(() => {
    if (!open || !onWatchVideoForCoins) {
      setVideoCooldownMs(0);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const r = await getShopVideoCooldownRemainingMs();
      if (!cancelled) setVideoCooldownMs(r);
    };
    void tick();
    const id = setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open, onWatchVideoForCoins]);

  const videoOnCooldown = videoCooldownMs > 0;
  const videoRowDisabled = videoRewardBusy || videoOnCooldown;

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
            <Text style={styles.modalTitle}>Ship skins</Text>
            <Text style={styles.modalSubTitle}>Coins {formatWithSpaces(coins)}</Text>

            {onWatchVideoForCoins ? (
              <Pressable
                style={({ pressed }) => [
                  styles.videoRewardRow,
                  {
                    opacity: videoRowDisabled ? 0.55 : pressed ? 0.75 : 1,
                  },
                ]}
                onPress={() => {
                  if (videoRowDisabled) return;
                  getAudioManager().playButtonTap();
                  onWatchVideoForCoins();
                }}
                disabled={videoRowDisabled}
              >
                {videoRewardBusy ? (
                  <ActivityIndicator color="#e0f2fe" size="small" />
                ) : (
                  <Text style={styles.videoRewardIcon}>▶</Text>
                )}
                <View style={styles.videoRewardTextCol}>
                  <Text style={styles.videoRewardTitle}>Watch video</Text>
                  {videoOnCooldown ? (
                    <Text style={styles.videoRewardCooldown}>
                      Next in {formatCooldownHms(videoCooldownMs)}
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.videoRewardSub}>
                        +{formatWithSpaces(SHOP_REWARDED_COIN_GRANT)} coins
                      </Text>
                      <Text style={styles.videoRewardHint}>
                        Up to {SHOP_VIDEO_MAX_PER_WINDOW} per 8h
                      </Text>
                    </>
                  )}
                </View>
              </Pressable>
            ) : null}

            <ScrollView
              style={[styles.skinListScroll, { maxHeight: skinListMaxH }]}
              contentContainerStyle={styles.skinListContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {skins.map((skin) => {
                const owned = ownedSkins.includes(skin.id);
                const equipped = currentSkin === skin.id;
                const mile = skin.milestone;
                const mileOk =
                  !mile ||
                  skinMilestoneSatisfied(
                    skin,
                    bestSingleRunDistanceM,
                    bestSingleRunCoins,
                  );
                const mileLocked = Boolean(mile) && !owned && !mileOk;
                const canClaimMile = Boolean(mile) && !owned && mileOk;
                const canCoinBuy = !mile && (owned || coins >= skin.price);
                return (
                  <View key={skin.id} style={styles.shopRow}>
                    <SkinThumb image={skin.image} variant={skin.variant} hull={skin.hull} sail={skin.sail} />
                    <View style={styles.rowMid}>
                      <Text style={styles.skinName} numberOfLines={1}>
                        {skin.name}
                      </Text>
                      {mile && !owned ? (
                        <Text style={styles.skinMileTag} numberOfLines={1}>
                          Milestone
                        </Text>
                      ) : null}
                      {!owned && (
                        <Text style={styles.skinPrice} numberOfLines={2}>
                          {mile
                            ? milestoneRequirementText(skin)
                            : `${formatWithSpaces(skin.price)} coins`}
                        </Text>
                      )}
                      {mile && !owned ? (
                        <Text style={styles.skinMileProg} numberOfLines={2}>
                          {typeof __DEV__ !== "undefined" && __DEV__
                            ? "Dev — tap Claim (prod thresholds shown above)"
                            : milestoneProgressText(
                                skin,
                                bestSingleRunDistanceM,
                                bestSingleRunCoins,
                              )}
                        </Text>
                      ) : null}
                      {owned && (
                        <Text style={styles.skinOwned} numberOfLines={2}>
                          {equipped ? "Equipped" : "Owned — tap Equip"}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.rowActionBtn,
                        controlButtonStyle,
                        {
                          marginLeft: 0,
                          backgroundColor: owned
                            ? "#22c55e"
                            : mileLocked
                              ? "#475569"
                              : canClaimMile
                                ? "#0ea5e9"
                                : "#f59e0b",
                          opacity: mileLocked
                            ? 0.72
                            : !owned && !canCoinBuy && !mile
                              ? 0.45
                              : pressed
                                ? 0.88
                                : 1,
                        },
                      ]}
                      disabled={mileLocked}
                      onPress={() => {
                        if (mileLocked) return;
                        if (!owned && !canCoinBuy && !canClaimMile) return;
                        getAudioManager().playButtonTap();
                        onBuyOrEquip(skin.id, skin.price, skin.variant, skin.hull, skin.sail);
                      }}
                    >
                      <Text style={[controlTextStyle, styles.rowActionLabel]} numberOfLines={1}>
                        {owned
                          ? equipped
                            ? "Equipped"
                            : "Equip"
                          : mile
                            ? mileLocked
                              ? "Locked"
                              : "Claim"
                            : "Buy"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                controlButtonStyle,
                { backgroundColor: "#6c5ce7", marginTop: heightPixel(14), opacity: pressed ? 0.88 : 1 },
              ]}
              onPress={() => {
                getAudioManager().playButtonTap();
                onClose();
              }}
            >
              <Text style={controlTextStyle}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SkinThumb({
  image,
  variant,
  hull,
  sail,
}: {
  image?: ImageSourcePropType;
  variant: ShipVariant;
  hull: string;
  sail: string;
}) {
  if (image) {
    return (
      <View style={styles.thumbBox}>
        <Image source={image} style={styles.thumbImage} resizeMode="contain" />
      </View>
    );
  }
  return (
    <View style={styles.thumbBox}>
      <Ship style={{ position: "relative", left: 0, bottom: 0 }} variant={variant} hullColor={hull} sailColor={sail} />
    </View>
  );
}

function formatWithSpaces(n: number): string {
  const s = Math.floor(Math.max(0, n)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function milestoneRequirementText(skin: ShopSkinRow): string {
  const m = skin.milestone;
  if (!m) return "";
  if (m.kind === "distance") {
    return `Reach ${formatWithSpaces(m.meters)} m in one run`;
  }
  return `Collect ${formatWithSpaces(m.coins)} coins in one run (pickups)`;
}

function milestoneProgressText(
  skin: ShopSkinRow,
  bestD: number,
  bestC: number,
): string {
  const m = skin.milestone;
  if (!m) return "";
  if (m.kind === "distance") {
    return `${formatWithSpaces(Math.min(bestD, m.meters))} / ${formatWithSpaces(m.meters)} m`;
  }
  return `${formatWithSpaces(Math.min(bestC, m.coins))} / ${formatWithSpaces(m.coins)} coins`;
}

function formatCooldownHms(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${h}:${pad(m)}:${pad(s)}`;
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
  videoRewardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: heightPixel(14),
    paddingVertical: heightPixel(12),
    paddingHorizontal: scale(12),
    borderRadius: scale(12),
    backgroundColor: "rgba(56,189,248,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(56,189,248,0.45)",
    gap: scale(12),
  },
  videoRewardIcon: {
    fontSize: fontPixel(20),
    color: "#7dd3fc",
    width: scale(28),
    textAlign: "center",
  },
  videoRewardTextCol: {
    flex: 1,
  },
  videoRewardTitle: {
    color: "#f0f9ff",
    fontWeight: "800",
    fontSize: fontPixel(15),
  },
  videoRewardSub: {
    marginTop: 2,
    color: "rgba(224,242,254,0.85)",
    fontSize: fontPixel(13),
    fontWeight: "600",
  },
  videoRewardHint: {
    marginTop: 3,
    color: "rgba(224,242,254,0.55)",
    fontSize: fontPixel(11),
    fontWeight: "600",
  },
  videoRewardCooldown: {
    marginTop: 4,
    color: "rgba(251,191,36,0.95)",
    fontSize: fontPixel(14),
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  skinListScroll: {
    width: "100%",
    marginTop: heightPixel(10),
  },
  skinListContent: {
    paddingBottom: heightPixel(4),
    gap: heightPixel(8),
  },
  shopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: heightPixel(10),
    paddingHorizontal: scale(8),
    paddingRight: scale(6),
    borderRadius: scale(10),
    gap: scale(6),
  },
  rowActionBtn: {
    flexShrink: 0,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    minWidth: scale(96),
    paddingHorizontal: scale(12),
    paddingVertical: heightPixel(10),
    borderRadius: scale(12),
  },
  rowActionLabel: {
    textAlign: "center",
  },
  thumbBox: {
    width: scale(64),
    height: heightPixel(52),
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbImage: {
    width: scale(56),
    height: heightPixel(48),
  },
  rowMid: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: scale(4),
  },
  skinName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fontPixel(15),
  },
  skinPrice: {
    color: "rgba(255,255,255,0.65)",
    fontSize: fontPixel(13),
    marginTop: 2,
  },
  skinOwned: {
    color: "rgba(255,255,255,0.45)",
    fontSize: fontPixel(12),
    marginTop: 2,
  },
  skinMileTag: {
    marginTop: 2,
    fontSize: fontPixel(10),
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(56,189,248,0.95)",
  },
  skinMileProg: {
    marginTop: 3,
    fontSize: fontPixel(12),
    fontWeight: "700",
    color: "rgba(251,191,36,0.95)",
    fontVariant: ["tabular-nums"],
  },
});
