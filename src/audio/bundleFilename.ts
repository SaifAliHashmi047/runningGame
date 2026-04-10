import { Platform } from "react-native";

/**
 * Android resolves `res/raw` by base name only (no extension). iOS main bundle uses the full filename.
 */
export function mainBundleFilename(logicalFile: string): string {
  if (Platform.OS !== "android") return logicalFile;
  return logicalFile.replace(/\.(mp3|wav|m4a|ogg)$/i, "");
}
