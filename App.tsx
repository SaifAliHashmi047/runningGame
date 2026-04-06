import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  ReducedMotionConfig,
  useSharedValue,
} from "react-native-reanimated";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  Modal,
  Image,
  AppState,
  useWindowDimensions,
  type View as RNView,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import type { ShipVariant } from "./components/Ship";
import HeroGameAnchor from "./components/HeroGameAnchor";
import ShopModal from "./components/ShopModal";
import { powerUpWorldRenderOutset } from "./components/PowerUp";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AdsRoot, HomeScreenBanner } from "./src/ads";
import {
  prepareShopRewardedAd,
  showShopRewardedForCoins,
} from "./src/ads/shopRewardedCoins";
import {
  prepareReviveRewardedAd,
  showReviveRewardedAd,
} from "./src/ads/reviveRewardedAd";
import { SHOP_SKIN_ROWS, heroImageForSkinId } from "./src/game/heroSkinCatalog";
import {
  loadBestSingleRunStats,
  mergeMilestoneUnlocks,
  persistBestSingleRunStats,
  skinMilestoneSatisfied,
  type BestSingleRunStats,
} from "./src/game/milestoneUnlock";
import HomeScreen from "./src/screens/HomeScreen";
import {
  routeEnterGame,
  routeEnterHome,
  routeExitGame,
  routeExitHome,
} from "./src/ui/navigation/routeTransition";
import GameSplashScreen from "./src/ui/splash/GameSplashScreen";
import { GameplayReducedMotion } from "./src/game/motion/GameplayReducedMotion";
import type { ObstacleVisual } from "./src/game/types";
import {
  aabbOverlap,
  DEBUG_DRAW_COLLISION_BOXES,
  DEBUG_DRAW_VISUAL_BOUNDS,
  obstacleCollisionRect,
  obstacleHitSize,
  playerCollisionAabb,
} from "./src/game/hitboxes";
import HitboxDebugOverlay from "./src/ui/HitboxDebugOverlay";
import FuturisticGameplayBackground from "./src/ui/game/FuturisticGameplayBackground";
import { COIN_TEXTURE } from "./src/assets/coins";
import { OBSTACLE_TEXTURE_SOURCES } from "./src/assets/obstacles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CURRENT_SKIN_KEY,
  HIGH_SCORE_KEY,
  OWNED_SKINS_KEY,
  SAVED_COINS_KEY,
  TOTAL_RUNS_KEY,
} from "./src/storage/persistenceKeys";
import type { PowerUpKind } from "./src/game/powers";
import { pickPowerUpKind, POWERUP_DEFS } from "./src/game/powers";
import { ActivePowerUpsHud, PowerPickupFlash } from "./src/ui/powerups";
import AppStatusBar from "./src/ui/AppStatusBar";
import { getAudioManager } from "./src/audio";
import {
  OBSTACLE_SIZE_MIN,
  OBSTACLE_SIZE_MAX,
  POWERUP_WORLD_SIZE,
  COIN_SIZE,
  MAX_SPEED_CAP,
  DIFFICULTY_PHASES,
  DANGER_SPAWN_COMPRESSION,
  createInitialDangerZone,
  stepDangerZone,
  resolveRunPressure,
  survivalComboTier,
  nearMissCheck,
  nearMissScore,
  feverMeterPassiveTick,
  feverMeterAddClamped,
  FEVER_METER_SURVIVAL_CHUNK,
  FEVER_METER_SURVIVAL_CHUNK_FRAMES,
  startFever,
  FEVER_METER_MAX,
  FEVER_METER_PER_NEAR_MISS,
  FEVER_METER_PER_COIN,
  FEVER_METER_PER_POWER_PICKUP,
  NEAR_MISS_COOLDOWN_FRAMES,
  type DangerVisual,
} from "./src/game/difficulty";
import {
  COIN_SPACING_BASE,
  COIN_SPACING_SPEED_FACTOR,
  RUNNER_LANE_MARGIN,
  RUNNER_SPAWN_MIN_INTERVAL_FRAMES,
  RUNNER_START_SPEED,
} from "./src/game/runner/runnerConfig";
import { computeLaneGeometry } from "./src/game/runner/lanes";
import {
  materializeObstaclePattern,
  pickObstaclePattern,
} from "./src/game/runner/obstaclePatterns";
import {
  materializeCoinPattern,
  pickCoinPattern,
} from "./src/game/runner/coinPatterns";
import {
  obstacleSpawnIntervalFrames,
  runElapsedSeconds,
  runnerSpeedFromElapsedSec,
} from "./src/game/runner/runnerProgression";
import {
  RUN_DISTANCE_PER_SPEED_SECOND,
  ZONE_SPEED_LERP,
  coinPatternPhaseFromZone,
  getRunnerZoneByDistance,
  patternPhaseFromZoneIndex,
  zoneObstacleRateForSpawn,
} from "./src/game/zones/runnerZones";
import {
  DEBUG_PERF_OVERLAY,
  MAX_DELTA_MS,
  PERF_UI_REFRESH_MS,
  TARGET_FRAME_MS,
  type VisualQualityTier,
} from "./src/game/performanceConfig";
import {
  planSimulationSubsteps,
  stepWallMsForK,
} from "./src/game/runLoop/fixedSubsteps";
import { EntityPool } from "./src/game/runLoop/entityPool";
import {
  countObstaclesInPlayViewport,
  fillRenderVisible,
} from "./src/game/runLoop/fillRenderVisible";
import {
  compactCoinsOffScreen,
  compactObstaclesOffScreen,
  compactPowerUpsOffScreen,
} from "./src/game/runLoop/simEntityCull";
import { obstacleBroadphaseX } from "./src/game/runLoop/broadphaseCollision";
import {
  PerfSampler,
  type PerfSamplerStats,
} from "./src/game/performanceSampler";
import FpsPerfOverlay from "./src/ui/FpsPerfOverlay";
import GameRunHud from "./src/ui/game/GameRunHud";
import GameOverOverlay from "./src/ui/game/GameOverOverlay";
import PauseRibbon from "./src/ui/game/PauseRibbon";
import GameplayLaneGuide from "./src/ui/game/GameplayLaneGuide";
import AmbientParticles from "./src/ui/game/AmbientParticles";
import PowerActionButton from "./src/ui/game/PowerActionButton";
import {
  HUD_SCORE_THROTTLE_MS,
  MAX_ACTIVE_COINS,
  MAX_ACTIVE_OBSTACLES,
  MAX_ACTIVE_POWERUPS,
  MAX_ON_SCREEN_OBSTACLES,
  packVisibleIntoEntityPosSV,
} from "./src/game/perf/entityPositionPack";
import {
  forEachObstacleInVerticalBand,
  obstacleLaneRelevantForPlayer,
} from "./src/game/collisionQueries";
import type { EntityPosMap } from "./src/ui/game/entityPositions";
import WorldEntityLayer from "./src/ui/game/WorldEntityLayer";
import type { TrackedObstacleSpec } from "./src/ui/game/TrackedObstacle";
import type {
  CoinRenderSpec,
  PowerRenderSpec,
} from "./src/ui/game/WorldEntityLayer";
import {
  fontPixel,
  heightPixel,
  moderateScale,
  scale,
  screenHeight,
  screenWidth,
} from "./utils/responsive";

const SCREEN_WIDTH = screenWidth;
const SCREEN_HEIGHT = screenHeight;

/** Monotonic-ish frame timing (RN Hermes exposes `performance` at runtime; fall back safely). */
const perfNow = (): number => {
  const p = (globalThis as { performance?: { now: () => number } }).performance;
  return typeof p?.now === "function" ? p.now() : Date.now();
};

/** Kept in sync with `SAVED_COINS_KEY` so `resetGame` can restore the wallet after a run. */
let lastPersistedCoinBalance = 0;

function persistSavedCoins(coins: number) {
  const c = Math.max(0, Math.floor(coins));
  lastPersistedCoinBalance = c;
  void AsyncStorage.setItem(SAVED_COINS_KEY, String(c)).catch(() => {});
}

/** Dev only: non-zero seeds saved coins on launch. Always `0` in production (`__DEV__` is false). */
const DEV_GRANT_COINS_ON_LAUNCH = __DEV__ ? 50_0000000000 : 0;

const GRAVITY = 0.72;
const JUMP_FORCE = 15;
const GROUND_HEIGHT = heightPixel(128);
const PLAYER_WIDTH = scale(56);
const PLAYER_HEIGHT = scale(60);
const PLAYER_START_LANE = 1;
/** Lane grid — ship starts centered in lane 1 (Subway-style three lanes). */
const LANE_MARGIN = scale(RUNNER_LANE_MARGIN);
/** One shared geometry — `computeLaneGeometry` was called every frame via `laneGeom()` (alloc + closures). */
const LANE_GEOM = computeLaneGeometry(SCREEN_WIDTH, PLAYER_WIDTH, LANE_MARGIN);
const PLAYER_X = LANE_GEOM.playerLeftFromLane(PLAYER_START_LANE);

/** Horizontal hero follow — tuned for smooth, non-jittery finger tracking. */
const FINGER_DEAD_ZONE_PX = 1.15;
const HERO_FOLLOW_LERP = 0.32;
const HERO_MAX_STEP_PER_FRAME = scale(38);

/** Top of usable playfield (screen Y from top) — keep hero AABB below HUD chrome. */
const GAMEPLAY_TOP_INSET = heightPixel(96);
/**
 * Minimum space from the **playfield bottom** to the hero's bottom edge (same coords as `bottom` style).
 * Lets `playerSteerY` go negative so the ship can sit near the bottom of the screen; was stuck at ~`GROUND_HEIGHT`
 * when steer was clamped to ≥ 0.
 */
const GAMEPLAY_BOTTOM_HERO_INSET = heightPixel(14);

function clampPlayerLeft(left: number): number {
  return Math.max(0, Math.min(SCREEN_WIDTH - PLAYER_WIDTH, left));
}

/** Lowest allowed steer (can be negative). `jumpY` is jump-only height. */
function minPlayerSteerY(jumpY: number): number {
  return GAMEPLAY_BOTTOM_HERO_INSET - GROUND_HEIGHT - jumpY;
}

/** Highest allowed steer (positive = ship higher on screen). `jumpY` is jump-only height. */
function maxPlayerSteerY(jumpY: number): number {
  return (
    SCREEN_HEIGHT -
    GAMEPLAY_TOP_INSET -
    GROUND_HEIGHT -
    jumpY -
    PLAYER_HEIGHT
  );
}

function clampPlayerSteerY(steer: number, jumpY: number): number {
  const lo = minPlayerSteerY(jumpY);
  const hi = maxPlayerSteerY(jumpY);
  if (hi <= lo) return lo;
  return Math.max(lo, Math.min(hi, steer));
}

/**
 * Map responder `locationY` into the same space as `SCREEN_HEIGHT`.
 * Clamp to the play view height so a finger dragged under/over the play area (e.g. onto the
 * banner) does not produce bogus Y (which was snapping the hero to the top).
 */
function touchLocationYToScreenY(
  locationY: number,
  viewHeight: number,
): number {
  const h = viewHeight > 0 ? viewHeight : SCREEN_HEIGHT;
  const ly = Math.max(0, Math.min(h, locationY));
  return (ly / h) * SCREEN_HEIGHT;
}

function touchLocationXToScreenX(
  locationX: number,
  viewWidth: number,
): number {
  const w = viewWidth > 0 ? viewWidth : SCREEN_WIDTH;
  const lx = Math.max(0, Math.min(w, locationX));
  return (lx / w) * SCREEN_WIDTH;
}

function nearestLaneIndex(playerLeft: number): number {
  const g = LANE_GEOM;
  let best = 0;
  let bestD = Infinity;
  for (let lane = 0; lane < 3; lane++) {
    const d = Math.abs(playerLeft - g.playerLeftFromLane(lane));
    if (d < bestD) {
      bestD = d;
      best = lane;
    }
  }
  return best;
}

