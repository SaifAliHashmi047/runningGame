import type { MutableRefObject } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { EntityPosMap } from "../../ui/game/entityPositions";

/** Hard caps — spawn paths skip when full (reduces collision + draw cost). */
export const MAX_ACTIVE_OBSTACLES = 22;
export const MAX_ACTIVE_COINS = 38;
export const MAX_ACTIVE_POWERUPS = 5;

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
  aliveReuse: MutableRefObject<Set<number>>,
  sv: SharedValue<EntityPosMap>
): void {
  const m = scratch.current;
  const alive = aliveReuse.current;
  alive.clear();
  for (let i = 0; i < n; i++) {
    alive.add(items[i].id);
  }
  for (const k of Object.keys(m)) {
    const id = Number(k);
    if (!alive.has(id)) delete m[id];
  }
  for (let i = 0; i < n; i++) {
    const e = items[i];
    const { x, y } = pickXY(e);
    // New object each frame so Reanimated 4 worklets see updates (in-place mutate + shallow
    // spread on the map alone can leave UI-thread reads stale).
    m[e.id] = { x, y };
  }
  sv.value = { ...m };
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
