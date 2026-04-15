import { Image } from "react-native";
import { ensureBackgroundMusicLoaded, getAudioManager } from "../audio";
import { SHOP_SKIN_ROWS } from "../game/heroSkinCatalog";
import { POWERUP_BITMAP } from "../game/assets/powers/powerupBitmaps";
import { COIN_TEXTURE } from "../assets/coins";
import { OBSTACLE_TEXTURE_SOURCES } from "../assets/obstacles";
import { GAMEPLAY_BACKGROUND } from "../ui/game/gameplayBackgroundAsset";
import { HOME_COSMIC_BACKGROUND } from "../ui/home/homeBackgroundAsset";

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`[boot] timeout: ${label}`));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function prefetchImageModule(mod: number, label: string): Promise<void> {
  const src = Image.resolveAssetSource(mod);
  if (!src?.uri) return Promise.resolve();
  return withTimeout(Image.prefetch(src.uri), 12_000, `prefetch:${label}`).then(
    () => undefined,
    () => undefined,
  );
}

/**
 * Warm critical bundled media before first interactive Home/Gameplay.
 * Designed to be "best effort" — failures should not brick the splash gate.
 */
export async function preloadAppAssets(): Promise<void> {
  const skinImages = SHOP_SKIN_ROWS.map((r) => r.image).filter(Boolean) as number[];

  const powerups = Object.values(POWERUP_BITMAP) as number[];

  const imageModules: Array<{ mod: number; label: string }> = [
    { mod: HOME_COSMIC_BACKGROUND, label: "home_cosmic_highway" },
    { mod: GAMEPLAY_BACKGROUND, label: "gameplay_futuristic_highway" },
    { mod: COIN_TEXTURE, label: "coin" },
    ...Object.entries(OBSTACLE_TEXTURE_SOURCES).map(([k, mod]) => ({
      mod,
      label: `obstacle:${k}`,
    })),
    ...powerups.map((mod, idx) => ({ mod, label: `powerup:${idx}` })),
    ...skinImages.map((mod, idx) => ({ mod, label: `skin:${idx}` })),
  ];

  await Promise.all([
    ...imageModules.map(({ mod, label }) => prefetchImageModule(mod, label)),
    withTimeout(getAudioManager().preload(), 20_000, "sfx:preload").catch(() => undefined),
    withTimeout(ensureBackgroundMusicLoaded(), 20_000, "bgm:ensure").catch(() => undefined),
  ]);
}
