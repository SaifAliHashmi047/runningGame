import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import type { ShipVariant } from "./components/Ship";
import HeroGameAnchor from "./components/HeroGameAnchor";
import GameObstacle from "./components/GameObstacle";
import SkyLane from "./components/SkyLane";
import ShopModal from "./components/ShopModal";
import PowerUp from "./components/PowerUp";
import Coin from "./components/Coin";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import HomeScreen from "./src/screens/HomeScreen";
import type { ObstacleVisual } from "./src/game/types";
import {
  aabbOverlap,
  obstacleCollisionAabb,
  obstacleHitSize,
  playerCollisionAabb,
} from "./src/game/hitboxes";
import HitboxDebugOverlay from "./src/ui/HitboxDebugOverlay";
import AnimatedDayCycleBackground from "./src/ui/AnimatedDayCycleBackground";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import type { PowerUpKind } from "./src/game/powers";
import { pickPowerUpKind, POWERUP_DEFS } from "./src/game/powers";
import { ActivePowerUpsHud, PowerPickupFlash } from "./src/ui/powerups";
import AppStatusBar from "./src/ui/AppStatusBar";
import {
  BASE_SPEED,
  MAX_SPEED_CAP,
  OBSTACLE_SIZE_MIN,
  OBSTACLE_SIZE_MAX,
  POWERUP_WORLD_SIZE,
  COIN_SIZE,
  createInitialDangerZone,
  stepDangerZone,
  resolveRunPressure,
  pickWeightedObstacleType,
  applyNewMilestonesOnly,
  speedRampStep,
  survivalComboTier,
  nearMissCheck,
  nearMissScore,
  feverMeterPassiveTick,
  feverMeterAddClamped,
  FEVER_METER_SURVIVAL_CHUNK,
  FEVER_METER_SURVIVAL_CHUNK_FRAMES,
  startFever,
  pickSpawnX,
  shouldRejectStackingSpawn,
  duoSecondX,
  FEVER_METER_MAX,
  FEVER_METER_PER_NEAR_MISS,
  FEVER_METER_PER_COIN,
  FEVER_METER_PER_POWER_PICKUP,
  NEAR_MISS_COOLDOWN_FRAMES,
  getPhaseIndexForScore,
  type DangerVisual,
} from "./src/game/difficulty";
import {
  DEBUG_PERF_OVERLAY,
  MAX_DELTA_MS,
  MAX_FRAME_SCALE,
  PERF_UI_REFRESH_MS,
  TARGET_FRAME_MS,
  type VisualQualityTier,
} from "./src/game/performanceConfig";
import { PerfSampler, type PerfSamplerStats } from "./src/game/performanceSampler";
import { forEachObstacleInVerticalBand } from "./src/game/collisionQueries";
import FpsPerfOverlay from "./src/ui/FpsPerfOverlay";
import { fontPixel, heightPixel, moderateScale, scale, screenHeight, screenWidth } from "./utils/responsive";

/** Background art cycles by score — separate from combat difficulty phase. */
const BG_THEMES = [
  { label: "Zone 1", top: "#0b1730", mid: "#1b3358" },
  { label: "Zone 2", top: "#10243e", mid: "#1e3a5f" },
  { label: "Zone 3", top: "#162744", mid: "#224870" },
  { label: "Zone 4", top: "#1a1b3a", mid: "#3a2758" },
  { label: "Zone 5", top: "#220b2a", mid: "#4a1e5f" },
];
const BG_SCORE_SPAN = 6000;
function getBgThemeIndex(score: number): number {
  return Math.floor(Math.max(0, score) / BG_SCORE_SPAN) % BG_THEMES.length;
}
const SCREEN_WIDTH = screenWidth;
const SCREEN_HEIGHT = screenHeight;

/** Monotonic-ish frame timing (RN Hermes exposes `performance` at runtime; fall back safely). */
const perfNow = (): number => {
  const p = (globalThis as { performance?: { now: () => number } }).performance;
  return typeof p?.now === "function" ? p.now() : Date.now();
};

const HIGH_SCORE_KEY = "@stackRunner/highScore";
const OWNED_SKINS_KEY = "@stackRunner/ownedSkins";
const CURRENT_SKIN_KEY = "@stackRunner/currentSkin";

const GRAVITY = 0.72;
const JUMP_FORCE = 15;
const GROUND_HEIGHT = heightPixel(128);
const PLAYER_X = scale(72);
const PLAYER_WIDTH = scale(48);
const PLAYER_HEIGHT = scale(52);

const OBSTACLE_VISUALS: ObstacleVisual[] = ["laser", "mine", "drone", "crystal"];

