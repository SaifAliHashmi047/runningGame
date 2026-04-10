import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
  Switch,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { getAudioManager } from "../../audio";
import { heightPixel, scale } from "../../../utils/responsive";
import { colors, fontUi, overlay, radius, shadow } from "./theme";
import { useResponsive } from "./useResponsive";

type Props = {
  visible: boolean;
  musicEnabled: boolean;
  onMusicChange: (enabled: boolean) => void;
  gyroSteeringEnabled: boolean;
  onGyroSteeringChange: (enabled: boolean) => void;
  onClose: () => void;
};

export default function HomeSettingsModal({
  visible,
  musicEnabled,
  onMusicChange,
  gyroSteeringEnabled,
  onGyroSteeringChange,
  onClose,
}: Props) {
  const { width: winW, height: winH } = useWindowDimensions();
  const { scale: rs, heightPixel: hp, fontPixel } = useResponsive();

  const cardMaxW = useMemo(
    () => Math.min(rs(400), winW - rs(24)),
    [rs, winW],
  );
  const horizontalPad = useMemo(
    () => Math.max(rs(14), Math.floor(winW * 0.06)),
    [rs, winW],
  );
  const verticalPad = useMemo(
    () => Math.max(hp(12), Math.floor(winH * 0.03)),
    [hp, winH],
  );

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
          <Animated.View entering={FadeIn.duration(180)} style={[styles.modalBackdrop, { backgroundColor: overlay.modalScrim }]} />
        </TouchableWithoutFeedback>
        <View
          style={[
            styles.modalCenter,
            {
              paddingHorizontal: horizontalPad,
              paddingVertical: verticalPad,
            },
          ]}
        >
          <Animated.View
            entering={FadeInDown.springify().damping(20).stiffness(220)}
            style={[styles.cardShell, shadow.heavy, { maxWidth: cardMaxW, width: "100%" }]}
          >
            <LinearGradient
              colors={["rgba(0,229,255,0.45)", "rgba(0,229,255,0.1)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.accentTop}
              pointerEvents="none"
            />
            <View
              style={[
                styles.modalCard,
                {
                  borderRadius: rs(radius.lg),
                  paddingVertical: hp(18),
                  paddingHorizontal: rs(16),
                },
              ]}
            >
              <Text style={[styles.modalTitle, { fontSize: fontPixel(18) }]}>Settings</Text>
              <Text style={[styles.modalSub, { fontSize: fontPixel(12), marginTop: hp(4) }]}>
                Audio and how you steer the ship during a run
              </Text>

              <View
                style={[
                  styles.row,
                  {
                    marginTop: hp(18),
                    paddingVertical: hp(14),
                    paddingHorizontal: rs(14),
                    paddingRight: rs(12),
                  },
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { fontSize: fontPixel(14) }]}>Music</Text>
                  <Text style={[styles.rowHint, { fontSize: fontPixel(11), marginTop: hp(4) }]}>
                    {musicEnabled ? "On" : "Off"}
                  </Text>
                </View>
                <Switch
                  value={musicEnabled}
                  onValueChange={(v) => {
                    getAudioManager().playButtonTap();
                    onMusicChange(v);
                  }}
                  trackColor={{ false: "rgba(255,255,255,0.2)", true: "rgba(56,189,248,0.55)" }}
                  thumbColor={musicEnabled ? colors.sky : colors.textTertiary}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              </View>

              <View
                style={[
                  styles.row,
                  {
                    marginTop: hp(10),
                    paddingVertical: hp(14),
                    paddingHorizontal: rs(14),
                    paddingRight: rs(12),
                  },
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { fontSize: fontPixel(14) }]}>Tilt steering</Text>
                  <Text style={[styles.rowHint, { fontSize: fontPixel(11), marginTop: hp(4) }]}>
                    {gyroSteeringEnabled
                      ? "Tilt — rotation sensor (stable)"
                      : "Manual — drag on the ship"}
                  </Text>
                </View>
                <Switch
                  value={gyroSteeringEnabled}
                  onValueChange={(v) => {
                    getAudioManager().playButtonTap();
                    onGyroSteeringChange(v);
                  }}
                  trackColor={{ false: "rgba(255,255,255,0.2)", true: "rgba(56,189,248,0.55)" }}
                  thumbColor={gyroSteeringEnabled ? colors.sky : colors.textTertiary}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    marginTop: hp(14),
                    paddingVertical: hp(14),
                    paddingHorizontal: rs(16),
                    borderRadius: rs(radius.md),
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
                onPress={() => {
                  getAudioManager().playButtonTap();
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.closeBtnText,
                    { fontSize: fontPixel(14), textAlign: "center", width: "100%" },
                  ]}
                >
                  Close
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardShell: {
    alignSelf: "center",
    borderRadius: scale(radius.lg),
    overflow: "hidden",
  },
  accentTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: heightPixel(4),
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontWeight: "800",
    letterSpacing: 0.6,
    textAlign: "center",
    fontFamily: fontUi.mono,
  },
  modalSub: {
    color: colors.textTertiary,
    textAlign: "center",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceRow,
    borderRadius: scale(radius.md),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  rowText: {
    flex: 1,
    marginRight: scale(12),
  },
  rowLabel: {
    color: colors.ice,
    fontWeight: "700",
    fontFamily: fontUi.mono,
  },
  rowHint: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  closeBtn: {
    alignSelf: "stretch",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderGlow,
  },
  closeBtnText: {
    color: colors.textPrimary,
    fontWeight: "800",
    letterSpacing: 0.8,
    fontFamily: fontUi.mono,
  },
});
