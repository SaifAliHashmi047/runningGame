import { useWindowDimensions } from "react-native";
import {
  fontPixel,
  heightPixel,
  hp,
  moderateScale,
  scale,
  screenHeight,
  screenWidth,
  wp,
} from "../../../utils/responsive";

/**
 * Live window from RN for layout; `scale` / `widthPixel` use **screen** vs 375×812; `wp` / `hp` use **window** %.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return { width, height, scale, heightPixel, fontPixel, moderateScale, wp, hp };
}

export { screenHeight, screenWidth };
