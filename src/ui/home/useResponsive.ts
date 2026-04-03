import { useWindowDimensions } from "react-native";
import {
  fontPixel,
  heightPixel,
  moderateScale,
  scale,
  screenHeight,
  screenWidth,
} from "../../../utils/responsive";

/**
 * Live window from RN; `scale` / `heightPixel` / `fontPixel` match `utils/responsive` (375×812 baseline).
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return { width, height, scale, heightPixel, fontPixel, moderateScale };
}

export { screenHeight, screenWidth };