type ObstacleType = "block" | "fast" | "wide" | "zigzag";
type Obstacle = {
  id: number;
  x: number;
  y: number;
  size: number;
  type: ObstacleType;
  visual: ObstacleVisual;
  driftPhase?: number;
  lane: number;
  /** Cached render size — from `obstacleHitSize` at spawn. */
  visW: number;
  visH: number;
  /** Cached collision AABB relative to `obs.x` / `obs.y` (from `obstacleCollisionRect` at origin). */
  hitOffX: number;
  hitOffY: number;
  hitW: number;
  hitH: number;
};

type PowerUpItem = {
  id: number;
  x: number;
  y: number;
  size: number;
  type: PowerUpKind;
};

type CoinItem = {
  id: number;
  x: number;
  y: number;
  size: number;
};

function dedupeCoinsInPlace(
  coins: CoinItem[],
  release: (c: CoinItem) => void,
): void {
  const seen = new Set<number>();
  let w = 0;
  for (let i = 0; i < coins.length; i++) {
    const e = coins[i];
    if (seen.has(e.id)) {
      release(e);
      continue;
    }
    seen.add(e.id);
    if (w !== i) coins[w] = e;
    w++;
  }
  coins.length = w;
}

type SimState = {
  playerY: number;
  /** Baseline vertical offset from finger steer (positive = higher on screen). Independent of jump. */
  playerSteerY: number;
  playerSteerYTarget: number;
  playerX: number;
  playerXTarget: number;
  velocity: number;
  obstacles: Obstacle[];
  powerUps: PowerUpItem[];
  coins: CoinItem[];
  speed: number;
  spawnCooldown: number;
  powerSpawnCooldown: number;
  coinSpawnCooldown: number;
  /** Continuous distance traveled — `Math.floor(runDistance)` is the distance score component. */
  runDistance: number;
  /** Coins, near-misses, danger clears, etc. */
  pickupScore: number;
  /** Total = floor(runDistance) + pickupScore (cached for systems that read `score`). */
  score: number;
  coinsCollected: number;
  /** Coins picked up this run only (trail + magnet); used for milestone “coins in one run”. */
  coinsEarnedThisRun: number;
  paused: boolean;
  shakeT: number;
  shakePhase: number;
  shieldUntil: number; // ms timestamp
  x2Until: number; // ms timestamp (score/coin multiplier)
  magnetUntil: number;
  boostUntil: number;
  slowTimeUntil: number;
  ghostPhaseUntil: number;
  pickupFlashKind: PowerUpKind | null;
  pickupFlashToken: number;
  hitGraceUntil: number; // brief invulnerability after shield pop
  shopOpen: boolean;
  ownedSkins: string[];
  currentSkin: string;
  tick: number;
  feverActive: boolean;
  feverMeter: number; // 0..100
  feverUntil: number;
  feverIntroUntil: number;
  feverMultiplier: number;
  feverDurationMs: number;
  /** Authoritative progression / tension systems (see src/game/difficulty). */
  runTick: number;
  /** Last obstacle pattern’s primary hazard lane (for risk-reward coin trails). */
  lastHazardLane: number;
  dangerWarnEndAt: number;
  dangerBurstEndAt: number;
  dangerNextEligibleAt: number;
  survivalFrames: number;
  /** Integer survival floor (for fever chunks when `survivalFrames` is fractional). */
  lastSurvivalSi: number;
  nearMissCooldown: number;
  /** Cached from last `resolveRunPressure` for HUD / danger vignettes. */
  dangerVisual: DangerVisual;
  /** Last zone index used for “Zone N” toast (avoid duplicate toasts). */
  lastAnnouncedZoneIndex: number;
  /** Render-only culled copies (references into live arrays); counts valid after each sim frame. */
  _visObs: Obstacle[];
  _visCoins: CoinItem[];
  _visPow: PowerUpItem[];
  _visObsN: number;
  _visCoinsN: number;
  _visPowN: number;
  /** Reused for obstacle-pattern coin drops (no per-spawn `[]`). */
  patternCoinScratch: CoinItem[];
};

/** World vertical offset: steer baseline + jump arc (`playerY` is jump-only for physics). */
function playerWorldYOffset(s: SimState): number {
  return s.playerSteerY + s.playerY;
}

/** Slop around hero visual for starting a drag (screen-space px). */
const HERO_DRAG_START_SLOP = scale(12);

/**
 * Whether a touch in the play view started on the hero (screen-space AABB + slop).
 * Only then should the pan responder claim the gesture.
 */
function isTouchInsideHeroDragStart(
  locationX: number,
  locationY: number,
  viewW: number,
  viewH: number,
  s: SimState,
): boolean {
  const sx = touchLocationXToScreenX(locationX, viewW);
  const sy = touchLocationYToScreenY(locationY, viewH);
  const steer = s.playerSteerY;
  const jump = s.playerY;
  const slop = HERO_DRAG_START_SLOP;
  const left = s.playerX - slop;
  const right = s.playerX + PLAYER_WIDTH + slop;
  const top =
    SCREEN_HEIGHT -
    (GROUND_HEIGHT + steer + jump + PLAYER_HEIGHT) -
    slop;
  const bottom = SCREEN_HEIGHT - (GROUND_HEIGHT + steer + jump) + slop;
  return sx >= left && sx <= right && sy >= top && sy <= bottom;
}

function collides(playerY: number, playerX: number, obs: Obstacle): boolean {
  const playerBox = playerCollisionAabb({
    playerX,
    playerY,
    playerWidth: PLAYER_WIDTH,
    playerHeight: PLAYER_HEIGHT,
    screenHeight: SCREEN_HEIGHT,
    groundHeight: GROUND_HEIGHT,
  });
  const left = obs.x + obs.hitOffX;
  const top = obs.y + obs.hitOffY;
  return aabbOverlap(playerBox, {
    left,
    right: left + obs.hitW,
    top,
    bottom: top + obs.hitH,
  });
}

function collidesPower(
  playerY: number,
  playerX: number,
  p: PowerUpItem,
): boolean {
  const pLeft = playerX;
  const pRight = playerX + PLAYER_WIDTH;
  const pTop = SCREEN_HEIGHT - (GROUND_HEIGHT + playerY + PLAYER_HEIGHT);
  const pBottom = SCREEN_HEIGHT - (GROUND_HEIGHT + playerY);
  const pickupPad = scale(8);
  const oLeft = p.x - pickupPad;
  const oRight = p.x + p.size + pickupPad;
  const oTop = p.y - pickupPad;
  const oBottom = p.y + p.size + pickupPad;
  return oLeft < pRight && oRight > pLeft && oTop < pBottom && oBottom > pTop;
}

function collidesCoin(playerY: number, playerX: number, c: CoinItem): boolean {
  const pLeft = playerX;
  const pRight = playerX + PLAYER_WIDTH;
  const pTop = SCREEN_HEIGHT - (GROUND_HEIGHT + playerY + PLAYER_HEIGHT);
  const pBottom = SCREEN_HEIGHT - (GROUND_HEIGHT + playerY);
  const pickupPad = scale(8);
  const oLeft = c.x - pickupPad;
  const oRight = c.x + c.size + pickupPad;
  const oTop = c.y - pickupPad;
  const oBottom = c.y + c.size + pickupPad;
  return oLeft < pRight && oRight > pLeft && oTop < pBottom && oBottom > pTop;
}

const HITBOX_OVERLAY_ENABLED =
  DEBUG_DRAW_COLLISION_BOXES || DEBUG_DRAW_VISUAL_BOUNDS;

/** Join-based sig avoids O(n²) string growth when many coins/obstacles are visible. */
function visibleEntitySig<T extends { id: number }>(
  items: readonly T[],
  n: number,
): string {
  if (n === 0) return "";
  const parts = new Array<string>(n + 1);
  parts[0] = String(n);
  for (let i = 0; i < n; i++) parts[i + 1] = String(items[i].id);
  return parts.join(":");
}

function buildObstacleRenderSpecs(
  obs: readonly Obstacle[],
  n: number,
): TrackedObstacleSpec[] {
  const out: TrackedObstacleSpec[] = [];
  for (let i = 0; i < n; i++) {
    const o = obs[i];
    out.push({ id: o.id, visW: o.visW, visH: o.visH, visual: o.visual });
  }
  return out;
}

function buildCoinRenderSpecs(
  items: readonly CoinItem[],
  n: number,
): CoinRenderSpec[] {
  const out: CoinRenderSpec[] = [];
  for (let i = 0; i < n; i++) {
    const c = items[i];
    out.push({ id: c.id, size: c.size });
  }
  return out;
}

function buildPowerRenderSpecs(
  items: readonly PowerUpItem[],
  n: number,
): PowerRenderSpec[] {
  const out: PowerRenderSpec[] = [];
  for (let i = 0; i < n; i++) {
    const p = items[i];
    out.push({ id: p.id, kind: p.type, size: p.size });
  }
  return out;
}

const initialSim = (): SimState => ({
  playerY: 0,
  playerSteerY: 0,
  playerSteerYTarget: 0,
  playerX: PLAYER_X,
  playerXTarget: PLAYER_X,
  velocity: 0,
  obstacles: [],
  powerUps: [],
  coins: [],
  speed: RUNNER_START_SPEED,
  spawnCooldown: 34,
  powerSpawnCooldown: 200,
  coinSpawnCooldown: 150,
  runDistance: 0,
  pickupScore: 0,
  score: 0,
  coinsCollected: 0,
  coinsEarnedThisRun: 0,
  paused: false,
  shakeT: 0,
  shakePhase: 0,
  shieldUntil: 0,
  x2Until: 0,
  magnetUntil: 0,
  boostUntil: 0,
  slowTimeUntil: 0,
  ghostPhaseUntil: 0,
  pickupFlashKind: null,
  pickupFlashToken: 0,
  hitGraceUntil: 0,
  shopOpen: false,
  ownedSkins: ["classic"],
  currentSkin: "classic",
  tick: 0,
  feverActive: false,
  feverMeter: 0,
  feverUntil: 0,
  feverIntroUntil: 0,
  feverMultiplier: 1,
  feverDurationMs: 0,
  runTick: 0,
  lastHazardLane: 1,
  ...snapshotDangerFields(),
  survivalFrames: 0,
  lastSurvivalSi: 0,
  nearMissCooldown: 0,
  dangerVisual: "none",
  lastAnnouncedZoneIndex: 0,
  _visObs: [],
  _visCoins: [],
  _visPow: [],
  _visObsN: 0,
  _visCoinsN: 0,
  _visPowN: 0,
  patternCoinScratch: [],
});

function snapshotDangerFields() {
  const d = createInitialDangerZone(Date.now());
  return {
    dangerWarnEndAt: d.warnEndAt,
    dangerBurstEndAt: d.burstEndAt,
    dangerNextEligibleAt: d.nextEligibleAt,
  };
}

type GameScreenProps = {
  onExitToHome?: () => void;
  /** Anchored banner (same unit as home); keep off until splash completes. */
  showBannerAds?: boolean;
};

