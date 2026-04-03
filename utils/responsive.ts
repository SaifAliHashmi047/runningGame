import { PixelRatio } from "react-native";
import {
  BASE_WIDTH,
  heightDesignScale,
  initialWindowHeight,
  initialWindowWidth,
  widthDesignScale,
} from "./designMetrics";

const SCREEN_WIDTH = initialWindowWidth;
const SCREEN_HEIGHT = initialWindowHeight;

/**
 * Scale by screen width — widths, horizontal spacing, borderRadius, icon sizes
 */
export const widthPixel = (size: number): number => widthDesignScale(size);

/**
 * Scale by screen height — heights, vertical spacing
 */
export const heightPixel = (size: number): number => heightDesignScale(size);

/**
 * Moderate scale for fonts — safer than pure width scaling
 */
export const fontPixel = (size: number, factor: number = 0.5): number => {
  const widthScale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (widthScale * size - size) * factor;
  return PixelRatio.roundToNearestPixel(newSize);
};

/** General scale based on width */
export const scale = (size: number): number => widthDesignScale(size);

/** Vertical scale based on height */
export const verticalScale = (size: number): number => heightDesignScale(size);

/**
 * Moderate scale — buttons, cards, inputs, radius (does not grow as aggressively)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaledSize = widthDesignScale(size);
  return PixelRatio.roundToNearestPixel(size + (scaledSize - size) * factor);
};

export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
