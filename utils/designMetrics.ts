/**
 * Shared layout metrics — implemented in `responsive.ts` to avoid drift.
 * `widthDesignScale` / `heightDesignScale` use **screen** size vs 375×812 (same as `widthPixel` / `heightPixel`).
 */
export {
  BASE_WIDTH,
  BASE_HEIGHT,
  waterGlassSize,
  initialWindowWidth,
  initialWindowHeight,
  widthPixel as widthDesignScale,
  heightPixel as heightDesignScale,
} from "./responsive";