type ObstacleType = "block" | "fast" | "wide" | "zigzag";
type Obstacle = {
  id: number;
  x: number;
  y: number;
  size: number;
  type: ObstacleType;
  visual: ObstacleVisual;
  color: string;
  driftPhase?: number;
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

type SimState = {
  playerY: number;
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
  score: number;
  coinsCollected: number;
  paused: boolean;
  holdFreeze: boolean;
  shakeT: number;
  shakePhase: number;
  shieldUntil: number; // ms timestamp
  x2Until: number; // ms timestamp (score/coin multiplier)
  magnetUntil: number;
  boostUntil: number;
  slowTimeUntil: number;
  ghostPhaseUntil: number;
  activatePulseT: number;
  pickupFlashKind: PowerUpKind | null;
  pickupFlashToken: number;
  hitGraceUntil: number; // brief invulnerability after shield pop
  shopOpen: boolean;
  ownedSkins: string[];
  currentSkin: string;
  lastSpawnX: number;
  tick: number;
  feverActive: boolean;
  feverMeter: number; // 0..100
  feverUntil: number;
  feverIntroUntil: number;
  feverMultiplier: number;
  feverDurationMs: number;
  /** Authoritative progression / tension systems (see src/game/difficulty). */
  runTick: number;
  milestoneAppliedCount: number;
  dangerWarnEndAt: number;
  dangerBurstEndAt: number;
  dangerNextEligibleAt: number;
  survivalFrames: number;
  /** Integer survival floor (for fever chunks when `survivalFrames` is fractional). */
  lastSurvivalSi: number;
  nearMissCooldown: number;
  /** Cached from last `resolveRunPressure` for HUD / danger vignettes. */
  dangerVisual: DangerVisual;
};

function collides(playerY: number, playerX: number, obs: Obstacle): boolean {
  const playerBox = playerCollisionAabb({
    playerX,
    playerY,
    playerWidth: PLAYER_WIDTH,
    playerHeight: PLAYER_HEIGHT,
    screenHeight: SCREEN_HEIGHT,
    groundHeight: GROUND_HEIGHT,
  });
  const obsBox = obstacleCollisionAabb(obs);
  return aabbOverlap(playerBox, obsBox);
}

function collidesPower(playerY: number, playerX: number, p: PowerUpItem): boolean {
  const pLeft = playerX;
  const pRight = playerX + PLAYER_WIDTH;
  const pTop = SCREEN_HEIGHT - (GROUND_HEIGHT + playerY + PLAYER_HEIGHT);
  const pBottom = SCREEN_HEIGHT - (GROUND_HEIGHT + playerY);
  // Slightly expand pickup hitbox for better feel
  const pickupPad = 6;
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
  const pickupPad = 4;
  const oLeft = c.x - pickupPad;
  const oRight = c.x + c.size + pickupPad;
  const oTop = c.y - pickupPad;
  const oBottom = c.y + c.size + pickupPad;
  return oLeft < pRight && oRight > pLeft && oTop < pBottom && oBottom > pTop;
}

const initialSim = (): SimState => ({
  playerY: 0,
  playerX: PLAYER_X,
  playerXTarget: PLAYER_X,
  velocity: 0,
  obstacles: [],
  powerUps: [],
  coins: [],
  speed: BASE_SPEED,
  spawnCooldown: 40,
  powerSpawnCooldown: 100,
  coinSpawnCooldown: 90,
  score: 0,
  coinsCollected: 0,
  paused: false,
  holdFreeze: false,
  shakeT: 0,
  shakePhase: 0,
  shieldUntil: 0,
  x2Until: 0,
  magnetUntil: 0,
  boostUntil: 0,
  slowTimeUntil: 0,
  ghostPhaseUntil: 0,
  activatePulseT: 0,
  pickupFlashKind: null,
  pickupFlashToken: 0,
  hitGraceUntil: 0,
  shopOpen: false,
  ownedSkins: ["classic"],
  currentSkin: "classic",
  lastSpawnX: -999,
  tick: 0,
  feverActive: false,
  feverMeter: 0,
  feverUntil: 0,
  feverIntroUntil: 0,
  feverMultiplier: 1,
  feverDurationMs: 0,
  runTick: 0,
  milestoneAppliedCount: 0,
  ...snapshotDangerFields(),
  survivalFrames: 0,
  lastSurvivalSi: 0,
  nearMissCooldown: 0,
  dangerVisual: "none",
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
};

function GameScreen({ onExitToHome }: GameScreenProps) {
  const sim = useRef<SimState>(initialSim());
  const obstacleIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const touchOffsetRef = useRef(0); // finger-to-ship center offset for smooth dragging
  const isDraggingRef = useRef(false);
  const lastDragEndMsRef = useRef(0);
  const lastFingerXRef = useRef<number | null>(null);
  const perfSamplerRef = useRef(new PerfSampler());
  const lastFramePerfRef = useRef(perfNow());
  const lastPerfUiRef = useRef(0);

  const [, setFrame] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [perfStats, setPerfStats] = useState<PerfSamplerStats | null>(null);
  const [visualTier, setVisualTier] = useState<VisualQualityTier>(0);

  const heroLeftSV = useSharedValue(PLAYER_X);
  const heroBottomSV = useSharedValue(GROUND_HEIGHT);
  const heroSteerSV = useSharedValue(0);
  const heroPulseSV = useSharedValue(1);
  const heroMagnetYSV = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
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
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetGame = useCallback(() => {
    sim.current = initialSim();
    obstacleIdRef.current = 0;
    perfSamplerRef.current.reset();
    lastFramePerfRef.current = perfNow();
    lastPerfUiRef.current = 0;
    heroLeftSV.value = PLAYER_X;
    heroBottomSV.value = GROUND_HEIGHT;
    heroSteerSV.value = 0;
    heroPulseSV.value = 1;
    heroMagnetYSV.value = 0;
    setGameOver(false);
    setPaused(false);
    setPerfStats(null);
    setVisualTier(0);
    setFrame((f) => f + 1);
  }, [heroBottomSV, heroLeftSV, heroMagnetYSV, heroPulseSV, heroSteerSV]);

  const handleJump = useCallback(() => {
    if (gameOver) {
      return;
    }
    // If we just dragged, treat as drag-not-tap to avoid accidental jumps
    if (paused || isDraggingRef.current || Date.now() - lastDragEndMsRef.current < 160) return;
    if (sim.current.playerY === 0) {
      sim.current.velocity = JUMP_FORCE;
    }
    // Trigger brief shake when pressing
    sim.current.shakeT = 10;
  }, [gameOver, resetGame, paused]);

  const handleRetry = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const handleExitToHome = useCallback(() => {
    resetGame();
    onExitToHome?.();
  }, [resetGame, onExitToHome]);

  const toggleShop = useCallback(() => {
    const next = !sim.current.shopOpen;
    sim.current.shopOpen = next;
    sim.current.paused = next;
    setPaused(next);
    setFrame((f) => f + 1);
  }, []);

  const handleBuyOrEquip = useCallback((skinId: string, price: number, variant: ShipVariant, hull: string, sail: string) => {
    const s = sim.current;
    const owned = new Set(s.ownedSkins);
    if (owned.has(skinId)) {
      s.currentSkin = skinId;
      AsyncStorage.setItem(CURRENT_SKIN_KEY, skinId).catch(() => {});
      setFrame((f) => f + 1);
      return;
    }
    if (s.coinsCollected >= price) {
      s.coinsCollected -= price;
      const next = [...owned, skinId];
      s.ownedSkins = next;
      s.currentSkin = skinId;
      AsyncStorage.setItem(OWNED_SKINS_KEY, JSON.stringify(next)).catch(() => {});
      AsyncStorage.setItem(CURRENT_SKIN_KEY, skinId).catch(() => {});
      setFrame((f) => f + 1);
    }
  }, []);

  const movePlayerToFingerX = useCallback((x: number) => {
    if (paused || gameOver) return;
    // Maintain the initial finger-to-ship offset so the ship doesn't snap under the finger
    const targetCenter = x - touchOffsetRef.current;
    const clampedCenter = Math.max(PLAYER_WIDTH / 2, Math.min(SCREEN_WIDTH - PLAYER_WIDTH / 2, targetCenter));
    const targetLeft = clampedCenter - PLAYER_WIDTH / 2;
    // Directly set position while dragging for maximum accuracy, and also update target for continuity
    isDraggingRef.current = true;
    sim.current.playerX = targetLeft;
    sim.current.playerXTarget = targetLeft;
    lastFingerXRef.current = x;
    setFrame((f) => f + 1);
  }, [paused, gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const loop = () => {
      const s = sim.current;

      // If paused or holding finger on ship (freeze), do not advance simulation; just keep the UI responsive
      if (s.paused || s.holdFreeze) {
        setFrame((f) => f + 1);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const nowPerf = perfNow();
      const dtMs = Math.min(Math.max(nowPerf - lastFramePerfRef.current, 0.001), MAX_DELTA_MS);
      lastFramePerfRef.current = nowPerf;
      const k = Math.min(dtMs / TARGET_FRAME_MS, MAX_FRAME_SCALE);

      const nowTs = Date.now();
      s.runTick += k;
      s.survivalFrames += k;

      const phaseIdxForDanger = getPhaseIndexForScore(s.score);
      const dz = stepDangerZone(
        {
          warnEndAt: s.dangerWarnEndAt,
          burstEndAt: s.dangerBurstEndAt,
          nextEligibleAt: s.dangerNextEligibleAt,
        },
        { now: nowTs, score: s.score, feverActive: s.feverActive, phaseIndex: phaseIdxForDanger }
      );
      s.dangerWarnEndAt = dz.next.warnEndAt;
      s.dangerBurstEndAt = dz.next.burstEndAt;
      s.dangerNextEligibleAt = dz.next.nextEligibleAt;
      s.score += dz.clearBonus;

      const comboTier = survivalComboTier(s.survivalFrames);
      const pressure = resolveRunPressure({
        score: s.score,
        runTick: s.runTick,
        speed: s.speed,
        now: nowTs,
        dangerWarnEndAt: s.dangerWarnEndAt,
        dangerBurstEndAt: s.dangerBurstEndAt,
        feverActive: s.feverActive,
        feverMultiplier: s.feverMultiplier,
        survivalComboTier: comboTier,
      });
      s.dangerVisual = pressure.dangerVisual;
      const tensionD = pressure.tension01;

      s.velocity -= GRAVITY * k;
      s.playerY += s.velocity * k;
      if (s.playerY < 0) {
        s.playerY = 0;
        s.velocity = 0;
      }

      // Smooth horizontal steering toward target
      const targetX = Math.max(0, Math.min(SCREEN_WIDTH - PLAYER_WIDTH, s.playerXTarget));
      // If not actively dragging, ease toward target; when dragging we already set exact position
      if (!isDraggingRef.current) {
        s.playerX += (targetX - s.playerX) * (1 - Math.pow(1 - 0.35, k));
      }

      // Update press shake timer
      if (s.shakeT > 0) {
        s.shakeT -= k;
        if (s.shakeT < 0) s.shakeT = 0;
        s.shakePhase += 0.6 * k;
      }
      if (s.activatePulseT > 0) {
        s.activatePulseT -= k;
        if (s.activatePulseT < 0) s.activatePulseT = 0;
      }

      const slowMul = nowTs < s.slowTimeUntil ? 0.5 : 1;
      const effObsBase = s.speed * (nowTs < s.boostUntil ? 1.5 : 1) * slowMul * pressure.fallSpeedMul;
      let nextObstacles = s.obstacles.map((obs) => {
        let verticalSpeed = effObsBase;
        if (obs.type === "fast") verticalSpeed *= 1.25 + tensionD * 0.35;
        const nextY = obs.y + verticalSpeed * k;
        let nextX = obs.x;
        if (obs.type === "zigzag") {
          const phase =
            (obs.driftPhase ?? 0) + (0.06 + tensionD * 0.06) * (effObsBase / MAX_SPEED_CAP) * 10 * k;
          nextX = obs.x + Math.sin(phase) * (2.5 + tensionD * 3.0);
          return { ...obs, y: nextY, x: nextX, driftPhase: phase };
        }
        return { ...obs, y: nextY, x: nextX };
      });
      nextObstacles = nextObstacles.filter((obs) => obs.y < SCREEN_HEIGHT + 60);

      s.spawnCooldown -= k;
      if (s.spawnCooldown <= 0) {
        const minInt = pressure.spawnMin;
        const maxInt = pressure.spawnMax;
        s.spawnCooldown = minInt + Math.random() * Math.max(5, maxInt - minInt);
        obstacleIdRef.current += 1;
        const baseSize =
          OBSTACLE_SIZE_MIN + Math.random() * (OBSTACLE_SIZE_MAX - OBSTACLE_SIZE_MIN);
        const size = baseSize * (1 + tensionD * 0.22);
        const type = pickWeightedObstacleType(pressure.phaseIndex, Math.random());
        const color =
          type === "fast"
            ? "#ff3b3b"
            : type === "wide"
            ? "#00d4ff"
            : type === "zigzag"
            ? "#ff7b00"
            : "#9b59ff";
        const visual = OBSTACLE_VISUALS[Math.floor(Math.random() * OBSTACLE_VISUALS.length)];
        const width = type === "wide" ? size * (1.28 + tensionD * 0.18) : size;
        let startX = pickSpawnX({
          width,
          screenW: SCREEN_WIDTH,
          playerX: s.playerX,
          playerW: PLAYER_WIDTH,
          lastSpawnX: s.lastSpawnX,
          tension01: tensionD,
          rng: Math.random,
        });
        if (shouldRejectStackingSpawn(startX, width, nextObstacles, 140)) {
          startX = pickSpawnX({
            width,
            screenW: SCREEN_WIDTH,
            playerX: s.playerX + 80,
            playerW: PLAYER_WIDTH,
            lastSpawnX: s.lastSpawnX,
            tension01: tensionD,
            rng: Math.random,
          });
        }
        s.lastSpawnX = startX;
        nextObstacles = [
          ...nextObstacles,
          {
            id: obstacleIdRef.current,
            x: startX,
            y: -size - 20,
            size: width,
            type,
            visual,
            color,
            driftPhase: Math.random() * Math.PI * 2,
          },
        ];
        const duoRoll = Math.random();
        if (duoRoll < pressure.duoSpawnChance) {
          const otherX = duoSecondX(startX, width, SCREEN_WIDTH, Math.random);
          obstacleIdRef.current += 1;
          const v2 = OBSTACLE_VISUALS[Math.floor(Math.random() * OBSTACLE_VISUALS.length)];
          const t2 = pickWeightedObstacleType(pressure.phaseIndex, Math.random());
          nextObstacles.push({
            id: obstacleIdRef.current,
            x: otherX,
            y: -size - 58,
            size: width * (0.9 + Math.random() * 0.2),
            type: t2 === "block" ? "zigzag" : t2,
            visual: v2,
            color,
            driftPhase: Math.random() * Math.PI * 2,
          });
        }
      }

      const pLeft = s.playerX;
      const pRight = s.playerX + PLAYER_WIDTH;
      const pTop = SCREEN_HEIGHT - (GROUND_HEIGHT + s.playerY + PLAYER_HEIGHT);
      const pBottom = SCREEN_HEIGHT - (GROUND_HEIGHT + s.playerY);
      if (s.nearMissCooldown > 0) {
        s.nearMissCooldown -= k;
        if (s.nearMissCooldown < 0) s.nearMissCooldown = 0;
      } else {
        let nearHit = false;
        forEachObstacleInVerticalBand(nextObstacles, pTop, pBottom, 110, (obs) => {
          if (nearHit) return;
          const { w: ow, h: oh } = obstacleHitSize(obs.visual, obs.size, obs.type === "wide");
          if (
            nearMissCheck({
              pLeft,
              pRight,
              pTop,
              pBottom,
              oLeft: obs.x,
              oRight: obs.x + ow,
              oTop: obs.y,
              oBottom: obs.y + oh,
            })
          ) {
            s.score += nearMissScore(pressure.phaseIndex);
            s.feverMeter = feverMeterAddClamped(s.feverMeter, FEVER_METER_PER_NEAR_MISS);
            s.nearMissCooldown = NEAR_MISS_COOLDOWN_FRAMES;
            nearHit = true;
          }
        });
      }

      const effSpeed = s.speed * (nowTs < s.boostUntil ? 1.75 : 1) * slowMul * pressure.fallSpeedMul;
      let nextPowerUps = s.powerUps.map((pu) => {
        let nx = pu.x;
        let ny = pu.y + effSpeed * 0.95 * k;
        if (nowTs < s.magnetUntil) {
          const px = s.playerX + PLAYER_WIDTH / 2;
          const py = SCREEN_HEIGHT - (GROUND_HEIGHT + s.playerY + PLAYER_HEIGHT / 2);
          const ox = pu.x + pu.size / 2;
          const oy = pu.y + pu.size / 2;
          const dx = px - ox;
          const dy = py - oy;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const radius = 280;
          if (dist < radius) {
            const pull = (1 - dist / radius) * (10.0 + tensionD * 6.0);
            nx += (dx / dist) * pull * k;
            ny += (dy / dist) * pull * k;
            // snap when very close
            if (dist < 20) {
              nx = px - pu.size / 2;
              ny = py - pu.size / 2;
            }
          }
        }
        return { ...pu, x: nx, y: ny };
      });
      nextPowerUps = nextPowerUps.filter((pu) => pu.y < SCREEN_HEIGHT + 60);

      // Move coins and apply magnet attraction as well
      let nextCoins = s.coins.map((co) => {
        let nx = co.x;
        let ny = co.y + effSpeed * k;
        if (nowTs < s.magnetUntil) {
          const px = s.playerX + PLAYER_WIDTH / 2;
          const py = SCREEN_HEIGHT - (GROUND_HEIGHT + s.playerY + PLAYER_HEIGHT / 2);
          const ox = co.x + co.size / 2;
          const oy = co.y + co.size / 2;
          const dx = px - ox;
          const dy = py - oy;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const radius = 320;
          if (dist < radius) {
            const pull = (1 - dist / radius) * (12.0 + tensionD * 6.0);
            nx += (dx / dist) * pull * k;
            ny += (dy / dist) * pull * k;
            if (dist < 24) {
              nx = px - co.size / 2;
              ny = py - co.size / 2;
            }
          }
        }
        return { ...co, x: nx, y: ny };
      });
      nextCoins = nextCoins.filter((co) => co.y < SCREEN_HEIGHT + 60);

      s.powerSpawnCooldown -= k;
      if (s.powerSpawnCooldown <= 0) {
        s.powerSpawnCooldown = Math.max(
          72,
          Math.floor((125 + Math.random() * 210) * pressure.powerCooldownMul)
        );
        const type = pickPowerUpKind();
        const size = POWERUP_WORLD_SIZE;
        const startX = Math.max(8, Math.min(SCREEN_WIDTH - size - 8, Math.random() * SCREEN_WIDTH));
        nextPowerUps = [
          ...nextPowerUps,
          {
            id: obstacleIdRef.current + 100000 + Math.floor(Math.random() * 1000),
            x: startX,
            y: -size - 12,
            size,
            type,
          },
        ];
      }

      const stepped = speedRampStep(s.speed, pressure);
      const ms = applyNewMilestonesOnly(stepped, s.score, s.milestoneAppliedCount);
      s.speed = ms.speed;
      s.milestoneAppliedCount = ms.appliedCount;
      s.obstacles = nextObstacles;
      s.powerUps = nextPowerUps;
      s.coins = nextCoins;

      if (!s.feverActive) {
        s.feverMeter = feverMeterPassiveTick(s.feverMeter, false, pressure.tension01);
        const si = Math.floor(s.survivalFrames);
        for (let i = s.lastSurvivalSi + 1; i <= si; i++) {
          if (i > 0 && i % FEVER_METER_SURVIVAL_CHUNK_FRAMES === 0) {
            s.feverMeter = feverMeterAddClamped(s.feverMeter, FEVER_METER_SURVIVAL_CHUNK);
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

      const baseSpeedFactor = (nowTs < s.boostUntil ? 1.5 : 1) * (s.feverActive ? 1.1 : 1);
      const scoreBase = s.speed * baseSpeedFactor * 0.35;
      const mult =
        (nowTs < s.x2Until ? 2 : 1) * pressure.feverScoreMult * pressure.comboScoreMult;
      const scoreGain = Math.max(1, Math.floor(scoreBase * mult * k));
      s.score += scoreGain;

      let died = false;
      const colTop = SCREEN_HEIGHT - (GROUND_HEIGHT + s.playerY + PLAYER_HEIGHT);
      const colBottom = SCREEN_HEIGHT - (GROUND_HEIGHT + s.playerY);
      if (nowTs >= s.hitGraceUntil && nowTs >= s.ghostPhaseUntil) {
        let hit = false;
        forEachObstacleInVerticalBand(s.obstacles, colTop, colBottom, 150, (obs) => {
          if (hit) return;
          if (collides(s.playerY, s.playerX, obs)) hit = true;
        });
        died = hit;
      }

      if (died) {
        // Shield absorbs one hit: clear shield, remove overlapping obstacles, and grant brief invulnerability
        if (nowTs < s.shieldUntil) {
          s.shieldUntil = 0;
          s.hitGraceUntil = nowTs + 600;
          s.obstacles = s.obstacles.filter((obs) => !collides(s.playerY, s.playerX, obs));
          died = false;
        }
      }

      // Collect power-ups
      const nowPickup = Date.now();
      for (const pu of s.powerUps) {
        if (collidesPower(s.playerY, s.playerX, pu)) {
          const { type } = pu;
          const d = POWERUP_DEFS[type];
          s.pickupFlashKind = type;
          s.pickupFlashToken += 1;
          switch (type) {
            case "shield":
              s.shieldUntil = nowPickup + d.durationMs;
              break;
            case "multiplier":
              s.x2Until = nowPickup + d.durationMs;
              break;
            case "magnet":
              s.magnetUntil = nowPickup + d.durationMs;
              break;
            case "boost":
              s.boostUntil = nowPickup + d.durationMs;
              break;
            case "slowTime":
              s.slowTimeUntil = nowPickup + d.durationMs;
              break;
            case "ghostPhase":
              s.ghostPhaseUntil = nowPickup + d.durationMs;
              break;
            case "coinBurst":
              s.coinsCollected += 12 + Math.floor(Math.random() * 9);
              s.score += 160 + Math.floor(Math.random() * 140);
              break;
            default:
              break;
          }
          s.activatePulseT = 12;
          if (!s.feverActive) {
            s.feverMeter = feverMeterAddClamped(s.feverMeter, FEVER_METER_PER_POWER_PICKUP);
          }
          nextPowerUps = nextPowerUps.filter((p) => p.id !== pu.id);
        }
      }
      s.powerUps = nextPowerUps;

      // Spawn coins in small vertical strings and collect
      s.coinSpawnCooldown -= k;
      if (s.coinSpawnCooldown <= 0) {
        s.coinSpawnCooldown = Math.floor((108 + Math.random() * 110) * pressure.coinCooldownMul);
        const size = COIN_SIZE;
        const colX = Math.max(8, Math.min(SCREEN_WIDTH - size - 8, Math.random() * SCREEN_WIDTH));
        const count = 3 + Math.floor(Math.random() * 4); // 3..6
        const newCoins: CoinItem[] = Array.from({ length: count }).map((_, i) => ({
          id: obstacleIdRef.current + 200000 + Math.floor(Math.random() * 1000) + i,
          x: colX,
          y: -size - 30 - i * (size + 12),
          size,
        }));
        nextCoins = [...nextCoins, ...newCoins];
        s.coins = nextCoins;
      }

      // Collect coins (iterate `nextCoins` — authoritative list for this frame)
      for (const c of nextCoins) {
        if (collidesCoin(s.playerY, s.playerX, c)) {
          s.coinsCollected += 1;
          s.score += nowTs < s.x2Until ? 40 : 20;
          if (!s.feverActive) {
            s.feverMeter = feverMeterAddClamped(s.feverMeter, FEVER_METER_PER_COIN);
          }
          nextCoins = nextCoins.filter((cc) => cc.id !== c.id);
        }
      }
      s.coins = nextCoins;

      heroLeftSV.value = s.playerX + (s.shakeT > 0 ? Math.sin(s.shakePhase) * (s.shakeT * 0.4) : 0);
      heroBottomSV.value = GROUND_HEIGHT + s.playerY;
      heroSteerSV.value = Math.max(-1, Math.min(1, (s.playerXTarget - s.playerX) / 110));
      heroPulseSV.value =
        1 + (s.activatePulseT > 0 ? Math.sin((12 - s.activatePulseT) * 0.5) * 0.06 : 0);
      heroMagnetYSV.value = nowTs < s.magnetUntil ? Math.sin(s.shakePhase * 0.4) * 1.5 : 0;

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
        setVisualTier(st.visualTier);
        if (DEBUG_PERF_OVERLAY) setPerfStats(st);
      }

      if (died) {
        setGameOver(true);
        const final = s.score;
        setHighScore((prev) => {
          const next = Math.max(prev, final);
          if (next > prev) {
            AsyncStorage.setItem(HIGH_SCORE_KEY, String(next)).catch(() => {});
          }
          return next;
        });
        return;
      }

      setFrame((f) => f + 1);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [gameOver]);

  const { playerY, obstacles, score } = sim.current;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <AppStatusBar />
      <TouchableWithoutFeedback onPress={handleJump}>
        <View style={styles.gameRoot}>
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            <AnimatedDayCycleBackground
              style={styles.dayCycleBg}
              parallaxEnabled={false}
              readabilityVignetteEnabled={false}
              visualQualityTier={visualTier}
            />
          </View>
          <View
            style={styles.container}
            onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const fingerX = e.nativeEvent.locationX;
            const fingerY = e.nativeEvent.locationY;
            // Record offset between finger and current ship center to avoid snapping
            const shipCenter = sim.current.playerX + PLAYER_WIDTH / 2;
            touchOffsetRef.current = fingerX - shipCenter;
            isDraggingRef.current = true;
            lastFingerXRef.current = fingerX;
            // If finger starts on ship rect, freeze world scroll while holding
            const shipLeft = sim.current.playerX;
            const shipRight = sim.current.playerX + PLAYER_WIDTH;
            const shipBottom = SCREEN_HEIGHT - (GROUND_HEIGHT + sim.current.playerY);
            const shipTop = shipBottom - PLAYER_HEIGHT;
            // locationY is distance from top; check within rect
            const withinX = fingerX >= shipLeft && fingerX <= shipRight;
            const withinY = fingerY >= shipTop && fingerY <= shipBottom;
            if (withinX && withinY) {
              sim.current.holdFreeze = true;
            }
            movePlayerToFingerX(fingerX);
          }}
          onResponderMove={(e) => {
            const x = e.nativeEvent.locationX;
            // Ignore tiny jitter
            if (lastFingerXRef.current != null && Math.abs(x - lastFingerXRef.current) < 1.5) return;
            movePlayerToFingerX(x);
          }}
          onResponderRelease={() => {
            isDraggingRef.current = false;
            lastDragEndMsRef.current = Date.now();
            sim.current.holdFreeze = false;
          }}
        >
          {sim.current.dangerVisual === "warn" && visualTier < 4 && (
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(245,158,11,0.26)", "rgba(245,158,11,0.05)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          {sim.current.dangerVisual === "burst" && visualTier < 4 && (
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(220,38,38,0.22)", "rgba(220,38,38,0.06)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.72 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          {sim.current.feverActive && visualTier < 3 && (
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(236,72,153,0.14)", "transparent", "rgba(251,191,36,0.08)"]}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <HeroGameAnchor
            width={PLAYER_WIDTH}
            height={PLAYER_HEIGHT}
            steerSV={heroSteerSV}
            leftSV={heroLeftSV}
            bottomSV={heroBottomSV}
            pulseScaleSV={heroPulseSV}
            magnetYSV={heroMagnetYSV}
            qualityTier={visualTier}
          >
            {Date.now() < sim.current.shieldUntil && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: -8,
                  bottom: -8,
                  width: PLAYER_WIDTH + 16,
                  height: PLAYER_HEIGHT + 16,
                  borderRadius: 999,
                  backgroundColor: "rgba(96,165,250,0.25)",
                  borderWidth: 2,
                  borderColor: "rgba(96,165,250,0.9)",
                }}
              />
            )}
            {Date.now() < sim.current.x2Until && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: -6,
                  bottom: -6,
                  width: PLAYER_WIDTH + 12,
                  height: PLAYER_HEIGHT + 12,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: "rgba(245,158,11,0.9)",
                }}
              />
            )}
            {Date.now() < sim.current.magnetUntil && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: -10,
                  bottom: -10,
                  width: PLAYER_WIDTH + 20,
                  height: PLAYER_HEIGHT + 20,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: "rgba(34,197,94,0.9)",
                }}
              />
            )}
            {Date.now() < sim.current.boostUntil && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: -4,
                  bottom: -14,
                  width: PLAYER_WIDTH + 8,
                  height: PLAYER_HEIGHT + 28,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "rgba(167,139,250,0.9)",
                }}
              />
            )}
            {Date.now() < sim.current.ghostPhaseUntil && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: -10,
                  bottom: -10,
                  width: PLAYER_WIDTH + 20,
                  height: PLAYER_HEIGHT + 20,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: "rgba(165,180,252,0.95)",
                  backgroundColor: "rgba(129,140,248,0.12)",
                }}
              />
            )}
          </HeroGameAnchor>
          <ShopModal
            open={sim.current.shopOpen}
            coins={sim.current.coinsCollected}
            ownedSkins={sim.current.ownedSkins}
            currentSkin={sim.current.currentSkin}
            skins={[
              { id: "classic", name: "Classic", price: 0, variant: "classic" as ShipVariant, hull: "#8b4513", sail: "#f1f5f9" },
              { id: "sloop", name: "Sloop", price: 500, variant: "sloop" as ShipVariant, hull: "#7c3aed", sail: "#e9d5ff" },
              { id: "brig", name: "Brig", price: 1200, variant: "brig" as ShipVariant, hull: "#0ea5e9", sail: "#bae6fd" },
              { id: "stealth", name: "Stealth", price: 2000, variant: "stealth" as ShipVariant, hull: "#111827", sail: "#d1d5db" },
            ]}
            onClose={toggleShop}
            onBuyOrEquip={handleBuyOrEquip}
            controlButtonStyle={styles.controlButton}
            controlTextStyle={styles.controlText}
          />
          {obstacles.map((obs) => {
            const { w, h } = obstacleHitSize(obs.visual, obs.size, obs.type === "wide");
            return (
              <GameObstacle
                key={obs.id}
                visual={obs.visual}
                width={w}
                height={h}
                visualTier={visualTier}
                style={{ left: obs.x, top: obs.y }}
              />
            );
          })}

          {sim.current.coins.map((co) => (
            <Coin key={co.id} size={co.size} style={{ left: co.x, top: co.y }} />
          ))}

          {sim.current.powerUps.map((pu) => (
            <PowerUp key={pu.id} kind={pu.type} size={pu.size} style={{ left: pu.x, top: pu.y }} />
          ))}

          <HitboxDebugOverlay
            screenHeight={SCREEN_HEIGHT}
            groundHeight={GROUND_HEIGHT}
            playerX={sim.current.playerX}
            playerY={sim.current.playerY}
            playerWidth={PLAYER_WIDTH}
            playerHeight={PLAYER_HEIGHT}
            obstacles={sim.current.obstacles}
          />

          <ActivePowerUpsHud
            now={Date.now()}
            shieldUntil={sim.current.shieldUntil}
            multiplierUntil={sim.current.x2Until}
            magnetUntil={sim.current.magnetUntil}
            boostUntil={sim.current.boostUntil}
            slowTimeUntil={sim.current.slowTimeUntil}
            ghostPhaseUntil={sim.current.ghostPhaseUntil}
          />
          <PowerPickupFlash kind={sim.current.pickupFlashKind} token={sim.current.pickupFlashToken} />

          <SkyLane height={GROUND_HEIGHT} />

          {gameOver && (
            <View style={styles.overlay} pointerEvents="auto">
              <View style={styles.card}>
                <Text style={styles.gameOverTitle}>Game Over</Text>
                <Text style={styles.finalScore}>{score.toLocaleString()}</Text>
                <Text style={styles.coinsSummary}>Coins {sim.current.coinsCollected.toLocaleString()}</Text>
                <View style={styles.gameOverActions}>
                  <Pressable
                    style={({ pressed }) => [styles.gameOverButton, styles.gameOverButtonPrimary, { opacity: pressed ? 0.9 : 1 }]}
                    onPress={handleRetry}
                  >
                    <Text style={styles.gameOverButtonTextPrimary}>Retry</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.gameOverButton, styles.gameOverButtonSecondary, { opacity: pressed ? 0.88 : 1 }]}
                    onPress={handleExitToHome}
                  >
                    <Text style={styles.gameOverButtonTextSecondary}>Home</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
        {DEBUG_PERF_OVERLAY ? (
          <View pointerEvents="none" style={styles.fpsDebugWrap}>
            <FpsPerfOverlay visible stats={perfStats} />
          </View>
        ) : null}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

