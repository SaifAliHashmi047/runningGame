/**
 * Tilt steering via Reanimated sensors.
 *
 * Why ROTATION / GRAVITY instead of GYROSCOPE for tilt?
 * - GYROSCOPE reports angular *velocity* (rad/s): it drifts when integrated, is noisy, and does not
 *   directly encode “how far the phone is tilted”. It is great for spin detection, poor for stable tilt aim.
 * - ROTATION (rotation vector / fused attitude on native) exposes roll & pitch as orientation — stable,
 *   drift-corrected, and matches how players think about “tilt the device”.
 * - GRAVITY gives the gravity vector; tilting changes its x/y components predictably. Android docs
 *   recommend rotation vector + gravity for motion UIs; we use GRAVITY only when ROTATION is unavailable.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  clamp,
  type FrameInfo,
  runOnJS,
  SensorType,
  useAnimatedSensor,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { scale } from "../../utils/responsive";

/** Ignore tremor below ~1.4°; still small enough that intentional micro-tilts register. */
export const TILT_DEAD_ZONE_RAD = 0.025;
/** Roll (left/right): full stick at ~23° from neutral after dead zone. */
export const TILT_MAX_ROLL_RAD = 0.4;
/**
 * Pitch (forward/back / top toward or away from you): slightly tighter range so the same wrist motion
 * produces usable up/down speed without needing exaggerated nodding — pairs with TILT_PITCH_OUTPUT_GAIN.
 */
export const TILT_MAX_PITCH_RAD = 0.3;
/**
 * Curve mix: 1 = pure linear (best micro-precision), 0 = pure quadratic (too mushy for tiny tilts).
 * Linear-dominant keeps pinpoint control; a touch of quadratic caps strong tilts smoothly.
 */
export const TILT_CURVE_QUAD_MIX = 0.2;

/**
 * Reanimated pitch increases when the top of the phone tilts one way and decreases the other.
 * In portrait, **top of phone away from you** (“screen leans back”) vs **toward you** maps to vy sign.
 * If up/down feel reversed on your device, flip `TILT_PITCH_AXIS_SIGN` or `TILT_INVERT_Y`.
 */
export const TILT_PITCH_AXIS_SIGN = -1;

/** Fine extra gain on forward/back after shaping (keeps roll unchanged). Clamp prevents >1 stick. */
export const TILT_PITCH_OUTPUT_GAIN = 1.12;

/**
 * Exponential smoothing τ (seconds) — lower = snappier. Frame-rate stable via `1 - exp(-dt/τ)`.
 */
export const TILT_INPUT_TIME_CONSTANT_S = 0.038;
/** When |error| exceeds this (normalized), bump α so large tilts catch up quickly. */
export const TILT_SMOOTH_FAST_BLEND_THRESHOLD = 0.22;
export const TILT_SMOOTH_FAST_BLEND_MULT = 1.65;

/** Max steering speed at full deflection (px/s), roll axis. */
export const TILT_MAX_SPEED_PX_S = scale(440);
/** Slightly lower cap on vertical so forward/back does not overshoot playfield. */
export const TILT_MAX_SPEED_Y_PX_S = scale(400);

/** Maps gravity delta (m/s²-ish) into rad-like range before the same curve as roll/pitch. */
export const TILT_GRAVITY_TO_TILT_SCALE = 0.125;
/**
 * Gravity Y: same intent as pitch — top-away vs top-toward changes g.y. Sign must match rotation pitch feel.
 */
export const TILT_GRAVITY_PITCH_SIGN = -1;

/** Set to -1 to flip left/right if a device feels mirrored. */
export const TILT_INVERT_X = 1;
/** Set to -1 to flip up/down if pitch mapping is inverted on a specific device. */
export const TILT_INVERT_Y = 1;

/**
 * `runOnJS` every UI frame floods the RN JS thread (game loop + React) and causes hitching.
 * We integrate vx·dt on the UI thread and flush **batched pixel deltas** on a timer + urgent threshold.
 */
export const TILT_JS_FLUSH_MIN_DT_S = 0.026;
/** Flush immediately when accumulated |dx|+|dy| reaches this (keeps fast tilts snappy). */
export const TILT_JS_FLUSH_URGENT_DP = 5.5;
/** One flush cannot move more than this (px) — avoids a huge jump if JS stalls briefly. */
export const TILT_JS_FLUSH_MAX_MAG_DP = 52;
/** Native sensor sample period (ms). ~50 Hz is enough for tilt; eases native + worklet load vs `auto`. */
export const TILT_SENSOR_INTERVAL_MS = 20;

function shapeTiltU(u: number): number {
  "worklet";
  const k = TILT_CURVE_QUAD_MIX;
  return u * (1 - k) + u * u * k;
}

