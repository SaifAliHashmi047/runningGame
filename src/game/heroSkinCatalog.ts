import type { ImageSourcePropType } from "react-native";
import type { ShipVariant } from "../../components/Ship";

export type ShopSkinMilestone =
  | { kind: "distance"; meters: number }
  | { kind: "runCoins"; coins: number };

export type ShopSkinRow = {
  id: string;
  name: string;
  price: number;
  variant: ShipVariant;
  hull: string;
  sail: string;
  /** Purchasable PNG hero — when set, in-game uses this image instead of the vector SVG ship. */
  image?: ImageSourcePropType;
  /** When set, skin is earned by beating this milestone (not sold for coins). */
  milestone?: ShopSkinMilestone;
};

export const SHOP_SKIN_ROWS: ShopSkinRow[] = [
  {
    id: "classic",
    name: "Classic",
    price: 0,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
  },
  {
    id: "hero_shuttle",
    name: "Orbiter Shuttle",
    price: 22_000,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
    image: require("../assets/skins/hero_shuttle.png"),
  },
  {
    id: "hero_vector_prime",
    name: "Vector Prime",
    price: 24_000,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
    image: require("../assets/skins/hero_vector_prime.png"),
  },
  {
    id: "hero_apex_blue",
    name: "Apex Blue",
    price: 26_000,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
    image: require("../assets/skins/hero_apex_blue.png"),
  },
  {
    id: "hero_neon_striker",
    name: "Neon Striker",
    price: 28_000,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
    image: require("../assets/skins/hero_neon_striker.png"),
  },
  {
    id: "hero_milestone_ufo_teal",
    name: "Scout Saucer",
    price: 0,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
    image: require("../assets/skins/hero_milestone_ufo_teal.png"),
    milestone: { kind: "runCoins", coins: 800 },
  },
  {
    id: "hero_milestone_tie_scout",
    name: "Void Interceptor",
    price: 0,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
    image: require("../assets/skins/hero_milestone_tie_scout.png"),
    milestone: { kind: "distance", meters: 12_000 },
  },
  {
    id: "hero_milestone_ufo_purple",
    name: "Aurora Lifter",
    price: 0,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
    image: require("../assets/skins/hero_milestone_ufo_purple.png"),
    milestone: { kind: "runCoins", coins: 1_600 },
  },
  {
    id: "hero_milestone_ufo_alien",
    name: "Visitor One",
    price: 0,
    variant: "classic",
    hull: "#8b4513",
    sail: "#f1f5f9",
    image: require("../assets/skins/hero_milestone_ufo_alien.png"),
    milestone: { kind: "distance", meters: 28_000 },
  },
];

const KNOWN_SHOP_SKIN_IDS = new Set(SHOP_SKIN_ROWS.map((r) => r.id));

/** Drop unknown / removed skin ids; always include `classic` if list non-empty. */
export function sanitizeOwnedSkins(ids: string[]): string[] {
  const next = [...new Set(ids.filter((id) => KNOWN_SHOP_SKIN_IDS.has(id)))];
  if (next.length === 0) return ["classic"];
  if (!next.includes("classic")) next.unshift("classic");
  return next;
}

export function coerceCurrentSkinId(raw: string | null | undefined): string {
  if (raw && KNOWN_SHOP_SKIN_IDS.has(raw)) return raw;
  return "classic";
}

export function heroImageForSkinId(skinId: string): ImageSourcePropType | undefined {
  return SHOP_SKIN_ROWS.find((r) => r.id === skinId)?.image;
}
