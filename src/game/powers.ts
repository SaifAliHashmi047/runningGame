/**
 * Single source of truth for power-up metadata, durations, and spawn weights.
 */

export type PowerUpKind =
  | "shield"
  | "magnet"
  | "boost"
  | "slowTime"
  | "multiplier"
  | "ghostPhase"
  | "coinBurst";

export type PowerUpMode = "timed" | "instant";

export type PowerUpDef = {
  id: PowerUpKind;
  label: string;
  shortLabel: string;
  /** 0 = instant effect only */
  durationMs: number;
  mode: PowerUpMode;
  sortOrder: number;
  /** Card accent + ring */
  accent: string;
  ring: string;
  /** Subtle World pickup glow */
  glow: string;
};

export const POWERUP_DEFS: Record<PowerUpKind, PowerUpDef> = {
  shield: {
    id: "shield",
    label: "Shield",
    shortLabel: "SHD",
    durationMs: 9600,
    mode: "timed",
    sortOrder: 0,
    accent: "#38bdf8",
    ring: "#7dd3fc",
    glow: "rgba(96,165,250,0.9)",
  },
  magnet: {
    id: "magnet",
    label: "Magnet",
    shortLabel: "MAG",
    durationMs: 9600,
    mode: "timed",
    sortOrder: 1,
    accent: "#4ade80",
    ring: "#86efac",
    glow: "rgba(34,197,94,0.9)",
  },
  boost: {
    id: "boost",
    label: "Boost",
    shortLabel: "BST",
    durationMs: 7500,
    mode: "timed",
    sortOrder: 2,
    accent: "#c084fc",
    ring: "#d8b4fe",
    glow: "rgba(167,139,250,0.9)",
  },
  slowTime: {
    id: "slowTime",
    label: "Slow-Mo",
    shortLabel: "TIME",
    durationMs: 8800,
    mode: "timed",
    sortOrder: 3,
    accent: "#2dd4bf",
    ring: "#5eead4",
    glow: "rgba(45,212,191,0.85)",
  },
  multiplier: {
    id: "multiplier",
    label: "Multiplier",
    shortLabel: "x2",
    durationMs: 9600,
    mode: "timed",
    sortOrder: 4,
    accent: "#fb923c",
    ring: "#fdba74",
    glow: "rgba(245,158,11,0.9)",
  },
  ghostPhase: {
    id: "ghostPhase",
    label: "Ghost",
    shortLabel: "GHOST",
    durationMs: 6800,
    mode: "timed",
    sortOrder: 5,
    accent: "#a5b4fc",
    ring: "#c7d2fe",
    glow: "rgba(129,140,248,0.9)",
  },
  coinBurst: {
    id: "coinBurst",
    label: "Coin Burst",
    shortLabel: "COIN",
    durationMs: 0,
    mode: "instant",
    sortOrder: 6,
    accent: "#facc15",
    ring: "#fde047",
    glow: "rgba(250,204,21,0.95)",
  },
};

/** Weighted spawn table (relative weights; need not sum to 1). */
export const POWERUP_SPAWN_WEIGHTS: { kind: PowerUpKind; weight: number }[] = [
  { kind: "shield", weight: 1.1 },
  { kind: "magnet", weight: 1.1 },
  { kind: "boost", weight: 1.0 },
  { kind: "slowTime", weight: 0.95 },
  { kind: "multiplier", weight: 1.0 },
  { kind: "ghostPhase", weight: 0.75 },
  { kind: "coinBurst", weight: 0.55 },
];

export function pickPowerUpKind(rng: () => number = Math.random): PowerUpKind {
  const total = POWERUP_SPAWN_WEIGHTS.reduce((s, e) => s + e.weight, 0);
  let t = rng() * total;
  for (const { kind, weight } of POWERUP_SPAWN_WEIGHTS) {
    t -= weight;
    if (t <= 0) return kind;
  }
  return "shield";
}

export function defFor(kind: PowerUpKind): PowerUpDef {
  return POWERUP_DEFS[kind];
}
