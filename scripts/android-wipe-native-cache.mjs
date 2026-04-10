/**
 * Safe alternative to `cd android && ./gradlew clean` for RN New Architecture.
 * Gradle clean can fail with missing `.../codegen/jni` because CMake reconfigures
 * before library codegen outputs are restored.
 *
 * Usage: node scripts/android-wipe-native-cache.mjs
 * Then:  npx react-native run-android   (or gradlew assembleDebug)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function rm(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("removed:", dir);
}

const targets = [
  path.join(root, "android", "app", ".cxx"),
  path.join(root, "android", "app", "build"),
  path.join(root, "android", "build"),
];

for (const d of targets) {
  if (fs.existsSync(d)) rm(d);
}

console.log("Done. Rebuild with: npx react-native run-android");