function GameScreen({ onExitToHome, showBannerAds = false }: GameScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: windowW, height: windowH } = useWindowDimensions();
  const gameAdReserve =
    Math.max(insets.bottom, heightPixel(8)) + heightPixel(52);
  const sim = useRef<SimState>(initialSim());
  const obstacleIdRef = useRef(0);
  /** Strictly increasing — never mix offset formulas per type (those can collide). */
  const allocEntityId = (): number => {
    obstacleIdRef.current += 1;
    return obstacleIdRef.current;
  };
  const obstaclePoolRef = useRef(
    new EntityPool<Obstacle>(() => ({} as Obstacle)),
  );
  const coinPoolRef = useRef(new EntityPool<CoinItem>(() => ({} as CoinItem)));
  const powerPoolRef = useRef(
    new EntityPool<PowerUpItem>(() => ({} as PowerUpItem)),
  );
  const simSubstepBankRef = useRef(0);
  const substepKsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const lastDragEndMsRef = useRef(0);
  const lastFingerXRef = useRef<number | null>(null);
  const lastFingerYRef = useRef<number | null>(null);
  /** Finger X minus ship center at touch start — prevents snap when touch begins away from hero. */
  const touchOffsetRef = useRef(0);
  /** Finger Y minus ship visual center (from top) at touch start — same idea as X. */
  const touchOffsetYRef = useRef(0);
  const gameLayoutRef = useRef<{ w: number; h: number } | null>(null);
  const containerRef = useRef<RNView | null>(null);
  const containerWinRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const perfSamplerRef = useRef(new PerfSampler());
  const lastFramePerfRef = useRef(perfNow());
  const lastPerfUiRef = useRef(0);
  /** Last tier pushed from the perf sampler — avoids `setVisualTier` every refresh when unchanged. */
  const lastPerfVisualTierRef = useRef<VisualQualityTier>(0);

  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [perfStats, setPerfStats] = useState<PerfSamplerStats | null>(null);
  const [visualTier, setVisualTier] = useState<VisualQualityTier>(0);
  const [worldFx, setWorldFx] = useState(() => ({
    dangerVisual: "none" as DangerVisual,
    feverActive: false,
  }));
  const [uiEpoch, setUiEpoch] = useState(0);
  const [runPaused, setRunPaused] = useState(false);
  const [videoRewardBusy, setVideoRewardBusy] = useState(false);
  const [reviveVideoBusy, setReviveVideoBusy] = useState(false);
  const [zoneBanner, setZoneBanner] = useState<{
    id: number;
    zoneNumber: number;
  } | null>(null);

  const lastWorldFxKeyRef = useRef("none|0");
  /** User pause (separate from shop modal) — ref stays in sync for `applyPauseFromSources`. */
  const runPausedRef = useRef(false);

  const heroLeftSV = useSharedValue(PLAYER_X);
  const heroBottomSV = useSharedValue(GROUND_HEIGHT);

  const obsPositionsSV = useSharedValue<EntityPosMap>({});
  const coinPositionsSV = useSharedValue<EntityPosMap>({});
  const powerPositionsSV = useSharedValue<EntityPosMap>({});
  const obsPosScratchRef = useRef<EntityPosMap>({});
  const coinPosScratchRef = useRef<EntityPosMap>({});
  const powerPosScratchRef = useRef<EntityPosMap>({});
  const obsAliveRef = useRef<Set<number>>(new Set());
  const coinAliveRef = useRef<Set<number>>(new Set());
  const powerAliveRef = useRef<Set<number>>(new Set());

  const [obsRenderSpecs, setObsRenderSpecs] = useState<TrackedObstacleSpec[]>(
    [],
  );
  const [coinRenderSpecs, setCoinRenderSpecs] = useState<CoinRenderSpec[]>([]);
  const [powerRenderSpecs, setPowerRenderSpecs] = useState<PowerRenderSpec[]>(
    [],
  );
  const obsSigRef = useRef("");
  const coinSigRef = useRef("");
  const powSigRef = useRef("");

  /** Bumped on `resetGame` so long-lived Reanimated trees restart cleanly (no carryover mid-cycle). */
  const [runSessionKey, setRunSessionKey] = useState(0);

  const [runHud, setRunHud] = useState({ score: 0, distanceFloor: 0 });
  /** Playable `gameRoot` size (inside top/side safe area) — entities / layout use this space. */
  const [gameLayout, setGameLayout] = useState<{ w: number; h: number } | null>(
    null,
  );
  const lastHudPushRef = useRef(0);
  const lastHudScoreRef = useRef(0);
  const lastHudDistRef = useRef(0);

  const bestRunStatsRef = useRef<BestSingleRunStats>({
    distanceM: 0,
    runCoins: 0,
  });
  const lastMilestoneCheckRef = useRef({ d: -1, c: -1 });
  const [shopBestStats, setShopBestStats] = useState<BestSingleRunStats>({
    distanceM: 0,
    runCoins: 0,
  });

  /** Avoid simulating until saved wallet is loaded (prevents storage hydrate overwriting pickups). */
  const walletHydratedRef = useRef(false);
  const coinPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scheduleCoinPersist = useCallback(() => {
    if (coinPersistTimerRef.current != null) {
      clearTimeout(coinPersistTimerRef.current);
    }
    coinPersistTimerRef.current = setTimeout(() => {
      coinPersistTimerRef.current = null;
      persistSavedCoins(sim.current.coinsCollected);
    }, 320);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        if (coinPersistTimerRef.current != null) {
          clearTimeout(coinPersistTimerRef.current);
          coinPersistTimerRef.current = null;
        }
        persistSavedCoins(sim.current.coinsCollected);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (gameOver) return;
    for (const mod of [
      ...Object.values(OBSTACLE_TEXTURE_SOURCES),
      COIN_TEXTURE,
    ]) {
      const r = Image.resolveAssetSource(mod);
      if (r?.uri) void Image.prefetch(r.uri);
    }
  }, [gameOver, runSessionKey]);

  useEffect(() => {
    let cancelled = false;
    walletHydratedRef.current = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        const rawOwned = await AsyncStorage.getItem(OWNED_SKINS_KEY);
        const rawCurrent = await AsyncStorage.getItem(CURRENT_SKIN_KEY);
        if (!cancelled && raw != null) {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) setHighScore(n);
        }
        if (!cancelled && rawOwned) {
          try {
            const parsed = JSON.parse(rawOwned);
            if (Array.isArray(parsed)) sim.current.ownedSkins = parsed;
          } catch {}
        }
        if (!cancelled && rawCurrent) {
          sim.current.currentSkin = rawCurrent;
          setUiEpoch((e) => e + 1);
        }
        const rawCoins = await AsyncStorage.getItem(SAVED_COINS_KEY);
        if (!cancelled) {
          if (DEV_GRANT_COINS_ON_LAUNCH > 0) {
            const c = DEV_GRANT_COINS_ON_LAUNCH;
            sim.current.coinsCollected = c;
            lastPersistedCoinBalance = c;
          } else if (rawCoins != null) {
            const n = parseInt(rawCoins, 10);
            if (!Number.isNaN(n)) {
              const c = Math.max(0, n);
              sim.current.coinsCollected = c;
              lastPersistedCoinBalance = c;
            }
          }
        }
        const br = await loadBestSingleRunStats();
        if (!cancelled) {
          bestRunStatsRef.current = br;
          setShopBestStats(br);
          const merged = mergeMilestoneUnlocks(
            sim.current.ownedSkins,
            br.distanceM,
            br.runCoins,
          );
          const prevS = new Set(sim.current.ownedSkins);
          if (merged.some((id) => !prevS.has(id))) {
            sim.current.ownedSkins = merged;
            await AsyncStorage.setItem(
              OWNED_SKINS_KEY,
              JSON.stringify(merged),
            ).catch(() => {});
            setUiEpoch((e) => e + 1);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) walletHydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const a = getAudioManager();
    void a.preload().then(() => {
      a.onGameSessionStart();
    });
    return () => {
      a.onGameSessionEnd();
    };
  }, []);

  useEffect(() => {
    if (!gameOver) return;
    getAudioManager().onGameOver();
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const a = getAudioManager();
    if (paused) {
      a.pauseGameAudio();
    } else {
      a.resumeGameAudio();
    }
  }, [paused, gameOver]);

  const applyPauseFromSources = useCallback(() => {
    sim.current.paused = sim.current.shopOpen || runPausedRef.current;
    setPaused(sim.current.paused);
  }, []);

  useEffect(() => {
    if (!gameOver) return;
    runPausedRef.current = false;
    setRunPaused(false);
  }, [gameOver]);

  const resetGame = useCallback(() => {
    const prev = sim.current;
    const oPool = obstaclePoolRef.current;
    for (let i = 0; i < prev.obstacles.length; i++)
      oPool.release(prev.obstacles[i]);
    const cPool = coinPoolRef.current;
    for (let i = 0; i < prev.coins.length; i++) cPool.release(prev.coins[i]);
    for (let i = 0; i < prev.patternCoinScratch.length; i++)
      cPool.release(prev.patternCoinScratch[i]);
    const pPool = powerPoolRef.current;
    for (let i = 0; i < prev.powerUps.length; i++)
      pPool.release(prev.powerUps[i]);

    const prevOwned = [...prev.ownedSkins];
    const prevSkin = prev.currentSkin;
    sim.current = initialSim();
    sim.current.coinsCollected = lastPersistedCoinBalance;
    sim.current.ownedSkins = prevOwned;
    sim.current.currentSkin = prevSkin;
    obstacleIdRef.current = 0;
    simSubstepBankRef.current = 0;
    perfSamplerRef.current.reset();
    lastFramePerfRef.current = perfNow();
    lastPerfUiRef.current = 0;
    lastPerfVisualTierRef.current = 0;
    isDraggingRef.current = false;
    cancelAnimation(heroLeftSV);
    cancelAnimation(heroBottomSV);
    heroLeftSV.value = PLAYER_X;
    heroBottomSV.value = GROUND_HEIGHT;
    lastFingerXRef.current = null;
    lastFingerYRef.current = null;
    touchOffsetRef.current = 0;
    touchOffsetYRef.current = 0;
    obsPositionsSV.value = {};
    coinPositionsSV.value = {};
    powerPositionsSV.value = {};
    obsPosScratchRef.current = {};
    coinPosScratchRef.current = {};
    powerPosScratchRef.current = {};
    obsAliveRef.current = new Set();
    coinAliveRef.current = new Set();
    powerAliveRef.current = new Set();
    setRunSessionKey((k) => k + 1);
    obsSigRef.current = "";
    coinSigRef.current = "";
    powSigRef.current = "";
    setObsRenderSpecs([]);
    setCoinRenderSpecs([]);
    setPowerRenderSpecs([]);
    setGameOver(false);
    runPausedRef.current = false;
    setRunPaused(false);
    setPaused(false);
    setPerfStats(null);
    setVisualTier(0);
    lastWorldFxKeyRef.current = "none|0";
    setWorldFx({ dangerVisual: "none", feverActive: false });
    setZoneBanner(null);
    setRunHud({ score: 0, distanceFloor: 0 });
    lastHudPushRef.current = 0;
    lastHudScoreRef.current = 0;
    lastHudDistRef.current = 0;
  }, [heroBottomSV, heroLeftSV]);

  useEffect(() => {
    if (!zoneBanner) return;
    const t = setTimeout(() => setZoneBanner(null), 2200);
    return () => clearTimeout(t);
  }, [zoneBanner]);

  const handleJump = useCallback(() => {
    if (gameOver) {
      return;
    }
    // If we just dragged, treat as drag-not-tap to avoid accidental jumps
    if (
      paused ||
      isDraggingRef.current ||
      Date.now() - lastDragEndMsRef.current < 160
    )
      return;
    if (sim.current.playerY === 0) {
      sim.current.velocity = JUMP_FORCE;
    }
    // Trigger brief shake when pressing
    sim.current.shakeT = 10;
  }, [gameOver, resetGame, paused]);

  const handleRetry = useCallback(() => {
    getAudioManager().onRunRestart();
    resetGame();
  }, [resetGame]);

  const handleExitToHome = useCallback(() => {
    persistSavedCoins(sim.current.coinsCollected);
    resetGame();
    onExitToHome?.();
  }, [resetGame, onExitToHome]);

  const toggleShop = useCallback(() => {
    getAudioManager().playButtonTap();
    const wasOpen = sim.current.shopOpen;
    const next = !wasOpen;
    if (wasOpen && !next) {
      persistSavedCoins(sim.current.coinsCollected);
    }
    sim.current.shopOpen = next;
    applyPauseFromSources();
    if (next) prepareShopRewardedAd();
  }, [applyPauseFromSources]);

  const toggleRunPause = useCallback(() => {
    if (gameOver || sim.current.shopOpen) return;
    getAudioManager().playButtonTap();
    runPausedRef.current = !runPausedRef.current;
    setRunPaused(runPausedRef.current);
    applyPauseFromSources();
  }, [gameOver, applyPauseFromSources]);

  const handleWatchVideoForCoins = useCallback(() => {
    if (videoRewardBusy) return;
    setVideoRewardBusy(true);
    showShopRewardedForCoins(
      (coins) => {
        sim.current.coinsCollected += coins;
        persistSavedCoins(sim.current.coinsCollected);
        setUiEpoch((e) => e + 1);
      },
      () => setVideoRewardBusy(false),
    );
  }, [videoRewardBusy]);

  useEffect(() => {
    if (!gameOver) return;
    prepareReviveRewardedAd();
  }, [gameOver]);

  const applyReviveAfterAd = useCallback(() => {
    const nowTs = Date.now();
    const s = sim.current;
    s.hitGraceUntil = nowTs + 2400;
    const oa = s.obstacles;
    const obsPool = obstaclePoolRef.current;
    let ow = 0;
    for (let i = 0; i < oa.length; i++) {
      const ob = oa[i];
      if (collides(playerWorldYOffset(s), s.playerX, ob)) {
        obsPool.release(ob);
        continue;
      }
      if (ow !== i) oa[ow] = ob;
      ow++;
    }
    oa.length = ow;
    lastFramePerfRef.current = perfNow();
    getAudioManager().onRunRestart();
    setGameOver(false);
    setUiEpoch((e) => e + 1);
  }, []);

  const handleReviveVideo = useCallback(() => {
    if (reviveVideoBusy || !gameOver) return;
    getAudioManager().playButtonTap();
    setReviveVideoBusy(true);
    showReviveRewardedAd(applyReviveAfterAd, () => setReviveVideoBusy(false));
  }, [reviveVideoBusy, gameOver, applyReviveAfterAd]);

  const handleBuyOrEquip = useCallback(
    (
      skinId: string,
      price: number,
      variant: ShipVariant,
      hull: string,
      sail: string,
    ) => {
      const s = sim.current;
      const owned = new Set(s.ownedSkins);
      const row = SHOP_SKIN_ROWS.find((r) => r.id === skinId);
      if (!owned.has(skinId) && row?.milestone) {
        const bestD = Math.max(
          bestRunStatsRef.current.distanceM,
          Math.floor(s.runDistance),
        );
        const bestC = Math.max(
          bestRunStatsRef.current.runCoins,
          s.coinsEarnedThisRun,
        );
        if (!skinMilestoneSatisfied(row, bestD, bestC)) return;
        const next = [...owned, skinId];
        s.ownedSkins = next;
        s.currentSkin = skinId;
        AsyncStorage.setItem(OWNED_SKINS_KEY, JSON.stringify(next)).catch(
          () => {},
        );
        AsyncStorage.setItem(CURRENT_SKIN_KEY, skinId).catch(() => {});
        setUiEpoch((e) => e + 1);
        return;
      }
      if (owned.has(skinId)) {
        s.currentSkin = skinId;
        AsyncStorage.setItem(CURRENT_SKIN_KEY, skinId).catch(() => {});
        setUiEpoch((e) => e + 1);
        return;
      }
      if (row?.milestone) return;
      if (s.coinsCollected >= price) {
        s.coinsCollected -= price;
        persistSavedCoins(s.coinsCollected);
        const next = [...owned, skinId];
        s.ownedSkins = next;
        s.currentSkin = skinId;
        AsyncStorage.setItem(OWNED_SKINS_KEY, JSON.stringify(next)).catch(
          () => {},
        );
        AsyncStorage.setItem(CURRENT_SKIN_KEY, skinId).catch(() => {});
        setUiEpoch((e) => e + 1);
      }
    },
    [],
  );

  useEffect(() => {
    if (gameOver) return;

    const loop = () => {
      const s = sim.current;

      if (!walletHydratedRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (s.paused) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const nowPerf = perfNow();
      const dtMs = Math.min(
        Math.max(nowPerf - lastFramePerfRef.current, 0.001),
        MAX_DELTA_MS,
      );
      lastFramePerfRef.current = nowPerf;

      const nowTs = Date.now();
      planSimulationSubsteps(simSubstepBankRef, dtMs, substepKsRef.current);
      const ks = substepKsRef.current;
      let fatalDied = false;

      for (let _si = 0; _si < ks.length; _si++) {
        const k = ks[_si];
        s.runTick += k;
        s.survivalFrames += k;

        const elapsedSec = runElapsedSeconds(s.runTick);
        const zone = getRunnerZoneByDistance(s.runDistance);
        const patternPhase = patternPhaseFromZoneIndex(zone.index);
        const coinPatternPhase = coinPatternPhaseFromZone(
          zone.index,
          zone.coinRiskMult,
        );
        const progressScore = Math.floor(s.runDistance) + s.pickupScore;

        const phaseIdxForDanger = patternPhase;
        const dz = stepDangerZone(
          {
            warnEndAt: s.dangerWarnEndAt,
            burstEndAt: s.dangerBurstEndAt,
            nextEligibleAt: s.dangerNextEligibleAt,
          },
          {
            now: nowTs,
            score: progressScore,
            feverActive: s.feverActive,
            phaseIndex: phaseIdxForDanger,
          },
        );
        s.dangerWarnEndAt = dz.next.warnEndAt;
        s.dangerBurstEndAt = dz.next.burstEndAt;
        s.dangerNextEligibleAt = dz.next.nextEligibleAt;
        s.pickupScore += dz.clearBonus;

        const comboTier = survivalComboTier(s.survivalFrames);
        const pressure = resolveRunPressure(
          {
            score: Math.floor(s.runDistance) + s.pickupScore,
            runTick: s.runTick,
            speed: s.speed,
            now: nowTs,
            dangerWarnEndAt: s.dangerWarnEndAt,
            dangerBurstEndAt: s.dangerBurstEndAt,
            feverActive: s.feverActive,
            feverMultiplier: s.feverMultiplier,
            survivalComboTier: comboTier,
          },
          { phaseIndexOverride: patternPhase },
        );
        s.dangerVisual = pressure.dangerVisual;
        const tensionD = pressure.tension01;

        s.velocity -= GRAVITY * k;
        s.playerY += s.velocity * k;
        if (s.playerY < 0) {
          s.playerY = 0;
          s.velocity = 0;
        }

        const desiredLeft = clampPlayerLeft(s.playerXTarget);
        const t = 1 - Math.pow(1 - HERO_FOLLOW_LERP, k);
        let nextPX = s.playerX + (desiredLeft - s.playerX) * t;
        const maxStep = HERO_MAX_STEP_PER_FRAME * k;
        const step = nextPX - s.playerX;
        if (Math.abs(step) > maxStep) {
          nextPX = s.playerX + Math.sign(step) * maxStep;
        }
        s.playerX = clampPlayerLeft(nextPX);
        if (
          !isDraggingRef.current &&
          Math.abs(s.playerXTarget - s.playerX) < 0.4
        ) {
          s.playerXTarget = s.playerX;
        }

        const desiredSteer = clampPlayerSteerY(s.playerSteerYTarget, s.playerY);
        let nextSteer =
          s.playerSteerY + (desiredSteer - s.playerSteerY) * t;
        const steerStep = nextSteer - s.playerSteerY;
        if (Math.abs(steerStep) > maxStep) {
          nextSteer = s.playerSteerY + Math.sign(steerStep) * maxStep;
        }
        s.playerSteerY = clampPlayerSteerY(nextSteer, s.playerY);
        if (
          !isDraggingRef.current &&
          Math.abs(s.playerSteerYTarget - s.playerSteerY) < 0.4
        ) {
          s.playerSteerYTarget = s.playerSteerY;
        }

        // Update press shake timer
        if (s.shakeT > 0) {
          s.shakeT -= k;
          if (s.shakeT < 0) s.shakeT = 0;
          s.shakePhase += 0.6 * k;
        }
        const slowMul = nowTs < s.slowTimeUntil ? 0.5 : 1;
        const effObsBase =
          s.speed *
          (nowTs < s.boostUntil ? 1.5 : 1) *
          slowMul *
          pressure.fallSpeedMul;
        const obsArr = s.obstacles;
        for (let i = 0; i < obsArr.length; i++) {
          const obs = obsArr[i];
          let verticalSpeed = effObsBase;
          if (obs.type === "fast") verticalSpeed *= 1.25 + tensionD * 0.35;
          obs.y += verticalSpeed * k;
          if (obs.type === "zigzag") {
            const phase =
              (obs.driftPhase ?? 0) +
              (0.06 + tensionD * 0.06) * (effObsBase / MAX_SPEED_CAP) * 10 * k;
            obs.driftPhase = phase;
            obs.x += Math.sin(phase) * (2.5 + tensionD * 3.0);
          }
        }
        const obsPool = obstaclePoolRef.current;
        compactObstaclesOffScreen(
          obsArr,
          (o) => obsPool.release(o),
          SCREEN_WIDTH,
          SCREEN_HEIGHT,
          GROUND_HEIGHT,
        );

        const patternCoinScratch = s.patternCoinScratch;
        patternCoinScratch.length = 0;

        s.spawnCooldown -= k;
        if (s.spawnCooldown <= 0) {
          const burstActive = pressure.dangerBurstActive;
          const phaseMul =
            DIFFICULTY_PHASES[patternPhase].spawnIntervalMul *
            (burstActive ? DANGER_SPAWN_COMPRESSION : 1);
          const runnerInt = obstacleSpawnIntervalFrames(elapsedSec);
          const zObs = zoneObstacleRateForSpawn(zone.obstacleRateMult);
          const blended = Math.max(
            RUNNER_SPAWN_MIN_INTERVAL_FRAMES,
            Math.floor((runnerInt * phaseMul) / Math.max(0.55, zObs)),
          );
          const inViewport = () =>
            countObstaclesInPlayViewport(SCREEN_WIDTH, SCREEN_HEIGHT, obsArr);

          if (inViewport() >= MAX_ON_SCREEN_OBSTACLES) {
            s.spawnCooldown = 10 + Math.random() * Math.max(8, blended * 0.22);
          } else {
            s.spawnCooldown =
              blended + Math.random() * Math.max(6, blended * 0.14);

            if (obsArr.length < MAX_ACTIVE_OBSTACLES) {
              const patternId = pickObstaclePattern(patternPhase, Math.random);
              const specs = materializeObstaclePattern(
                patternId,
                patternPhase,
                Math.random,
              );
              if (specs.length > 0) s.lastHazardLane = specs[0].lane;
              for (const sp of specs) {
                if (obsArr.length >= MAX_ACTIVE_OBSTACLES) break;
                if (inViewport() >= MAX_ON_SCREEN_OBSTACLES) break;
                const baseSize =
                  OBSTACLE_SIZE_MIN +
                  Math.random() * (OBSTACLE_SIZE_MAX - OBSTACLE_SIZE_MIN);
                const size = baseSize * (1 + tensionD * 0.18);
                const type = sp.type;
                const visual = sp.visual;
                const width =
                  type === "wide" ? size * (1.22 + tensionD * 0.16) : size;
                const { w: visW, h: visH } = obstacleHitSize(
                  visual,
                  width,
                  type === "wide",
                );
                const rHit = obstacleCollisionRect({
                  x: 0,
                  y: 0,
                  size: width,
                  type,
                  visual,
                });
                const startX = LANE_GEOM.obstacleLeftFromLane(sp.lane, visW);
                const ob = obsPool.acquire();
                ob.id = allocEntityId();
                ob.x = startX;
                ob.y = -size - 20 + sp.yExtra;
                ob.size = width;
                ob.type = type;
                ob.visual = visual;
                ob.lane = sp.lane;
                ob.visW = visW;
                ob.visH = visH;
                ob.hitOffX = rHit.x;
                ob.hitOffY = rHit.y;
                ob.hitW = rHit.w;
                ob.hitH = rHit.h;
                ob.driftPhase = Math.random() * Math.PI * 2;
                obsArr.push(ob);
              }

              if (patternId === "lowBarrierThenCoinTrail" && specs[0]) {
                const hazardLane = specs[0].lane;
                const spacing =
                  COIN_SPACING_BASE + s.speed * COIN_SPACING_SPEED_FACTOR;
                const bonus = materializeCoinPattern({
                  kind: "straight",
                  phaseIndex: coinPatternPhase,
                  screenW: SCREEN_WIDTH,
                  coinSize: COIN_SIZE,
                  playerW: PLAYER_WIDTH,
                  coinSpacing: spacing * 1.05,
                  preferredLane: (hazardLane + 1) % 3,
                  hazardLane,
                  laneMargin: LANE_MARGIN,
                  rng: Math.random,
                });
                const cPoolPat = coinPoolRef.current;
                for (let i = 0; i < bonus.length; i++) {
                  const c = cPoolPat.acquire();
                  c.id = allocEntityId();
                  c.x = bonus[i].x;
                  c.y = bonus[i].y;
                  c.size = bonus[i].size;
                  patternCoinScratch.push(c);
                }
              }

              if (
                inViewport() < MAX_ON_SCREEN_OBSTACLES &&
                obsArr.length < MAX_ACTIVE_OBSTACLES &&
                patternPhase >= 2 &&
                Math.random() <
                  pressure.duoSpawnChance * 0.45 * Math.min(1.2, zObs / 1.15)
              ) {
                const extra = materializeObstaclePattern(
                  "singleBlock",
                  patternPhase,
                  Math.random,
                )[0];
                if (extra && inViewport() < MAX_ON_SCREEN_OBSTACLES) {
                  const baseSize =
                    OBSTACLE_SIZE_MIN +
                    Math.random() * (OBSTACLE_SIZE_MAX - OBSTACLE_SIZE_MIN);
                  const size = baseSize * (1 + tensionD * 0.12);
                  const width =
                    extra.type === "wide"
                      ? size * (1.2 + tensionD * 0.12)
                      : size;
                  const { w: visW2, h: visH2 } = obstacleHitSize(
                    extra.visual,
                    width,
                    extra.type === "wide",
                  );
                  const rHit2 = obstacleCollisionRect({
                    x: 0,
                    y: 0,
                    size: width,
                    type: extra.type,
                    visual: extra.visual,
                  });
                  const ob2 = obsPool.acquire();
                  ob2.id = allocEntityId();
                  ob2.x = LANE_GEOM.obstacleLeftFromLane(extra.lane, visW2);
                  ob2.y = -size - 62;
                  ob2.size = width;
                  ob2.type = extra.type;
                  ob2.visual = extra.visual;
                  ob2.lane = extra.lane;
                  ob2.visW = visW2;
                  ob2.visH = visH2;
                  ob2.hitOffX = rHit2.x;
                  ob2.hitOffY = rHit2.y;
                  ob2.hitW = rHit2.w;
                  ob2.hitH = rHit2.h;
                  ob2.driftPhase = Math.random() * Math.PI * 2;
                  obsArr.push(ob2);
                }
              }
            }
          }
        }

        if (s.nearMissCooldown > 0) {
          s.nearMissCooldown -= k;
          if (s.nearMissCooldown < 0) s.nearMissCooldown = 0;
        }

        const pwY = playerWorldYOffset(s);
        const pLeft = s.playerX;
        const pRight = s.playerX + PLAYER_WIDTH;
        const pTop =
          SCREEN_HEIGHT - (GROUND_HEIGHT + pwY + PLAYER_HEIGHT);
        const pBottom = SCREEN_HEIGHT - (GROUND_HEIGHT + pwY);
        const canDie = nowTs >= s.hitGraceUntil && nowTs >= s.ghostPhaseUntil;
        const scanNearMiss = s.nearMissCooldown === 0;
        const playerLane = nearestLaneIndex(s.playerX);
        let died = false;
        if (canDie || scanNearMiss) {
          let hit = false;
          let nearHit = false;
          forEachObstacleInVerticalBand(
            obsArr,
            pTop,
            pBottom,
            150,
            (obs) => {
              if (!obstacleBroadphaseX(obs, pLeft, pRight)) return;
              if (scanNearMiss && !nearHit) {
                if (
                  nearMissCheck({
                    pLeft,
                    pRight,
                    pTop,
                    pBottom,
                    oLeft: obs.x,
                    oRight: obs.x + obs.visW,
                    oTop: obs.y,
                    oBottom: obs.y + obs.visH,
                  })
                ) {
                  const nm = Math.floor(
                    nearMissScore(pressure.phaseIndex) *
                      pressure.feverScoreMult *
                      (nowTs < s.x2Until ? 2 : 1),
                  );
                  s.pickupScore += nm;
                  s.feverMeter = feverMeterAddClamped(
                    s.feverMeter,
                    FEVER_METER_PER_NEAR_MISS,
                  );
                  s.nearMissCooldown = NEAR_MISS_COOLDOWN_FRAMES;
                  nearHit = true;
                }
              }
              if (canDie && !hit && collides(pwY, s.playerX, obs)) {
                hit = true;
              }
            },
            (obs) =>
              obstacleLaneRelevantForPlayer(obs.lane, obs.type, playerLane),
          );
          if (canDie) {
            died = hit;
          }
        }

        const effSpeed =
          s.speed *
          (nowTs < s.boostUntil ? 1.75 : 1) *
          slowMul *
          pressure.fallSpeedMul;
        const puArr = s.powerUps;
        for (let i = 0; i < puArr.length; i++) {
          const pu = puArr[i];
          pu.y += effSpeed * 0.95 * k;
          if (nowTs < s.magnetUntil) {
            const px = s.playerX + PLAYER_WIDTH / 2;
            const py =
              SCREEN_HEIGHT - (GROUND_HEIGHT + pwY + PLAYER_HEIGHT / 2);
            const ox = pu.x + pu.size / 2;
            const oy = pu.y + pu.size / 2;
            const dx = px - ox;
            const dy = py - oy;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const radius = 280;
            if (dist < radius) {
              const pull = (1 - dist / radius) * (10.0 + tensionD * 6.0);
              pu.x += (dx / dist) * pull * k;
              pu.y += (dy / dist) * pull * k;
              if (dist < 20) {
                pu.x = px - pu.size / 2;
                pu.y = py - pu.size / 2;
              }
            }
          }
        }
        const powPool = powerPoolRef.current;
        compactPowerUpsOffScreen(
          puArr,
          (p) => powPool.release(p),
          SCREEN_WIDTH,
          SCREEN_HEIGHT,
          GROUND_HEIGHT,
        );

        const coinArr = s.coins;
        const cPoolMain = coinPoolRef.current;
        for (let d = 0; d < patternCoinScratch.length; d++) {
          if (coinArr.length >= MAX_ACTIVE_COINS) break;
          coinArr.push(patternCoinScratch[d]);
        }
        for (let i = 0; i < coinArr.length; i++) {
          const co = coinArr[i];
          co.y += effSpeed * k;
          if (nowTs < s.magnetUntil) {
            const px = s.playerX + PLAYER_WIDTH / 2;
            const py =
              SCREEN_HEIGHT - (GROUND_HEIGHT + pwY + PLAYER_HEIGHT / 2);
            const ox = co.x + co.size / 2;
            const oy = co.y + co.size / 2;
            const dx = px - ox;
            const dy = py - oy;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const radius = 320;
            if (dist < radius) {
              const pull = (1 - dist / radius) * (12.0 + tensionD * 6.0);
              co.x += (dx / dist) * pull * k;
              co.y += (dy / dist) * pull * k;
              if (dist < 24) {
                co.x = px - co.size / 2;
                co.y = py - co.size / 2;
              }
            }
          }
        }
        compactCoinsOffScreen(
          coinArr,
          (c) => cPoolMain.release(c),
          SCREEN_WIDTH,
          SCREEN_HEIGHT,
          GROUND_HEIGHT,
        );

        s.powerSpawnCooldown -= k;
        if (s.powerSpawnCooldown <= 0) {
          s.powerSpawnCooldown = Math.max(
            115,
            Math.floor((240 + Math.random() * 340) * pressure.powerCooldownMul),
          );
          if (puArr.length < MAX_ACTIVE_POWERUPS) {
            const type = pickPowerUpKind();
            const size = POWERUP_WORLD_SIZE;
            const startX = Math.max(
              8,
              Math.min(SCREEN_WIDTH - size - 8, Math.random() * SCREEN_WIDTH),
            );
            const pu = powPool.acquire();
            pu.id = allocEntityId();
            pu.x = startX;
            pu.y = -size - 12;
            pu.size = size;
            pu.type = type;
            puArr.push(pu);
          }
        }

        const baseCurve = runnerSpeedFromElapsedSec(elapsedSec);
        const targetSpeed = Math.min(
          MAX_SPEED_CAP,
          Math.max(RUNNER_START_SPEED, baseCurve * zone.speedMult),
        );
        const speedLerp = Math.min(1, ZONE_SPEED_LERP * k);
        s.speed += (targetSpeed - s.speed) * speedLerp;
        const stepWallMs = stepWallMsForK(k);
        s.runDistance +=
          s.speed * RUN_DISTANCE_PER_SPEED_SECOND * (stepWallMs / 1000);

        if (!s.feverActive) {
          s.feverMeter = feverMeterPassiveTick(
            s.feverMeter,
            false,
            pressure.tension01,
          );
          const si = Math.floor(s.survivalFrames);
          for (let i = s.lastSurvivalSi + 1; i <= si; i++) {
            if (i > 0 && i % FEVER_METER_SURVIVAL_CHUNK_FRAMES === 0) {
              s.feverMeter = feverMeterAddClamped(
                s.feverMeter,
                FEVER_METER_SURVIVAL_CHUNK,
              );
            }
          }
          s.lastSurvivalSi = si;
          if (s.feverMeter >= FEVER_METER_MAX) {
            const f = startFever(pressure.phaseIndex, comboTier);
            s.feverActive = true;
            s.feverMultiplier = f.mult;
            s.feverDurationMs = f.until;
            s.feverUntil = nowTs + f.until;
            s.feverIntroUntil = nowTs + 900;
            s.feverMeter = FEVER_METER_MAX;
          }
        } else {
          const remain = Math.max(0, s.feverUntil - nowTs);
          const denom = Math.max(1, s.feverDurationMs);
          s.feverMeter = Math.max(0, (remain / denom) * FEVER_METER_MAX);
          if (remain <= 0) {
            s.feverActive = false;
            s.feverMultiplier = 1;
            s.feverUntil = 0;
            s.feverDurationMs = 0;
            s.feverMeter = 0;
          }
        }

        if (died) {
          // Shield absorbs one hit: clear shield, remove overlapping obstacles, and grant brief invulnerability
          if (nowTs < s.shieldUntil) {
            s.shieldUntil = 0;
            s.hitGraceUntil = nowTs + 600;
            const oa = s.obstacles;
            let ow = 0;
            for (let i = 0; i < oa.length; i++) {
              const ob = oa[i];
              if (collides(pwY, s.playerX, ob)) {
                obsPool.release(ob);
                continue;
              }
              if (ow !== i) oa[ow] = ob;
              ow++;
            }
            oa.length = ow;
            died = false;
          }
        }
        if (died) fatalDied = true;

        // Collect power-ups (compact in place — no per-hit filter allocations)
        let puCollectW = 0;
        for (let pi = 0; pi < s.powerUps.length; pi++) {
          const pu = s.powerUps[pi];
          if (collidesPower(pwY, s.playerX, pu)) {
            const { type } = pu;
            const d = POWERUP_DEFS[type];
            s.pickupFlashKind = type;
            s.pickupFlashToken += 1;
            switch (type) {
              case "shield":
                s.shieldUntil = nowTs + d.durationMs;
                break;
              case "multiplier":
                s.x2Until = nowTs + d.durationMs;
                break;
              case "magnet":
                s.magnetUntil = nowTs + d.durationMs;
                break;
              case "boost":
                s.boostUntil = nowTs + d.durationMs;
                break;
              case "slowTime":
                s.slowTimeUntil = nowTs + d.durationMs;
                break;
              case "ghostPhase":
                s.ghostPhaseUntil = nowTs + d.durationMs;
                break;
              case "coinBurst": {
                const burst = 12 + Math.floor(Math.random() * 9);
                s.coinsCollected += burst;
                s.coinsEarnedThisRun += burst;
                scheduleCoinPersist();
                s.pickupScore += Math.floor(
                  (160 + Math.floor(Math.random() * 140)) *
                    pressure.feverScoreMult *
                    (nowTs < s.x2Until ? 2 : 1),
                );
                break;
              }
              default:
                break;
            }
            getAudioManager().playPowerup();
            if (!s.feverActive) {
              s.feverMeter = feverMeterAddClamped(
                s.feverMeter,
                FEVER_METER_PER_POWER_PICKUP,
              );
            }
            powPool.release(pu);
            continue;
          }
          s.powerUps[puCollectW++] = pu;
        }
        s.powerUps.length = puCollectW;

        s.coinSpawnCooldown -= k;
        if (s.coinSpawnCooldown <= 0 && s.coins.length < MAX_ACTIVE_COINS) {
          s.coinSpawnCooldown = Math.max(
            58,
            Math.floor(
              ((145 + Math.random() * 130) * pressure.coinCooldownMul) /
                Math.max(0.65, zone.coinRiskMult),
            ),
          );
          const spacing =
            COIN_SPACING_BASE + s.speed * COIN_SPACING_SPEED_FACTOR;
          const kind = pickCoinPattern(coinPatternPhase, Math.random);
          const spawned = materializeCoinPattern({
            kind,
            phaseIndex: coinPatternPhase,
            screenW: SCREEN_WIDTH,
            coinSize: COIN_SIZE,
            playerW: PLAYER_WIDTH,
            coinSpacing: spacing,
            preferredLane: nearestLaneIndex(s.playerX),
            hazardLane: s.lastHazardLane,
            laneMargin: LANE_MARGIN,
            rng: Math.random,
          });
          for (let si = 0; si < spawned.length; si++) {
            if (s.coins.length >= MAX_ACTIVE_COINS) break;
            const row = spawned[si];
            const cn = cPoolMain.acquire();
            cn.id = allocEntityId();
            cn.x = row.x;
            cn.y = row.y;
            cn.size = row.size;
            s.coins.push(cn);
          }
        }

        if (s.coins.length > Math.max(10, MAX_ACTIVE_COINS - 2)) {
          dedupeCoinsInPlace(s.coins, (c) => coinPoolRef.current.release(c));
        }

        let coinCollectW = 0;
        for (let ci = 0; ci < s.coins.length; ci++) {
          const c = s.coins[ci];
          if (collidesCoin(pwY, s.playerX, c)) {
            s.coinsCollected += 1;
            s.coinsEarnedThisRun += 1;
            scheduleCoinPersist();
            getAudioManager().playCoin();
            const coinPts = Math.floor(
              (nowTs < s.x2Until ? 40 : 20) *
                pressure.feverScoreMult *
                pressure.comboScoreMult,
            );
            s.pickupScore += coinPts;
            if (!s.feverActive) {
              s.feverMeter = feverMeterAddClamped(
                s.feverMeter,
                FEVER_METER_PER_COIN,
              );
            }
            cPoolMain.release(c);
            continue;
          }
          s.coins[coinCollectW++] = c;
        }
        s.coins.length = coinCollectW;

        if (fatalDied) break;
      }

      s.score = Math.floor(s.runDistance) + s.pickupScore;

      const dChk = Math.floor(s.runDistance);
      const cChk = s.coinsEarnedThisRun;
      if (
        dChk !== lastMilestoneCheckRef.current.d ||
        cChk !== lastMilestoneCheckRef.current.c
      ) {
        lastMilestoneCheckRef.current = { d: dChk, c: cChk };
        const distBest = Math.max(bestRunStatsRef.current.distanceM, dChk);
        const coinsBest = Math.max(bestRunStatsRef.current.runCoins, cChk);
        const merged = mergeMilestoneUnlocks(
          s.ownedSkins,
          distBest,
          coinsBest,
        );
        const prevS = new Set(s.ownedSkins);
        if (merged.some((id) => !prevS.has(id))) {
          s.ownedSkins = merged;
          void AsyncStorage.setItem(
            OWNED_SKINS_KEY,
            JSON.stringify(merged),
          ).catch(() => {});
          setUiEpoch((e) => e + 1);
        }
      }

      const zoneAfterLoop = getRunnerZoneByDistance(s.runDistance);
      if (zoneAfterLoop.index > s.lastAnnouncedZoneIndex && s.runTick > 12) {
        s.lastAnnouncedZoneIndex = zoneAfterLoop.index;
        getAudioManager().playZoneUp();
        setZoneBanner({ id: nowTs, zoneNumber: zoneAfterLoop.zone });
      }

      const vis = fillRenderVisible(
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        s.obstacles,
        s.coins,
        s.powerUps,
        s._visObs,
        s._visCoins,
        s._visPow,
      );
      s._visObsN = vis.obsN;
      s._visCoinsN = vis.coinN;
      s._visPowN = vis.powN;

      packVisibleIntoEntityPosSV(
        s._visObs,
        s._visObsN,
        (o) => ({ x: o.x, y: o.y }),
        obsPosScratchRef,
        obsAliveRef,
        obsPositionsSV,
      );
      packVisibleIntoEntityPosSV(
        s._visCoins,
        s._visCoinsN,
        (c) => ({ x: c.x, y: c.y }),
        coinPosScratchRef,
        coinAliveRef,
        coinPositionsSV,
      );
      packVisibleIntoEntityPosSV(
        s._visPow,
        s._visPowN,
        (pu) => {
          const po = powerUpWorldRenderOutset(pu.size);
          return { x: pu.x - po, y: pu.y - po };
        },
        powerPosScratchRef,
        powerAliveRef,
        powerPositionsSV,
      );

      const os = visibleEntitySig(s._visObs, s._visObsN);
      if (os !== obsSigRef.current) {
        obsSigRef.current = os;
        setObsRenderSpecs(buildObstacleRenderSpecs(s._visObs, s._visObsN));
      }
      const cs = visibleEntitySig(s._visCoins, s._visCoinsN);
      if (cs !== coinSigRef.current) {
        coinSigRef.current = cs;
        setCoinRenderSpecs(buildCoinRenderSpecs(s._visCoins, s._visCoinsN));
      }
      const ps = visibleEntitySig(s._visPow, s._visPowN);
      if (ps !== powSigRef.current) {
        powSigRef.current = ps;
        setPowerRenderSpecs(buildPowerRenderSpecs(s._visPow, s._visPowN));
      }

      heroLeftSV.value =
        s.playerX +
        (s.shakeT > 0 ? Math.sin(s.shakePhase) * (s.shakeT * 0.4) : 0);
      heroBottomSV.value = GROUND_HEIGHT + playerWorldYOffset(s);

      if (nowPerf - lastHudPushRef.current >= HUD_SCORE_THROTTLE_MS) {
        lastHudPushRef.current = nowPerf;
        const sc = s.score;
        const df = Math.floor(s.runDistance);
        if (sc !== lastHudScoreRef.current || df !== lastHudDistRef.current) {
          lastHudScoreRef.current = sc;
          lastHudDistRef.current = df;
          setRunHud({ score: sc, distanceFloor: df });
        }
      }

      const wx = `${s.dangerVisual}|${s.feverActive ? 1 : 0}`;
      if (wx !== lastWorldFxKeyRef.current) {
        lastWorldFxKeyRef.current = wx;
        setWorldFx({
          dangerVisual: s.dangerVisual,
          feverActive: s.feverActive,
        });
      }

      let fx = 0;
      if (s.dangerVisual !== "none") fx++;
      if (s.feverActive) fx++;
      if (nowTs < s.shieldUntil) fx++;
      if (nowTs < s.x2Until) fx++;
      if (nowTs < s.magnetUntil) fx++;
      if (nowTs < s.boostUntil) fx++;
      if (nowTs < s.ghostPhaseUntil) fx++;

      perfSamplerRef.current.recordFrame(nowPerf);
      if (nowPerf - lastPerfUiRef.current >= PERF_UI_REFRESH_MS) {
        lastPerfUiRef.current = nowPerf;
        const st = perfSamplerRef.current.getStats(s.obstacles.length, fx);
        if (st.visualTier !== lastPerfVisualTierRef.current) {
          lastPerfVisualTierRef.current = st.visualTier;
          setVisualTier(st.visualTier);
        }
        if (DEBUG_PERF_OVERLAY) setPerfStats(st);
      }

      if (fatalDied) {
        persistSavedCoins(s.coinsCollected);
        const distM = Math.floor(s.runDistance);
        const runCoinsSnap = s.coinsEarnedThisRun;
        const ownedSnap = [...s.ownedSkins];
        void (async () => {
          try {
            const cur = await loadBestSingleRunStats();
            const next = {
              distanceM: Math.max(cur.distanceM, distM),
              runCoins: Math.max(cur.runCoins, runCoinsSnap),
            };
            await persistBestSingleRunStats(next);
            bestRunStatsRef.current = next;
            setShopBestStats(next);
            const merged = mergeMilestoneUnlocks(
              ownedSnap,
              next.distanceM,
              next.runCoins,
            );
            const prevS = new Set(ownedSnap);
            if (merged.some((id) => !prevS.has(id))) {
              await AsyncStorage.setItem(
                OWNED_SKINS_KEY,
                JSON.stringify(merged),
              ).catch(() => {});
            }
          } catch {
            /* ignore */
          }
        })();
        setGameOver(true);
        const final = s.score;
        setHighScore((prev) => {
          const next = Math.max(prev, final);
          if (next > prev) {
            AsyncStorage.setItem(HIGH_SCORE_KEY, String(next)).catch(() => {});
          }
          return next;
        });
        void AsyncStorage.getItem(TOTAL_RUNS_KEY).then((raw) => {
          const b = raw ? parseInt(raw, 10) : 0;
          const base = Number.isNaN(b) ? 0 : b;
          AsyncStorage.setItem(TOTAL_RUNS_KEY, String(base + 1)).catch(
            () => {},
          );
        });
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (coinPersistTimerRef.current != null) {
        clearTimeout(coinPersistTimerRef.current);
        coinPersistTimerRef.current = null;
      }
      persistSavedCoins(sim.current.coinsCollected);
    };
  }, [gameOver, scheduleCoinPersist]);

  void uiEpoch;

  const onStartShouldSetHeroResponder = useCallback(
    (e: GestureResponderEvent) => {
      if (gameOver || paused || sim.current.shopOpen || runPausedRef.current) {
        return false;
      }
      const layout = gameLayoutRef.current;
      const lw = layout && layout.w > 0 ? layout.w : SCREEN_WIDTH;
      const lh = layout && layout.h > 0 ? layout.h : SCREEN_HEIGHT;
      return isTouchInsideHeroDragStart(
        e.nativeEvent.locationX,
        e.nativeEvent.locationY,
        lw,
        lh,
        sim.current,
      );
    },
    [gameOver, paused],
  );

  const onResponderGrant = useCallback((e: GestureResponderEvent) => {
    const layout = gameLayoutRef.current;
    const lw = layout && layout.w > 0 ? layout.w : SCREEN_WIDTH;
    const lh = layout && layout.h > 0 ? layout.h : SCREEN_HEIGHT;
    const s0 = sim.current;
    // Cache window-relative geometry so we can prefer `pageY` (more stable near system nav areas)
    // over `locationY` (can jump to 0 on some devices when finger goes below the view).
    containerRef.current?.measureInWindow((x, y, w, h) => {
      if (w > 0 && h > 0) containerWinRef.current = { x, y, w, h };
    });

    const fingerSX = touchLocationXToScreenX(e.nativeEvent.locationX, lw);
    const fingerSY = touchLocationYToScreenY(e.nativeEvent.locationY, lh);
    const centerSX = s0.playerX + PLAYER_WIDTH / 2;
    const centerSY =
      SCREEN_HEIGHT -
      (GROUND_HEIGHT + s0.playerSteerY + s0.playerY + PLAYER_HEIGHT / 2);
    touchOffsetRef.current = fingerSX - centerSX;
    touchOffsetYRef.current = fingerSY - centerSY;
    isDraggingRef.current = true;
    lastFingerXRef.current = fingerSX;
    lastFingerYRef.current = fingerSY;
    const desiredCenterX = fingerSX - touchOffsetRef.current;
    const desiredCenterY = fingerSY - touchOffsetYRef.current;
    s0.playerXTarget = clampPlayerLeft(desiredCenterX - PLAYER_WIDTH / 2);
    s0.playerSteerYTarget = clampPlayerSteerY(
      SCREEN_HEIGHT -
        desiredCenterY -
        PLAYER_HEIGHT / 2 -
        GROUND_HEIGHT -
        s0.playerY,
      s0.playerY,
    );
  }, []);

  const onResponderMove = useCallback((e: GestureResponderEvent) => {
    if (!isDraggingRef.current) return;
    const layout = gameLayoutRef.current;
    const lw = layout && layout.w > 0 ? layout.w : SCREEN_WIDTH;
    const lh = layout && layout.h > 0 ? layout.h : SCREEN_HEIGHT;
    const win = containerWinRef.current;
    const localX =
      win != null ? e.nativeEvent.pageX - win.x : e.nativeEvent.locationX;
    const localY =
      win != null ? e.nativeEvent.pageY - win.y : e.nativeEvent.locationY;
    const fingerSX = touchLocationXToScreenX(localX, lw);
    const fingerSY = touchLocationYToScreenY(localY, lh);
    if (lastFingerXRef.current == null || lastFingerYRef.current == null) {
      lastFingerXRef.current = fingerSX;
      lastFingerYRef.current = fingerSY;
      return;
    }
    const dx = fingerSX - lastFingerXRef.current;
    const dy = fingerSY - lastFingerYRef.current;
    if (
      Math.abs(dx) < FINGER_DEAD_ZONE_PX &&
      Math.abs(dy) < FINGER_DEAD_ZONE_PX
    ) {
      return;
    }
    lastFingerXRef.current = fingerSX;
    lastFingerYRef.current = fingerSY;
    const s = sim.current;
    const jump = s.playerY;
    const desiredCenterX = fingerSX - touchOffsetRef.current;
    const desiredCenterY = fingerSY - touchOffsetYRef.current;
    s.playerXTarget = clampPlayerLeft(desiredCenterX - PLAYER_WIDTH / 2);
    s.playerSteerYTarget = clampPlayerSteerY(
      SCREEN_HEIGHT -
        desiredCenterY -
        PLAYER_HEIGHT / 2 -
        GROUND_HEIGHT -
        jump,
      jump,
    );
  }, []);

  const onResponderEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const s = sim.current;
    s.playerXTarget = s.playerX;
    s.playerSteerYTarget = s.playerSteerY;
    lastDragEndMsRef.current = Date.now();
    lastFingerXRef.current = null;
    lastFingerYRef.current = null;
  }, []);

  const onGameRootLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    gameLayoutRef.current = { w: width, h: height };
    // Layout changed; drop cached window geometry (will be re-measured on next drag start).
    containerWinRef.current = null;
    setGameLayout((prev) =>
      prev?.w === width && prev?.h === height ? prev : { w: width, h: height },
    );
  }, []);

  return (
    <View style={styles.gameScreenWrapper}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <FuturisticGameplayBackground width={windowW} height={windowH} />
      </View>
      <View style={styles.safe}>
        <GameplayReducedMotion />
        <View style={styles.gameTouchHost}>
          <TouchableWithoutFeedback onPress={handleJump}>
            <View style={styles.gameRoot} onLayout={onGameRootLayout}>
            <View
              ref={(r) => {
                containerRef.current = r;
              }}
              style={styles.container}
              onStartShouldSetResponder={onStartShouldSetHeroResponder}
              onResponderTerminationRequest={() => false}
              onResponderGrant={onResponderGrant}
              onResponderMove={onResponderMove}
              onResponderRelease={onResponderEnd}
              onResponderTerminate={onResponderEnd}
            >
            <AmbientParticles density={visualTier >= 2 ? "low" : "medium"} />
            <GameplayLaneGuide screenW={SCREEN_WIDTH} screenH={SCREEN_HEIGHT} groundH={GROUND_HEIGHT} />
            <PowerActionButton disabled label="Power" />
            {worldFx.dangerVisual === "warn" && visualTier < 3 && (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, styles.fxWashWarn]}
              />
            )}
            {worldFx.dangerVisual === "burst" && visualTier < 3 && (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, styles.fxWashBurst]}
              />
            )}
            {worldFx.feverActive && visualTier < 3 && (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, styles.fxWashFever]}
              />
            )}
            <GameRunHud
              score={runHud.score}
              distanceFloor={runHud.distanceFloor}
              gameOver={gameOver}
              shopOpen={sim.current.shopOpen}
              runPaused={runPaused}
              onToggleRunPause={toggleRunPause}
              onOpenShop={toggleShop}
              onExitToHome={() => {
                getAudioManager().playButtonTap();
                handleExitToHome();
              }}
            />
            {zoneBanner != null && (
              <View
                style={styles.zoneBannerWrap}
                pointerEvents="none"
                key={zoneBanner.id}
              >
                <View style={styles.zoneBanner}>
                  <Text style={styles.zoneBannerTitle}>
                    Zone {zoneBanner.zoneNumber}
                  </Text>
                  <Text style={styles.zoneBannerSub}>
                    Speed up — stay sharp
                  </Text>
                </View>
              </View>
            )}
            {/* Removed bottom deck panel — keep background as one piece. */}
            <HeroGameAnchor
              key={`hero-${runSessionKey}`}
              width={PLAYER_WIDTH}
              height={PLAYER_HEIGHT}
              leftSV={heroLeftSV}
              bottomSV={heroBottomSV}
              qualityTier={Math.max(2, visualTier) as VisualQualityTier}
              skinImage={heroImageForSkinId(sim.current.currentSkin)}
            />
            <ShopModal
              open={sim.current.shopOpen}
              coins={sim.current.coinsCollected}
              ownedSkins={sim.current.ownedSkins}
              currentSkin={sim.current.currentSkin}
              skins={SHOP_SKIN_ROWS}
              bestSingleRunDistanceM={Math.max(
                shopBestStats.distanceM,
                Math.floor(sim.current.runDistance),
              )}
              bestSingleRunCoins={Math.max(
                shopBestStats.runCoins,
                sim.current.coinsEarnedThisRun,
              )}
              onClose={toggleShop}
              onBuyOrEquip={handleBuyOrEquip}
              onWatchVideoForCoins={handleWatchVideoForCoins}
              videoRewardBusy={videoRewardBusy}
              controlButtonStyle={styles.controlButton}
              controlTextStyle={styles.controlText}
            />
            <View
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
              collapsable={false}
            >
              <WorldEntityLayer
                key={`world-${runSessionKey}`}
                obstacleSpecs={obsRenderSpecs}
                coinSpecs={coinRenderSpecs}
                powerSpecs={powerRenderSpecs}
                obsPositions={obsPositionsSV}
                coinPositions={coinPositionsSV}
                powerPositions={powerPositionsSV}
              />
            </View>

            {HITBOX_OVERLAY_ENABLED ? (
              <HitboxDebugOverlay
                screenHeight={SCREEN_HEIGHT}
                groundHeight={GROUND_HEIGHT}
                playerX={sim.current.playerX}
                playerY={playerWorldYOffset(sim.current)}
                playerWidth={PLAYER_WIDTH}
                playerHeight={PLAYER_HEIGHT}
                obstacles={sim.current.obstacles}
              />
            ) : null}

            <ActivePowerUpsHud
              shieldUntil={sim.current.shieldUntil}
              multiplierUntil={sim.current.x2Until}
              magnetUntil={sim.current.magnetUntil}
              boostUntil={sim.current.boostUntil}
              slowTimeUntil={sim.current.slowTimeUntil}
              ghostPhaseUntil={sim.current.ghostPhaseUntil}
            />
            <PowerPickupFlash
              kind={sim.current.pickupFlashKind}
              token={sim.current.pickupFlashToken}
            />

            <PauseRibbon
              visible={runPaused && !gameOver && !sim.current.shopOpen}
            />

            {gameOver ? (
              <GameOverOverlay
                score={sim.current.score}
                runDistance={sim.current.runDistance}
                coinsCollected={sim.current.coinsCollected}
                pickupScore={sim.current.pickupScore}
                reviveVideoBusy={reviveVideoBusy}
                onReviveVideo={handleReviveVideo}
                onRetry={() => {
                  getAudioManager().playButtonTap();
                  handleRetry();
                }}
                onExitToHome={() => {
                  getAudioManager().playButtonTap();
                  handleExitToHome();
                }}
              />
            ) : null}
          </View>
          {DEBUG_PERF_OVERLAY ? (
            <View pointerEvents="none" style={styles.fpsDebugWrap}>
              <FpsPerfOverlay visible stats={perfStats} />
            </View>
          ) : null}
          </View>
          </TouchableWithoutFeedback>
        </View>
        {showBannerAds ? (
          <View
            style={[
              styles.gameAdDock,
              { minHeight: gameAdReserve, paddingBottom: insets.bottom },
            ]}
          >
            <View style={styles.gameAdHairline} />
            <HomeScreenBanner />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function App() {
  const [showHome, setShowHome] = useState(true);
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [homeShopOpen, setHomeShopOpen] = useState(false);
  const [homeShopCoins, setHomeShopCoins] = useState(0);
  const [homeOwnedSkins, setHomeOwnedSkins] = useState<string[]>(["classic"]);
  const [homeCurrentSkin, setHomeCurrentSkin] = useState("classic");
  const [homeVideoBusy, setHomeVideoBusy] = useState(false);
  const [homeBestRunStats, setHomeBestRunStats] = useState<BestSingleRunStats>({
    distanceM: 0,
    runCoins: 0,
  });

  useEffect(() => {
    if (DEV_GRANT_COINS_ON_LAUNCH > 0) {
      persistSavedCoins(DEV_GRANT_COINS_ON_LAUNCH);
    }
  }, []);

  useEffect(() => {
    void getAudioManager().preload();
  }, []);

  useEffect(() => {
    if (!showHome) return;
    let cancelled = false;
    void (async () => {
      try {
        const [raw, rawOwned, br] = await Promise.all([
          AsyncStorage.getItem(SAVED_COINS_KEY),
          AsyncStorage.getItem(OWNED_SKINS_KEY),
          loadBestSingleRunStats(),
        ]);
        if (cancelled) return;
        const n = raw != null ? parseInt(raw, 10) : 0;
        setHomeShopCoins(Number.isNaN(n) ? 0 : Math.max(0, n));
        setHomeBestRunStats(br);
        let owned: string[] = ["classic"];
        if (rawOwned) {
          try {
            const parsed = JSON.parse(rawOwned);
            if (Array.isArray(parsed)) owned = parsed;
          } catch {
            /* ignore */
          }
        }
        const merged = mergeMilestoneUnlocks(
          owned,
          br.distanceM,
          br.runCoins,
        );
        const prevS = new Set(owned);
        if (merged.some((id) => !prevS.has(id))) {
          await AsyncStorage.setItem(
            OWNED_SKINS_KEY,
            JSON.stringify(merged),
          ).catch(() => {});
          setHomeOwnedSkins(merged);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showHome]);

  const openHomeShop = useCallback(() => {
    getAudioManager().playButtonTap();
    void (async () => {
      try {
        const [rawOwned, rawCurrent, rawCoins, br] = await Promise.all([
          AsyncStorage.getItem(OWNED_SKINS_KEY),
          AsyncStorage.getItem(CURRENT_SKIN_KEY),
          AsyncStorage.getItem(SAVED_COINS_KEY),
          loadBestSingleRunStats(),
        ]);
        let owned: string[] = ["classic"];
        if (rawOwned) {
          try {
            const parsed = JSON.parse(rawOwned);
            if (Array.isArray(parsed)) owned = parsed;
          } catch {
            /* ignore */
          }
        }
        const merged = mergeMilestoneUnlocks(
          owned,
          br.distanceM,
          br.runCoins,
        );
        const prevS = new Set(owned);
        if (merged.some((id) => !prevS.has(id))) {
          await AsyncStorage.setItem(
            OWNED_SKINS_KEY,
            JSON.stringify(merged),
          ).catch(() => {});
        }
        const current =
          rawCurrent && rawCurrent.length > 0 ? rawCurrent : "classic";
        const coinsParsed = rawCoins != null ? parseInt(rawCoins, 10) : 0;
        setHomeOwnedSkins(merged);
        setHomeCurrentSkin(current);
        setHomeBestRunStats(br);
        setHomeShopCoins(
          Number.isNaN(coinsParsed) ? 0 : Math.max(0, coinsParsed),
        );
      } catch {
        /* keep previous home shop state */
      }
      prepareShopRewardedAd();
      setHomeShopOpen(true);
    })();
  }, []);

  const closeHomeShop = useCallback(() => {
    getAudioManager().playButtonTap();
    setHomeShopOpen(false);
  }, []);

  const handleHomeBuyOrEquip = useCallback(
    (
      skinId: string,
      price: number,
      _variant: ShipVariant,
      _hull: string,
      _sail: string,
    ) => {
      const owned = new Set(homeOwnedSkins);
      const row = SHOP_SKIN_ROWS.find((r) => r.id === skinId);
      if (!owned.has(skinId) && row?.milestone) {
        if (
          !skinMilestoneSatisfied(
            row,
            homeBestRunStats.distanceM,
            homeBestRunStats.runCoins,
          )
        )
          return;
        const next = [...owned, skinId];
        setHomeOwnedSkins(next);
        setHomeCurrentSkin(skinId);
        void AsyncStorage.setItem(OWNED_SKINS_KEY, JSON.stringify(next));
        void AsyncStorage.setItem(CURRENT_SKIN_KEY, skinId);
        return;
      }
      if (owned.has(skinId)) {
        setHomeCurrentSkin(skinId);
        void AsyncStorage.setItem(CURRENT_SKIN_KEY, skinId);
        return;
      }
      if (row?.milestone) return;
      if (homeShopCoins >= price) {
        const nextCoins = homeShopCoins - price;
        const nextOwned = [...owned, skinId];
        setHomeShopCoins(nextCoins);
        setHomeOwnedSkins(nextOwned);
        setHomeCurrentSkin(skinId);
        persistSavedCoins(nextCoins);
        void AsyncStorage.setItem(OWNED_SKINS_KEY, JSON.stringify(nextOwned));
        void AsyncStorage.setItem(CURRENT_SKIN_KEY, skinId);
      }
    },
    [homeOwnedSkins, homeShopCoins, homeBestRunStats],
  );

  const handleHomeWatchVideo = useCallback(() => {
    if (homeVideoBusy) return;
    setHomeVideoBusy(true);
    showShopRewardedForCoins(
      (coins) => {
        setHomeShopCoins((c) => {
          const n = c + coins;
          persistSavedCoins(n);
          return n;
        });
      },
      () => setHomeVideoBusy(false),
    );
  }, [homeVideoBusy]);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "transparent" }}>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <AdsRoot isHome={showHome} canPresentAppOpen={!showHome || splashDismissed} />
      <AppStatusBar />
      <View style={styles.routeHost}>
        {showHome ? (
          <Animated.View
            key="route-home"
            style={styles.routeLayer}
            entering={routeEnterHome}
            exiting={routeExitHome}
          >
            <HomeScreen
              coins={homeShopCoins}
              showBannerAds
              onPlay={() => {
                getAudioManager().playButtonTap();
                setShowHome(false);
              }}
              onOpenShop={openHomeShop}
            />
            {!splashDismissed ? (
              <GameSplashScreen onComplete={() => setSplashDismissed(true)} />
            ) : null}
            <ShopModal
              open={homeShopOpen}
              coins={homeShopCoins}
              ownedSkins={homeOwnedSkins}
              currentSkin={homeCurrentSkin}
              skins={SHOP_SKIN_ROWS}
              bestSingleRunDistanceM={homeBestRunStats.distanceM}
              bestSingleRunCoins={homeBestRunStats.runCoins}
              onClose={closeHomeShop}
              onBuyOrEquip={handleHomeBuyOrEquip}
              onWatchVideoForCoins={handleHomeWatchVideo}
              videoRewardBusy={homeVideoBusy}
              controlButtonStyle={styles.controlButton}
              controlTextStyle={styles.controlText}
            />
          </Animated.View>
        ) : (
          <Animated.View
            key="route-game"
            style={styles.routeLayer}
            entering={routeEnterGame}
            exiting={routeExitGame}
          >
            <GameScreen
              showBannerAds={splashDismissed}
              onExitToHome={() => setShowHome(true)}
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  routeHost: {
    flex: 1,
  },
  routeLayer: {
    flex: 1,
  },
  gameScreenWrapper: {
    flex: 1,
    backgroundColor: "#040816",
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  gameTouchHost: {
    flex: 1,
    minHeight: 0,
  },
  gameRoot: {
    flex: 1,
  },
  gameAdDock: {
    alignSelf: "stretch",
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    zIndex: 4,
  },
  gameAdHairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(56,189,248,0.2)",
    marginHorizontal: scale(24),
    marginBottom: heightPixel(4),
  },
  fpsDebugWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    pointerEvents: "none",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    /** Allow obstacle art / motion to paint outside the flex box (child views use `overflow: "visible"` too). */
    overflow: "visible",
  },
  /** Flat color washes — cheaper than full-screen LinearGradient each frame. */
  fxWashWarn: {
    backgroundColor: "rgba(245,158,11,0.1)",
  },
  fxWashBurst: {
    backgroundColor: "rgba(220,38,38,0.09)",
  },
  fxWashFever: {
    backgroundColor: "rgba(236,72,153,0.06)",
  },
  zoneBannerWrap: {
    position: "absolute",
    top: "18%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 25,
  },
  zoneBanner: {
    paddingHorizontal: scale(22),
    paddingVertical: heightPixel(12),
    borderRadius: scale(14),
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(56,189,248,0.42)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      default: { elevation: 8 },
    }),
  },
  zoneBannerTitle: {
    fontSize: fontPixel(19),
    fontWeight: "800",
    color: "#e0f2fe",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  zoneBannerSub: {
    marginTop: heightPixel(5),
    fontSize: fontPixel(12),
    fontWeight: "600",
    color: "rgba(186,200,220,0.92)",
    textAlign: "center",
  },
  skyTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
    backgroundColor: "#1e3a5f",
  },
  skyMid: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    height: "22%",
    backgroundColor: "#2d4a6f",
  },
  horizon: {
    position: "absolute",
    top: "52%",
    left: 0,
    right: 0,
    height: scale(3),
    backgroundColor: "rgba(255,200,120,0.35)",
  },
  sun: {
    position: "absolute",
    top: "8%",
    right: "10%",
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: "#ffc857",
    shadowColor: "#ffb347",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: scale(24),
    elevation: 8,
  },
  cloud: {
    position: "absolute",
    width: scale(72),
    height: scale(22),
    borderRadius: scale(20),
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  player: {
    position: "absolute",
    left: PLAYER_X,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(6) },
    shadowOpacity: 0.25,
    shadowRadius: scale(4),
    elevation: 4,
  },
  shipHull: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: heightPixel(18),
    backgroundColor: "#8b4513",
    borderTopLeftRadius: scale(6),
    borderTopRightRadius: scale(12),
    borderBottomLeftRadius: scale(10),
    borderBottomRightRadius: scale(2),
    borderWidth: scale(2),
    borderColor: "rgba(0,0,0,0.25)",
  },
  shipMast: {
    position: "absolute",
    bottom: heightPixel(18),
    left: scale(20),
    width: scale(4),
    height: heightPixel(28),
    backgroundColor: "#c0a080",
    borderRadius: scale(2),
  },
  shipSail: {
    position: "absolute",
    bottom: heightPixel(18),
    left: scale(22),
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderLeftWidth: 0,
    borderRightWidth: scale(20),
    borderBottomWidth: scale(22),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#f1f5f9",
  },
  obstacleWrap: {
    position: "absolute",
    bottom: GROUND_HEIGHT,
    alignItems: "center",
  },
  obstacleBody: {
    width: "100%",
    backgroundColor: "#2a2d34",
    borderTopLeftRadius: scale(6),
    borderTopRightRadius: scale(6),
    borderWidth: scale(2),
    borderColor: "rgba(0,0,0,0.35)",
  },
  monsterEye: {
    position: "absolute",
    top: scale(6),
    left: scale(6),
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
  },
  monsterPupil: {
    position: "absolute",
    top: scale(9),
    left: scale(10),
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#000",
    opacity: 0.7,
  },
  monsterFin: {
    position: "absolute",
    top: scale(-6),
    width: 0,
    height: 0,
    borderLeftWidth: scale(8),
    borderRightWidth: scale(8),
    borderBottomWidth: scale(14),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  monsterTeethRow: {
    position: "absolute",
    bottom: scale(-6),
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  monsterTooth: {
    width: 0,
    height: 0,
    borderLeftWidth: scale(4),
    borderRightWidth: scale(4),
    borderTopWidth: scale(8),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
  ground: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: GROUND_HEIGHT,
    backgroundColor: "#0b3d91",
    borderTopWidth: scale(4),
    borderTopColor: "#1aa3ff",
  },
  groundStripe: {
    position: "absolute",
    bottom: heightPixel(28),
    left: 0,
    right: 0,
    height: scale(3),
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  wave: {
    position: "absolute",
    left: 0,
    right: 0,
    height: heightPixel(8),
    backgroundColor: "#1aa3ff",
    borderTopLeftRadius: scale(8),
    borderTopRightRadius: scale(8),
  },
  tapHint: {
    fontSize: fontPixel(14),
    color: "rgba(255,255,255,0.5)",
  },
  controlButton: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.28,
    shadowRadius: scale(6),
    elevation: 4,
    marginLeft: moderateScale(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  controlText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fontPixel(13),
    letterSpacing: 0.45,
  },
  customizeBtn: {
    position: "absolute",
    top: heightPixel(10),
    right: scale(120),
    backgroundColor: "#0ea5e9",
    paddingHorizontal: scale(12),
    paddingVertical: heightPixel(6),
    borderRadius: scale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.25,
    shadowRadius: scale(4),
    elevation: 3,
  },
  customizeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fontPixel(13),
    letterSpacing: 0.5,
  },
  shopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: heightPixel(8),
    paddingHorizontal: scale(10),
    borderRadius: scale(10),
    marginTop: heightPixel(8),
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  modalCard: {
    width: "100%",
    maxWidth: scale(420),
    borderRadius: scale(18),
    backgroundColor: "rgba(18,26,42,0.98)",
    paddingVertical: heightPixel(18),
    paddingHorizontal: scale(16),
    borderWidth: scale(1),
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.35,
    shadowRadius: scale(24),
    elevation: 10,
  },
  modalTitle: {
    fontSize: fontPixel(18),
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  modalSubTitle: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(13),
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});
