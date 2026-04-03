import React from "react";
import { ReducedMotionConfig, ReduceMotion } from "react-native-reanimated";

/**
 * Reanimated reads reduced motion from a process-wide flag. During a run, gameplay
 * depends on continuous motion (hero FX, obstacles, day cycle, pickup flashes, etc.);
 * snapping those to end values feels broken even when frame rate is fine.
 *
 * Mount this only while the play session UI is active. On unmount, Reanimated
 * restores the previous flag so menus and home chrome can still honor
 * {@link ReduceMotion.System}.
 */
export function GameplayReducedMotion() {
  return <ReducedMotionConfig mode={ReduceMotion.Never} />;
}

/** Use when an explicit `reduceMotion` option is required (e.g. layout builders). */
export const GAMEPLAY_REDUCE_MOTION = ReduceMotion.Never;
