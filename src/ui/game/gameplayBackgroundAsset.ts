import { Image } from "react-native";

/** Bundled gameplay backdrop — keep a single `require` so prefetch + render share the same module id. */
export const GAMEPLAY_BACKGROUND = require("../../assets/bg/gameplay_futuristic_highway.jpg");

export function prefetchGameplayBackground(): Promise<boolean> {
  const src = Image.resolveAssetSource(GAMEPLAY_BACKGROUND);
  if (!src?.uri) return Promise.resolve(false);
  return Image.prefetch(src.uri);
}
