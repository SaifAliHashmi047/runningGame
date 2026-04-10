import React, { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { fontPixel, heightPixel, scale } from "../../../utils/responsive";
import { colors, fontUi, overlay, radius, shadow } from "../home/theme";

export type GameOverOverlayProps = {
  score: number;
  runDistance: number;
  coinsCollected: number;
  pickupScore: number;
  reviveVideoBusy: boolean;
  onReviveVideo: () => void;
  onRetry: () => void;
  onExitToHome: () => void;
  /** Let touches outside the card reach the HUD (e.g. skins) while keeping the card interactive. */
  passThroughOutsideCard?: boolean;
};

function GameOverOverlayInner({
  score,
  runDistance,
  coinsCollected,
  pickupScore,
  reviveVideoBusy,
  onReviveVideo,
  onRetry,
  onExitToHome,
  passThroughOutsideCard = true,
}: GameOverOverlayProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={styles.scrim}
      pointerEvents={passThroughOutsideCard ? "box-none" : "auto"}
    >
      <Animated.View
        entering={FadeInDown.duration(340).delay(30)}
        style={styles.cardShell}
        pointerEvents="auto"
      >
        <LinearGradient
          colors={["rgba(0,229,255,0.55)", "rgba(0,229,255,0.08)", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.accentTop}
          pointerEvents="none"
        />
        <View style={styles.card}>
          <Text style={styles.kicker}>Run ended</Text>
          <Text style={styles.scoreLabel}>Total score</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>

          <View style={styles.stats}>
            <StatRow label="Distance" value={`${Math.floor(runDistance).toLocaleString()} m`} />
            <StatRow label="Coins" value={coinsCollected.toLocaleString()} />
            <StatRow label="Bonus" value={`+${pickupScore.toLocaleString()}`} />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.revive,
                { opacity: reviveVideoBusy ? 0.75 : pressed ? 0.9 : 1 },
              ]}
              onPress={onReviveVideo}
              disabled={reviveVideoBusy}
            >
              <View style={styles.reviveIcon}>
                {reviveVideoBusy ? (
                  <ActivityIndicator color={colors.ice} size="small" />
                ) : (
                  <Text style={styles.playGlyph}>▶</Text>
                )}
              </View>
              <View style={styles.reviveCopy}>
                <Text style={styles.reviveTitle}>Continue with video</Text>
                <Text style={styles.reviveSub}>Same run · score & position</Text>
              </View>
            </Pressable>

            <View style={styles.rowBtns}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnPrimary,
                  shadow.light,
                  { opacity: pressed ? 0.92 : 1 },
                ]}
                onPress={onRetry}
              >
                <Text style={styles.btnPrimaryText}>Retry</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnGhost,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
                onPress={onExitToHome}
              >
                <Text style={styles.btnGhostText}>Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default memo(GameOverOverlayInner);

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: overlay.scrim,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(22),
  },
  cardShell: {
    width: "100%",
    maxWidth: scale(352),
    borderRadius: scale(radius.lg + 2),
    overflow: "hidden",
    ...shadow.heavy,
  },
  accentTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: heightPixel(4),
    zIndex: 2,
  },
  card: {
    width: "100%",
    paddingTop: heightPixel(26),
    paddingBottom: heightPixel(22),
    paddingHorizontal: scale(22),
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    alignItems: "center",
  },
  kicker: {
    fontSize: fontPixel(11),
    letterSpacing: scale(3.2),
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: heightPixel(6),
    fontFamily: fontUi.mono,
  },
  scoreLabel: {
    fontSize: fontPixel(12),
    letterSpacing: scale(1.8),
    color: colors.textTertiary,
    marginBottom: heightPixel(4),
    textTransform: "uppercase",
    fontWeight: "600",
    fontFamily: fontUi.mono,
  },
  scoreValue: {
    fontSize: fontPixel(38),
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: heightPixel(16),
    fontVariant: ["tabular-nums"],
    fontFamily: fontUi.mono,
  },
  stats: {
    width: "100%",
    marginBottom: heightPixel(18),
    paddingTop: heightPixel(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    gap: heightPixel(4),
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: heightPixel(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(radius.sm),
    backgroundColor: colors.surfaceRow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  statLabel: {
    fontSize: fontPixel(13),
    color: colors.textSecondary,
    fontWeight: "600",
    fontFamily: fontUi.mono,
  },
  statValue: {
    fontSize: fontPixel(14),
    fontWeight: "800",
    color: colors.ice,
    fontVariant: ["tabular-nums"],
    fontFamily: fontUi.mono,
  },
  actions: {
    width: "100%",
    gap: heightPixel(12),
  },
  revive: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    paddingVertical: heightPixel(13),
    paddingHorizontal: scale(14),
    borderRadius: scale(radius.md),
    backgroundColor: "rgba(56,189,248,0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
  },
  reviveIcon: {
    width: scale(34),
    height: scale(34),
    alignItems: "center",
    justifyContent: "center",
  },
  playGlyph: {
    fontSize: fontPixel(18),
    color: colors.sky,
    textAlign: "center",
  },
  reviveCopy: {
    flex: 1,
  },
  reviveTitle: {
    color: colors.ice,
    fontWeight: "800",
    fontSize: fontPixel(14),
    letterSpacing: 0.2,
  },
  reviveSub: {
    marginTop: heightPixel(3),
    color: "rgba(224,242,254,0.72)",
    fontSize: fontPixel(12),
    fontWeight: "600",
  },
  rowBtns: {
    flexDirection: "row",
    width: "100%",
    gap: scale(10),
    justifyContent: "center",
  },
  btn: {
    flex: 1,
    maxWidth: scale(152),
    paddingVertical: heightPixel(14),
    paddingHorizontal: scale(14),
    borderRadius: scale(radius.md),
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: colors.green,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fontPixel(15),
    letterSpacing: 0.4,
    fontFamily: fontUi.mono,
  },
  btnGhost: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  btnGhostText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: fontPixel(15),
    letterSpacing: 0.3,
    fontFamily: fontUi.mono,
  },
});
