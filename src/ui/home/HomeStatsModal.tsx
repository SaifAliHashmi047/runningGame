import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAudioManager } from "../../audio";
import { SHOP_SKIN_ROWS } from "../../game/heroSkinCatalog";
import {
  CURRENT_SKIN_KEY,
  OWNED_SKINS_KEY,
  SAVED_COINS_KEY,
  TOTAL_RUNS_KEY,
} from "../../storage/persistenceKeys";
import { scale } from "../../../utils/responsive";
import { colors, radius } from "./theme";
import { useResponsive } from "./useResponsive";

type Props = {
  visible: boolean;
  highScore: number;
  onClose: () => void;
};

function formatWithSpaces(n: number): string {
  const s = Math.floor(Math.max(0, n)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function HomeStatsModal({ visible, highScore, onClose }: Props) {
  const { scale, heightPixel, fontPixel } = useResponsive();
  const [totalRuns, setTotalRuns] = useState(0);
  const [savedCoins, setSavedCoins] = useState(0);
  const [skinsOwned, setSkinsOwned] = useState(0);
  const [equippedName, setEquippedName] = useState("—");

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const [rawRuns, rawCoins, rawOwned, rawCurrent] = await Promise.all([
          AsyncStorage.getItem(TOTAL_RUNS_KEY),
          AsyncStorage.getItem(SAVED_COINS_KEY),
          AsyncStorage.getItem(OWNED_SKINS_KEY),
          AsyncStorage.getItem(CURRENT_SKIN_KEY),
        ]);
        if (cancelled) return;
        const runs = rawRuns ? parseInt(rawRuns, 10) : 0;
        setTotalRuns(Number.isNaN(runs) ? 0 : runs);
        const coins = rawCoins != null ? parseInt(rawCoins, 10) : 0;
        setSavedCoins(Number.isNaN(coins) ? 0 : Math.max(0, coins));
        let ownedCount = 1;
        if (rawOwned) {
          try {
            const parsed = JSON.parse(rawOwned);
            if (Array.isArray(parsed)) ownedCount = parsed.length;
          } catch {
            /* ignore */
          }
        }
        setSkinsOwned(ownedCount);
        const skinId = rawCurrent || "classic";
        const row = SHOP_SKIN_ROWS.find((s) => s.id === skinId);
        setEquippedName(row?.name ?? skinId);
      } catch {
        if (!cancelled) {
          setTotalRuns(0);
          setSavedCoins(0);
          setSkinsOwned(1);
          setEquippedName("Classic");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const totalSkins = SHOP_SKIN_ROWS.length;

  return (
    <Modal
      transparent
      statusBarTranslucent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalCenter, { padding: scale(20) }]}>
          <View
            style={[
              styles.modalCard,
              {
                borderRadius: scale(radius.lg),
                paddingVertical: heightPixel(18),
                paddingHorizontal: scale(16),
                maxHeight: "78%",
              },
            ]}
          >
            <Text style={[styles.modalTitle, { fontSize: fontPixel(18) }]}>Your stats</Text>
            <Text style={[styles.modalSub, { fontSize: fontPixel(12), marginTop: heightPixel(4) }]}>
              Progress carries across runs
            </Text>

            <ScrollView
              style={{ marginTop: heightPixel(16), maxHeight: heightPixel(320) }}
              showsVerticalScrollIndicator={false}
            >
              <StatRow
                label="Best score"
                value={formatWithSpaces(highScore)}
                scale={scale}
                heightPixel={heightPixel}
                fontPixel={fontPixel}
              />
              <StatRow
                label="Runs played"
                value={formatWithSpaces(totalRuns)}
                scale={scale}
                heightPixel={heightPixel}
                fontPixel={fontPixel}
              />
              <StatRow
                label="Coin balance"
                value={formatWithSpaces(savedCoins)}
                scale={scale}
                heightPixel={heightPixel}
                fontPixel={fontPixel}
              />
              <StatRow
                label="Skins unlocked"
                value={`${skinsOwned} / ${totalSkins}`}
                scale={scale}
                heightPixel={heightPixel}
                fontPixel={fontPixel}
              />
              <StatRow
                label="Equipped ship"
                value={equippedName}
                emphasizeValue
                scale={scale}
                heightPixel={heightPixel}
                fontPixel={fontPixel}
              />
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  marginTop: heightPixel(16),
                  paddingVertical: heightPixel(12),
                  borderRadius: scale(radius.md),
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              onPress={() => {
                getAudioManager().playButtonTap();
                onClose();
              }}
            >
              <Text style={[styles.closeBtnText, { fontSize: fontPixel(14) }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StatRow({
  label,
  value,
  emphasizeValue,
  scale,
  heightPixel,
  fontPixel,
}: {
  label: string;
  value: string;
  emphasizeValue?: boolean;
  scale: (n: number) => number;
  heightPixel: (n: number) => number;
  fontPixel: (n: number) => number;
}) {
  return (
    <View
      style={[
        styles.statRow,
        {
          paddingVertical: heightPixel(10),
          paddingHorizontal: scale(12),
          marginBottom: heightPixel(8),
          borderRadius: scale(radius.sm),
        },
      ]}
    >
      <Text style={[styles.statLabel, { fontSize: fontPixel(12) }]}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          { fontSize: emphasizeValue ? fontPixel(13) : fontPixel(14) },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: scale(400),
    backgroundColor: colors.card,
    borderWidth: scale(1),
    borderColor: colors.cardBorder,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontWeight: "800",
    letterSpacing: 0.6,
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  modalSub: {
    color: colors.textTertiary,
    textAlign: "center",
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(12),
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statLabel: {
    color: colors.textSecondary,
    fontWeight: "700",
    flexShrink: 0,
  },
  statValue: {
    color: colors.accent,
    fontWeight: "800",
    textAlign: "right",
    flex: 1,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  closeBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,229,255,0.45)",
  },
  closeBtnText: {
    color: colors.textPrimary,
    fontWeight: "800",
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
