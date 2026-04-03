import { MAX_FRAME_SCALE, TARGET_FRAME_MS } from "../performanceConfig";

const MAX_SIM_SUBSTEPS = 5;

/**
 * Builds 60Hz-normalized step weights for this frame. Uses a fixed timestep bank so
 * multiple wall-clock frames of ~16.7ms become several k≈1 steps (stable physics).
 * If the bank is empty, applies one scaled step (variable timestep fallback).
 */
export function planSimulationSubsteps(
  bankMsRef: { current: number },
  dtMs: number,
  outKs: number[]
): void {
  outKs.length = 0;
  bankMsRef.current += dtMs;
  const cap = TARGET_FRAME_MS * MAX_SIM_SUBSTEPS;
  if (bankMsRef.current > cap) {
    bankMsRef.current = cap;
  }
  while (bankMsRef.current >= TARGET_FRAME_MS && outKs.length < MAX_SIM_SUBSTEPS) {
    bankMsRef.current -= TARGET_FRAME_MS;
    outKs.push(1);
  }
  if (outKs.length === 0) {
    outKs.push(Math.min(MAX_FRAME_SCALE, dtMs / TARGET_FRAME_MS));
  }
}

export function stepWallMsForK(k: number): number {
  return k * TARGET_FRAME_MS;
}
