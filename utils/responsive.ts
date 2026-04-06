import { Dimensions, PixelRatio } from "react-native";

/** Design baseline width (iPhone logical width reference). */
export const BASE_WIDTH = 375;
/** Design baseline height — matches common 812pt tall-phone reference. */
export const BASE_HEIGHT = 812;

/** Arbitrary design token from shared app pattern (unused here unless imported). */
export const waterGlassSize = 250;

const _windowAtLoad = Dimensions.get("window");
const _screenAtLoad = Dimensions.get("screen");

/**
 * Physical screen size at module load (`Dimensions.get("screen")`).
 * Used with BASE_WIDTH / BASE_HEIGHT for scale ratios (iOS + Android).
 */
export const SCREEN_WIDTH = _screenAtLoad.width;
export const SCREEN_HEIGHT = _screenAtLoad.height;

/**
 * Logical window at module load (`Dimensions.get("window")`).
 * For live values during layout / rotation, call `readWindow()` or use `wp` / `hp`.
 */
export const WINDOW_WIDTH = _windowAtLoad.width;
export const WINDOW_HEIGHT = _windowAtLoad.height;

/** Legacy: window at load — game sim lane bounds in `App.tsx`. */
export const initialWindowWidth = _windowAtLoad.width;
export const initialWindowHeight = _windowAtLoad.height;
/** @deprecated Legacy names — same as window drawable area at load, not `SCREEN_*`. */
export const screenWidth = _windowAtLoad.width;
export const screenHeight = _windowAtLoad.height;

function readWindow() {
  return Dimensions.get("window");
}

function readScreen() {
  return Dimensions.get("screen");
}

/** Percent of current window width (0–100). iOS + Android safe. */
export const wp = (p: number) => readWindow().width * (p / 100);

/** Percent of current window height (0–100). */
export const hp = (p: number) => readWindow().height * (p / 100);

function normalize(size: number, based: "width" | "height" = "width"): number {
  const { width: sw, height: sh } = readScreen();
  const widthBaseScale = sw / BASE_WIDTH;
  const heightBaseScale = sh / BASE_HEIGHT;
  const newSize = based === "height" ? size * heightBaseScale : size * widthBaseScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export const widthPixel = (size: number) => normalize(size, "width");
export const heightPixel = (size: number) => normalize(size, "height");
export const fontPixel = (size: number) => heightPixel(size);

/** Width-normalized size (alias of `widthPixel`). */
export const scale = (size: number) => widthPixel(size);

/** Height-normalized size (alias of `heightPixel`). */
export const verticalScale = (size: number) => heightPixel(size);

export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaled = widthPixel(size);
  return PixelRatio.roundToNearestPixel(size + (scaled - size) * factor);
};
