import AsyncStorage from "@react-native-async-storage/async-storage";
import { SHOP_SKIN_ROWS, type ShopSkinRow } from "./heroSkinCatalog";

export const BEST_SINGLE_RUN_DISTANCE_M_KEY = "@stackRunner/bestSingleRunDistanceM";
export const BEST_SINGLE_RUN_COINS_PICKUPS_KEY =
  "@stackRunner/bestSingleRunCoinsPickups";

export type BestSingleRunStats = { distanceM: number; runCoins: number };

export function skinMilestoneSatisfied(
  row: ShopSkinRow,
  bestDistanceM: number,
  bestRunCoins: number,
): boolean {
  const m = row.milestone;
  if (!m) return false;
  if (typeof __DEV__ !== "undefined" && __DEV__) return true;
  if (m.kind === "distance") return bestDistanceM >= m.meters;
  return bestRunCoins >= m.coins;
}

export function mergeMilestoneUnlocks(
  ownedIds: string[],
  bestDistanceM: number,
  bestRunCoins: number,
): string[] {
  const out = [...ownedIds];
  const set = new Set(ownedIds);
  for (const row of SHOP_SKIN_ROWS) {
    if (!row.milestone || set.has(row.id)) continue;
    if (!skinMilestoneSatisfied(row, bestDistanceM, bestRunCoins)) continue;
    out.push(row.id);
    set.add(row.id);
  }
  return out;
}

export async function loadBestSingleRunStats(): Promise<BestSingleRunStats> {
  try {
    const [d, c] = await Promise.all([
      AsyncStorage.getItem(BEST_SINGLE_RUN_DISTANCE_M_KEY),
      AsyncStorage.getItem(BEST_SINGLE_RUN_COINS_PICKUPS_KEY),
    ]);
    const distanceM = d != null ? parseInt(d, 10) : 0;
    const runCoins = c != null ? parseInt(c, 10) : 0;
    return {
      distanceM: Number.isNaN(distanceM) ? 0 : Math.max(0, distanceM),
      runCoins: Number.isNaN(runCoins) ? 0 : Math.max(0, runCoins),
    };
  } catch {
    return { distanceM: 0, runCoins: 0 };
  }
}

export async function persistBestSingleRunStats(
  stats: BestSingleRunStats,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      BEST_SINGLE_RUN_DISTANCE_M_KEY,
      String(stats.distanceM),
    );
    await AsyncStorage.setItem(
      BEST_SINGLE_RUN_COINS_PICKUPS_KEY,
      String(stats.runCoins),
    );
  } catch {
    /* ignore */
  }
}
