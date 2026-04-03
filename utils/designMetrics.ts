import { Dimensions, PixelRatio } from "react-native";

/** Baseline design width — keep in sync with `utils/responsive.ts`. */
export const BASE_WIDTH = 375;
/** Baseline design height — keep in sync with `utils/responsive.ts`. */
export const BASE_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Width-based scale (game + UI). Safe to use from plain TS modules (no cycles). */
export function widthDesignScale(size: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH / BASE_WIDTH) * size);
}

/** Height-based scale. */
export function heightDesignScale(size: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / BASE_HEIGHT) * size);
}

export const initialWindowWidth = SCREEN_WIDTH;
export const initialWindowHeight = SCREEN_HEIGHT;