/** Signed delta (rad) → [-1, 1] with dead zone, per-axis max tilt, and linear-dominant curve for pinpoint control. */
function normalizeTiltSigned(delta: number, maxTiltRad: number): number {
  "worklet";
  const sign = delta < 0 ? -1 : 1;
  const abs = Math.abs(delta);
  if (abs <= TILT_DEAD_ZONE_RAD) return 0;
  const denom = maxTiltRad - TILT_DEAD_ZONE_RAD;
  const u = clamp((abs - TILT_DEAD_ZONE_RAD) / denom, 0, 1);
  return sign * shapeTiltU(u);
}

export type UseTiltSteeringControlArgs = {
  enabled: boolean;
  gameOver: boolean;
  /** Increment when a new run starts — clears calibration and smoothed input. */
  runSessionKey: number;
  /** Bump after layout (e.g. rAF) so `isAvailable` is reliable. */
  hardwareEpoch: number;
  /** Batched steering deltas in screen px (already clamp-ready for sim targets). */
  onSteerDelta: (dx: number, dy: number) => void;
};

export type UseTiltSteeringControlResult = {
  recenter: () => void;
  /** Steer via tilt this run (preference on + sensor available). */
  tiltControlActive: boolean;
  /** True when using gravity because rotation vector is unavailable. */
  usingGravityFallback: boolean;
};

