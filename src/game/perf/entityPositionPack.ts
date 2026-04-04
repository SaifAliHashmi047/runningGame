import type { MutableRefObject } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { EntityPosMap } from "../../ui/game/entityPositions";

/** Hard caps — spawn paths skip when full (reduces collision + draw cost). */
export const MAX_ACTIVE_OBSTACLES = 10;

/** Obstacles overlapping the play viewport at once (see `countObstaclesInPlayViewport`). */
export const MAX_ON_SCREEN_OBSTACLES = 4;
export const MAX_ACTIVE_COINS = 12;
export const MAX_ACTIVE_POWERUPS = 2;

/** Push score/distance to React this often at most (gameplay stays in refs / SharedValues). */
export const HUD_SCORE_THROTTLE_MS = 120;

/**
 * Reuses point objects, shallow-copies map into SharedValue for Reanimated (UI thread reads).
 * `n` = number of valid entries at the start of `items` (parallel visible buffer).
 */
export function packVisibleIntoEntityPosSV<T extends { id: number }>(
  items: readonly T[],
  n: number,
  pickXY: (t: T) => { x: number; y: number },
  scratch: MutableRefObject<EntityPosMap>,
  _aliveReuse: MutableRefObject<Set<number>>,
  sv: SharedValue<EntityPosMap>
): void {
  // Fresh map each frame: avoids Object.keys/delete + Set churn; Reanimated needs a new
  // `sv.value` reference so worklets pick up positions.
  const next: EntityPosMap = {};
  for (let i = 0; i < n; i++) {
    const e = items[i];
    const { x, y } = pickXY(e);
    next[e.id] = { x, y };
  }
  scratch.current = next;
  sv.value = next;
}

/** @deprecated Use packVisibleIntoEntityPosSV with pickXY identity */
export function packEntityPositionsIntoSV(
  entities: readonly { id: number; x: number; y: number }[],
  scratch: MutableRefObject<EntityPosMap>,
  aliveReuse: MutableRefObject<Set<number>>,
  sv: SharedValue<EntityPosMap>
): void {
  packVisibleIntoEntityPosSV(
    entities,
    entities.length,
    (e) => ({ x: e.x, y: e.y }),
    scratch,
    aliveReuse,
    sv
  );
}