export default function App() {
  const [showHome, setShowHome] = useState(true);
  return (
    <SafeAreaProvider>
      {showHome ? (
        <HomeScreen onPlay={() => setShowHome(false)} />
      ) : (
        <GameScreen onExitToHome={() => setShowHome(true)} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  gameRoot: {
    flex: 1,
  },
  fpsDebugWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    pointerEvents: "none",
  },
  dayCycleBg: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    overflow: "hidden",
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,10,20,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(24),
  },
  card: {
    width: "100%",
    maxWidth: scale(340),
    paddingVertical: heightPixel(28),
    paddingHorizontal: scale(24),
    borderRadius: scale(16),
    backgroundColor: "rgba(18,26,42,0.92)",
    borderWidth: scale(1),
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  gameOverTitle: {
    fontSize: fontPixel(14),
    letterSpacing: scale(4),
    color: "rgba(255,255,255,0.55)",
    marginBottom: heightPixel(8),
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  finalScore: {
    fontSize: fontPixel(40),
    fontWeight: "300",
    color: "#f4f7ff",
    marginBottom: heightPixel(16),
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  coinsSummary: {
    fontSize: fontPixel(16),
    color: "rgba(255,255,255,0.85)",
    marginBottom: heightPixel(20),
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  gameOverActions: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    gap: scale(12),
    marginTop: heightPixel(4),
  },
  gameOverButton: {
    flex: 1,
    maxWidth: scale(148),
    paddingVertical: heightPixel(14),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  gameOverButtonPrimary: {
    backgroundColor: "#22c55e",
  },
  gameOverButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  gameOverButtonTextPrimary: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fontPixel(15),
    letterSpacing: 0.5,
  },
  gameOverButtonTextSecondary: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    fontSize: fontPixel(15),
    letterSpacing: 0.5,
  },
  tapHint: {
    fontSize: fontPixel(14),
    color: "rgba(255,255,255,0.5)",
  },
  controlButton: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.25,
    shadowRadius: scale(4),
    elevation: 3,
    marginLeft: moderateScale(10),
  },
  controlText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fontPixel(14),
    letterSpacing: 0.5,
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