export function useTiltSteeringControl({
  enabled,
  gameOver,
  runSessionKey,
  hardwareEpoch,
  onSteerDelta,
}: UseTiltSteeringControlArgs): UseTiltSteeringControlResult {
  const rotationSensor = useAnimatedSensor(SensorType.ROTATION, {
    interval: TILT_SENSOR_INTERVAL_MS,
    adjustToInterfaceOrientation: true,
  });
  const gravitySensor = useAnimatedSensor(SensorType.GRAVITY, {
    interval: TILT_SENSOR_INTERVAL_MS,
    adjustToInterfaceOrientation: true,
  });

  const onSteerDeltaRef = useRef(onSteerDelta);
  onSteerDeltaRef.current = onSteerDelta;

  const flushSteerDeltaJs = useCallback((dx: number, dy: number) => {
    onSteerDeltaRef.current(dx, dy);
  }, []);

  const enabledSV = useSharedValue(0);
  const activeModeSV = useSharedValue(0);
  const runEpochSV = useSharedValue(0);
  const lastRunEpochSV = useSharedValue(-1);
  const recenterGenSV = useSharedValue(0);
  const lastRecenterHandledSV = useSharedValue(0);

  const baseRoll = useSharedValue(0);
  const basePitch = useSharedValue(0);
  const baseGx = useSharedValue(0);
  const baseGy = useSharedValue(0);
  const calibratedSV = useSharedValue(0);
  const inputX = useSharedValue(0);
  const inputY = useSharedValue(0);
  const accDx = useSharedValue(0);
  const accDy = useSharedValue(0);
  const accFlushDt = useSharedValue(0);

  useEffect(() => {
    enabledSV.value = enabled ? 1 : 0;
  }, [enabled, enabledSV]);

  useEffect(() => {
    runEpochSV.value = runSessionKey;
  }, [runSessionKey, runEpochSV]);

  const rotationOk = rotationSensor.isAvailable;
  const gravityOk = gravitySensor.isAvailable;
  const sensorMode = rotationOk ? 0 : gravityOk ? 1 : 2;

  useEffect(() => {
    activeModeSV.value = sensorMode;
  }, [sensorMode, hardwareEpoch, activeModeSV]);

  const onTiltFrame = useCallback(
    (frame: FrameInfo) => {
      "worklet";
      if (enabledSV.value === 0) return;

      const mode = activeModeSV.value;
      if (mode === 2) return;

      const dt = Math.min(
        Math.max((frame.timeSincePreviousFrame ?? 16.67) / 1000, 0.001),
        0.064,
      );

      if (runEpochSV.value !== lastRunEpochSV.value) {
        lastRunEpochSV.value = runEpochSV.value;
        calibratedSV.value = 0;
        inputX.value = 0;
        inputY.value = 0;
        accDx.value = 0;
        accDy.value = 0;
        accFlushDt.value = 0;
      }

      if (recenterGenSV.value !== lastRecenterHandledSV.value) {
        lastRecenterHandledSV.value = recenterGenSV.value;
        if (mode === 0) {
          const { roll, pitch } = rotationSensor.sensor.value;
          baseRoll.value = roll;
          basePitch.value = pitch;
        } else {
          const { x, y } = gravitySensor.sensor.value;
          baseGx.value = x;
          baseGy.value = y;
        }
        calibratedSV.value = 1;
        inputX.value = 0;
        inputY.value = 0;
        accDx.value = 0;
        accDy.value = 0;
        accFlushDt.value = 0;
        return;
      }

      let rawX = 0;
      let rawY = 0;

      if (mode === 0) {
        const { roll, pitch } = rotationSensor.sensor.value;
        if (calibratedSV.value === 0) {
          baseRoll.value = roll;
          basePitch.value = pitch;
          calibratedSV.value = 1;
        }
        const rollDelta = (roll - baseRoll.value) * TILT_INVERT_X;
        rawX = normalizeTiltSigned(rollDelta, TILT_MAX_ROLL_RAD);

        const pitchDelta =
          (pitch - basePitch.value) * TILT_PITCH_AXIS_SIGN * TILT_INVERT_Y;
        rawY = clamp(
          normalizeTiltSigned(pitchDelta, TILT_MAX_PITCH_RAD) *
            TILT_PITCH_OUTPUT_GAIN,
          -1,
          1,
        );
      } else {
        const { x, y } = gravitySensor.sensor.value;
        if (calibratedSV.value === 0) {
          baseGx.value = x;
          baseGy.value = y;
          calibratedSV.value = 1;
        }
        const dx = (x - baseGx.value) * TILT_GRAVITY_TO_TILT_SCALE * TILT_INVERT_X;
        rawX = normalizeTiltSigned(dx, TILT_MAX_ROLL_RAD);

        const dy =
          (y - baseGy.value) *
          TILT_GRAVITY_TO_TILT_SCALE *
          TILT_GRAVITY_PITCH_SIGN *
          TILT_INVERT_Y;
        rawY = clamp(
          normalizeTiltSigned(dy, TILT_MAX_PITCH_RAD) * TILT_PITCH_OUTPUT_GAIN,
          -1,
          1,
        );
      }

      let alpha = 1 - Math.exp(-dt / TILT_INPUT_TIME_CONSTANT_S);
      alpha = Math.min(1, alpha);
      const errX = Math.abs(rawX - inputX.value);
      const errY = Math.abs(rawY - inputY.value);
      if (errX > TILT_SMOOTH_FAST_BLEND_THRESHOLD) {
        alpha = Math.min(1, alpha * TILT_SMOOTH_FAST_BLEND_MULT);
      }
      inputX.value = inputX.value + (rawX - inputX.value) * alpha;

      let alphaY = 1 - Math.exp(-dt / TILT_INPUT_TIME_CONSTANT_S);
      alphaY = Math.min(1, alphaY);
      if (errY > TILT_SMOOTH_FAST_BLEND_THRESHOLD) {
        alphaY = Math.min(1, alphaY * TILT_SMOOTH_FAST_BLEND_MULT);
      }
      inputY.value = inputY.value + (rawY - inputY.value) * alphaY;

      const vx = inputX.value * TILT_MAX_SPEED_PX_S;
      const vy = inputY.value * TILT_MAX_SPEED_Y_PX_S;

      accDx.value += vx * dt;
      accDy.value += vy * dt;
      accFlushDt.value += dt;

      const adx = accDx.value;
      const ady = accDy.value;
      const manhattan = Math.abs(adx) + Math.abs(ady);
      const urgent = manhattan >= TILT_JS_FLUSH_URGENT_DP;
      const periodic = accFlushDt.value >= TILT_JS_FLUSH_MIN_DT_S;

      if (urgent || periodic) {
        let fdx = adx;
        let fdy = ady;
        accDx.value = 0;
        accDy.value = 0;
        accFlushDt.value = 0;

        if (!urgent && Math.abs(fdx) < 0.12 && Math.abs(fdy) < 0.12) {
          return;
        }

        const mag = Math.sqrt(fdx * fdx + fdy * fdy);
        if (mag > TILT_JS_FLUSH_MAX_MAG_DP && mag > 0) {
          const s = TILT_JS_FLUSH_MAX_MAG_DP / mag;
          fdx *= s;
          fdy *= s;
        }

        runOnJS(flushSteerDeltaJs)(fdx, fdy);
      }
    },
    [flushSteerDeltaJs, gravitySensor.sensor, rotationSensor.sensor],
  );

  const frameCb = useFrameCallback(onTiltFrame, false);

  useEffect(() => {
    const active = enabled && !gameOver && sensorMode !== 2;
    frameCb.setActive(active);
  }, [enabled, gameOver, sensorMode, hardwareEpoch, frameCb]);

  const recenter = useCallback(() => {
    recenterGenSV.value = recenterGenSV.value + 1;
  }, [recenterGenSV]);

  const tiltControlActive = enabled && sensorMode !== 2;
  const usingGravityFallback = tiltControlActive && !rotationOk && gravityOk;

  return useMemo(
    () => ({
      recenter,
      tiltControlActive,
      usingGravityFallback,
    }),
    [recenter, tiltControlActive, usingGravityFallback],
  );
}
