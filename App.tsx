import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  Modal,
} from "react-native";
import Background from "./components/Background";
import BackgroundWrapper from "./components/BackgroundWrapper";
import FeverBar from "./components/FeverBar";
import ProgressBar from "./components/ProgressBar";
import Ship, { ShipVariant } from "./components/Ship";
import ShopModal from "./components/ShopModal";
import Monster from "./components/Monster";
import PowerUp from "./components/PowerUp";
import Coin from "./components/Coin";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(
    Math.max(0, Math.min(255, Math.round(g)))
  )}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`;
}

function lerpColor(a: string, b: string, t: number): string {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  const r = c1.r + (c2.r - c1.r) * t;
  const g = c1.g + (c2.g - c1.g) * t;
  const bch = c1.b + (c2.b - c1.b) * t;
  return rgbToHex(r, g, bch);
}

function formatWithSpaces(n: number): string {
  const s = Math.floor(Math.max(0, n)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Responsive UI helper based on width (375 baseline)
function scalePx(px: number): number {
  const baseline = 375;
  return Math.round((SCREEN_WIDTH / baseline) * px);
}

// Endless phase themes cycle every ~6000 score; add as many as desired
const PHASE_THEMES = [
  { label: "Zone 1", top: "#0b1730", mid: "#1b3358" },
  { label: "Zone 2", top: "#10243e", mid: "#1e3a5f" },
  { label: "Zone 3", top: "#162744", mid: "#224870" },
  { label: "Zone 4", top: "#1a1b3a", mid: "#3a2758" },
  { label: "Zone 5", top: "#220b2a", mid: "#4a1e5f" },
];
const PHASE_SCORE_SPAN = 6000;
function getPhaseIndex(score: number): number {
  const idx = Math.floor(Math.max(0, score) / PHASE_SCORE_SPAN) % PHASE_THEMES.length;
  return idx;
}
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HIGH_SCORE_KEY = "@stackRunner/highScore";
const OWNED_SKINS_KEY = "@stackRunner/ownedSkins";
const CURRENT_SKIN_KEY = "@stackRunner/currentSkin";

const GRAVITY = 0.72;
const JUMP_FORCE = 15;
const GROUND_HEIGHT = 128;
const PLAYER_X = 72;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 52;

const BASE_SPEED = 3.5;
const MAX_SPEED = 15.5;
const SPEED_RAMP = 0.0022;

const MIN_OBSTACLE_W = 36;
const MAX_OBSTACLE_W = 56;
const SPAWN_INTERVAL_MIN = 42;
const SPAWN_INTERVAL_MAX = 78;

type ObstacleType = "block" | "fast" | "wide" | "zigzag";
type Obstacle = {
  id: number;
  x: number;
  y: number;
  size: number;
  type: ObstacleType;
  color: string;
  driftPhase?: number;
};

type PowerUpType = "shield" | "x2" | "magnet" | "boost";
type PowerUpItem = {
  id: number;
  x: number;
  y: number;
  size: number;
  type: PowerUpType;
  color: string;
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
  x2Until: number; // ms timestamp
  magnetUntil: number;
  boostUntil: number;
  activatePulseT: number;
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
};

function collides(playerY: number, playerX: number, obs: Obstacle): boolean {
  // Player rect
  const pLeft = playerX;
  const pRight = playerX + PLAYER_WIDTH;
  const pTop = SCREEN_HEIGHT - (GROUND_HEIGHT + playerY + PLAYER_HEIGHT);
  const pBottom = SCREEN_HEIGHT - (GROUND_HEIGHT + playerY);

  // Obstacle rect (falls vertically from top)
  const obsLeft = obs.x;
  const obsRight = obs.x + obs.size;
  const obsTop = obs.y;
  const obsBottom = obs.y + (obs.type === "wide" ? obs.size * 1.4 : obs.size);

  const horizontal = obsLeft < pRight && obsRight > pLeft;
  const vertical = obsTop < pBottom && obsBottom > pTop;
  return horizontal && vertical;
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
  spawnCooldown: 55,
  powerSpawnCooldown: 240,
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
  activatePulseT: 0,
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
});

function GameScreen() {
  const sim = useRef<SimState>(initialSim());
  const obstacleIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const touchOffsetRef = useRef(0); // finger-to-ship center offset for smooth dragging
  const isDraggingRef = useRef(false);
  const lastDragEndMsRef = useRef(0);
  const lastFingerXRef = useRef<number | null>(null);

  const [, setFrame] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);

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
    setGameOver(false);
    setPaused(false);
    setFrame((f) => f + 1);
  }, []);

  const handleJump = useCallback(() => {
    if (gameOver) {
      resetGame();
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

  const handleStop = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      sim.current.paused = next;
      return next;
    });
  }, []);

  const handleRetry = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const toggleShop = useCallback(() => {
    const next = !sim.current.shopOpen;
    sim.current.shopOpen = next;
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

      // Difficulty ramp increases with speed and score
      const speedProgress = Math.min(1, Math.max(0, (s.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)));
      const scoreProgress = Math.min(1, s.score / 15000);
      const difficulty = Math.min(1, speedProgress * 0.7 + scoreProgress * 0.5);

      s.velocity -= GRAVITY;
      s.playerY += s.velocity;
      if (s.playerY < 0) {
        s.playerY = 0;
        s.velocity = 0;
      }

      // Smooth horizontal steering toward target
      const targetX = Math.max(0, Math.min(SCREEN_WIDTH - PLAYER_WIDTH, s.playerXTarget));
      // If not actively dragging, ease toward target; when dragging we already set exact position
      if (!isDraggingRef.current) {
        s.playerX += (targetX - s.playerX) * 0.35;
      }

      // Update press shake timer
      if (s.shakeT > 0) {
        s.shakeT -= 1;
        s.shakePhase += 0.6;
      }
      if (s.activatePulseT > 0) {
        s.activatePulseT -= 1;
      }

      let nextObstacles = s.obstacles.map((obs) => {
        const eff = s.speed * (Date.now() < s.boostUntil ? 1.5 : 1);
        let verticalSpeed = eff;
        if (obs.type === "fast") verticalSpeed *= 1.25 + difficulty * 0.35;
        const nextY = obs.y + verticalSpeed;
        let nextX = obs.x;
        if (obs.type === "zigzag") {
          const phase = (obs.driftPhase ?? 0) + (0.06 + difficulty * 0.06) * eff / MAX_SPEED * 10;
          nextX = obs.x + Math.sin(phase) * (2.5 + difficulty * 3.0);
          return { ...obs, y: nextY, x: nextX, driftPhase: phase };
        }
        return { ...obs, y: nextY, x: nextX };
      });
      nextObstacles = nextObstacles.filter((obs) => obs.y < SCREEN_HEIGHT + 60);

      s.spawnCooldown -= 1;
      if (s.spawnCooldown <= 0) {
        // Decrease spawn interval as difficulty increases
        const minInt = Math.max(22, SPAWN_INTERVAL_MIN - Math.floor(difficulty * 16));
        const maxInt = Math.max(minInt + 8, SPAWN_INTERVAL_MAX - Math.floor(difficulty * 22));
        s.spawnCooldown = minInt + Math.random() * Math.max(6, maxInt - minInt);
        obstacleIdRef.current += 1;
        const baseSize = MIN_OBSTACLE_W + Math.random() * (MAX_OBSTACLE_W - MIN_OBSTACLE_W);
        const size = baseSize * (1 + difficulty * 0.25);
        const rand = Math.random();
        const type: ObstacleType =
          rand < (0.25 + difficulty * 0.15)
            ? "fast"
            : rand < (0.55 + difficulty * 0.15)
            ? "wide"
            : rand < (0.85 + difficulty * 0.05)
            ? "zigzag"
            : "block";
        const color =
          type === "fast"
            ? "#ff3b3b"
            : type === "wide"
            ? "#00d4ff"
            : type === "zigzag"
            ? "#ff7b00"
            : "#9b59ff";
        const width = type === "wide" ? size * (1.5 + difficulty * 0.2) : size;
        // fair spawn spacing: avoid placing too close to last X and give player a chance at lower difficulty
        const minGap = 40 - difficulty * 28;
        let startX = Math.random() * (SCREEN_WIDTH - width - 16) + 8;
        if (Math.abs(startX - s.lastSpawnX) < minGap) {
          startX = Math.min(
            SCREEN_WIDTH - width - 8,
            Math.max(8, startX + (startX < s.lastSpawnX ? -minGap : minGap))
          );
        }
        // avoid spawning directly over player at very low difficulty
        if (difficulty < 0.25 && Math.abs(startX - s.playerX) < 36) {
          startX = Math.min(SCREEN_WIDTH - width - 8, Math.max(8, s.playerX + 56));
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
            color,
            driftPhase: Math.random() * Math.PI * 2,
          },
        ];
        // Chance for a duo spawn at higher difficulty
        if (difficulty > 0.45 && Math.random() < 0.35) {
          const dx = (SCREEN_WIDTH * (0.25 + Math.random() * 0.25));
          let otherX = Math.max(8, Math.min(SCREEN_WIDTH - width - 8, startX + (Math.random() < 0.5 ? -dx : dx)));
          if (Math.abs(otherX - startX) < width * 0.8) {
            otherX = Math.min(SCREEN_WIDTH - width - 8, Math.max(8, otherX + width * 0.9));
          }
          obstacleIdRef.current += 1;
          nextObstacles.push({
            id: obstacleIdRef.current,
            x: otherX,
            y: -size - 60,
            size: width * (0.9 + Math.random() * 0.2),
            type: rand < 0.5 ? "zigzag" : "fast",
            color,
            driftPhase: Math.random() * Math.PI * 2,
          } as any);
        }
      }

      // Move existing power-ups and spawn new ones occasionally
      const effSpeed = s.speed * (Date.now() < s.boostUntil ? 1.75 : 1);
      let nextPowerUps = s.powerUps.map((pu) => {
        let nx = pu.x;
        let ny = pu.y + effSpeed * 0.95;
        if (Date.now() < s.magnetUntil) {
          const px = s.playerX + PLAYER_WIDTH / 2;
          const py = SCREEN_HEIGHT - (GROUND_HEIGHT + s.playerY + PLAYER_HEIGHT / 2);
          const ox = pu.x + pu.size / 2;
          const oy = pu.y + pu.size / 2;
          const dx = px - ox;
          const dy = py - oy;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const radius = 280;
          if (dist < radius) {
            const pull = (1 - dist / radius) * (10.0 + difficulty * 6.0);
            nx += (dx / dist) * pull;
            ny += (dy / dist) * pull;
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
        let ny = co.y + effSpeed;
        if (Date.now() < s.magnetUntil) {
          const px = s.playerX + PLAYER_WIDTH / 2;
          const py = SCREEN_HEIGHT - (GROUND_HEIGHT + s.playerY + PLAYER_HEIGHT / 2);
          const ox = co.x + co.size / 2;
          const oy = co.y + co.size / 2;
          const dx = px - ox;
          const dy = py - oy;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const radius = 320;
          if (dist < radius) {
            const pull = (1 - dist / radius) * (12.0 + difficulty * 6.0);
            nx += (dx / dist) * pull;
            ny += (dy / dist) * pull;
            if (dist < 24) {
              nx = px - co.size / 2;
              ny = py - co.size / 2;
            }
          }
        }
        return { ...co, x: nx, y: ny };
      });
      nextCoins = nextCoins.filter((co) => co.y < SCREEN_HEIGHT + 60);

      s.powerSpawnCooldown -= 1;
      if (s.powerSpawnCooldown <= 0) {
        const phaseBias = 1 + 0.08 * getPhaseIndex(s.score);
        s.powerSpawnCooldown = Math.max(200, Math.floor((320 + Math.random() * 340) / phaseBias));
        const roll = Math.random();
        const type: PowerUpType =
          roll < 0.35 ? "shield" : roll < 0.6 ? "x2" : roll < 0.8 ? "magnet" : "boost";
        const color =
          type === "shield" ? "#60a5fa" : type === "x2" ? "#f59e0b" : type === "magnet" ? "#22c55e" : "#a78bfa";
        const size = 28;
        const startX = Math.max(8, Math.min(SCREEN_WIDTH - size - 8, Math.random() * SCREEN_WIDTH));
        nextPowerUps = [
          ...nextPowerUps,
          {
            id: obstacleIdRef.current + 100000 + Math.floor(Math.random() * 1000),
            x: startX,
            y: -size - 12,
            size,
            type,
            color,
          },
        ];
      }

      // Increase speed ramp with difficulty for a stronger challenge
      const dynamicRamp = SPEED_RAMP * (1 + difficulty * 1.5);
      s.speed = Math.min(s.speed + dynamicRamp, MAX_SPEED);
      s.obstacles = nextObstacles;
      s.powerUps = nextPowerUps;
      s.coins = nextCoins;

      // Fever meter build/decay and activation
      if (!s.feverActive) {
        const meterGain = 0.12 + Math.min(1, Math.max(0, (s.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED))) * 0.18;
        s.feverMeter = Math.min(100, s.feverMeter + meterGain);
        if (s.score >= 3000 || s.feverMeter >= 100) {
          s.feverActive = true;
          s.feverMultiplier = 3;
          s.feverUntil = Date.now() + 10000;
          s.feverIntroUntil = Date.now() + 900;
          s.feverMeter = 100;
        }
      } else {
        const remain = Math.max(0, s.feverUntil - Date.now());
        s.feverMeter = Math.max(0, (remain / 10000) * 100);
        if (remain <= 0) {
          s.feverActive = false;
          s.feverMultiplier = 1;
          s.feverUntil = 0;
          s.feverMeter = 0;
        }
      }

      const baseSpeedFactor = (Date.now() < s.boostUntil ? 1.5 : 1) * (s.feverActive ? 1.1 : 1);
      const scoreBase = (s.speed * baseSpeedFactor) * 0.35;
      const mult = (Date.now() < s.x2Until ? 2 : 1) * (s.feverActive ? s.feverMultiplier : 1);
      const scoreGain = Math.floor(scoreBase) * mult;
      s.score += scoreGain;

      let died = false;
      const nowTs = Date.now();
      if (nowTs >= s.hitGraceUntil) {
        for (const obs of s.obstacles) {
          if (collides(s.playerY, s.playerX, obs)) {
            died = true;
            break;
          }
        }
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
      for (const pu of s.powerUps) {
        if (collidesPower(s.playerY, s.playerX, pu)) {
          if (pu.type === "shield") {
            s.shieldUntil = Date.now() + 8000;
          } else if (pu.type === "x2") {
            s.x2Until = Date.now() + 8000;
          } else if (pu.type === "magnet") {
            s.magnetUntil = Date.now() + 8000;
          } else if (pu.type === "boost") {
            s.boostUntil = Date.now() + 6000;
          }
          s.activatePulseT = 12;
          nextPowerUps = nextPowerUps.filter((p) => p.id !== pu.id);
        }
      }
      s.powerUps = nextPowerUps;

      // Spawn coins in small vertical strings and collect
      s.coinSpawnCooldown -= 1;
      if (s.coinSpawnCooldown <= 0) {
        s.coinSpawnCooldown = 120 + Math.floor(Math.random() * 120);
        const size = 18;
        const colX = Math.max(8, Math.min(SCREEN_WIDTH - size - 8, Math.random() * SCREEN_WIDTH));
        const count = 3 + Math.floor(Math.random() * 4); // 3..6
        const newCoins: CoinItem[] = Array.from({ length: count }).map((_, i) => ({
          id: obstacleIdRef.current + 200000 + Math.floor(Math.random() * 1000) + i,
          x: colX,
          y: -size - 30 - i * (size + 10),
          size,
        }));
        nextCoins = [...nextCoins, ...newCoins];
        s.coins = nextCoins;
      }

      // Collect coins
      for (const c of s.coins) {
        if (collidesCoin(s.playerY, s.playerX, c)) {
          s.coinsCollected += 1;
          s.score += Date.now() < s.x2Until ? 40 : 20; // coin value with x2
          nextCoins = nextCoins.filter((cc) => cc.id !== c.id);
        }
      }
      s.coins = nextCoins;

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
    <TouchableWithoutFeedback onPress={handleJump}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" />
        <BackgroundWrapper
          type="gradient"
          colors={sim.current.feverActive
            ? ["#3b0764", "#ff006e"]
            : [PHASE_THEMES[getPhaseIndex(sim.current.score)].top, PHASE_THEMES[getPhaseIndex(sim.current.score)].mid]}
        >
        <View
          style={styles.container}
          onStartShouldSetResponderCapture={() => true}
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
            if (gameOver) {
              resetGame();
            }
          }}
        >
          {(() => {
            // Cycle variants with score; also drift clouds by phase
            const progress = Math.max(0, Math.min(1, sim.current.speed / MAX_SPEED));
            const cycle = Math.floor((sim.current.score % 8000) / 2000); // 0..3
            const variant = cycle === 0 ? "day" : cycle === 1 ? "sunset" : cycle === 2 ? "night" : "dawn";
            // Base palettes per variant then lerp toward darker as progress grows
            const baseTop =
              variant === "day" ? "#1b3358" : variant === "sunset" ? "#3a274a" : variant === "night" ? "#0b1020" : "#1d2e4a";
            const baseMid =
              variant === "day" ? "#224870" : variant === "sunset" ? "#50315e" : variant === "night" ? "#121a2b" : "#244862";
            const skyTopColor = lerpColor(baseTop, "#091222", progress * 0.8);
            const skyMidColor = lerpColor(baseMid, "#0e2540", progress * 0.8);
            const phase = sim.current.score * 0.01;
            return (
              <Background
                skyTopColor={skyTopColor}
                skyMidColor={skyMidColor}
                horizonOpacity={0.35}
                phase={phase}
                variant={variant as any}
              />
            );
          })()}

          <Text style={styles.scoreLabel}>NAUTICAL MILES</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
          <Text style={styles.highScore}>
            BEST {Math.max(highScore, score).toLocaleString()}
          </Text>

          {/* Phase badge */}
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseText}>{PHASE_THEMES[getPhaseIndex(sim.current.score)].label}</Text>
          </View>

          <FeverBar
            progress={sim.current.feverMeter / 100}
            active={sim.current.feverActive}
            style={{ top: scalePx(36) }}
          />

          {/* Coin Counter */}
          <View style={styles.coinCounter}>
            <Coin size={24} />
            <Text style={styles.coinText}>{formatWithSpaces(sim.current.coinsCollected)}</Text>
          </View>

          <View style={styles.controlsRow}>
            <View style={[styles.controlButton, { backgroundColor: paused ? "#ff3b3b" : "#22c55e" }]}>
              <Text onPress={handleStop} style={styles.controlText}>
                {paused ? "Resume" : "Stop"}
              </Text>
            </View>
            <View style={[styles.controlButton, { backgroundColor: "#6c5ce7" }]}>
              <Text onPress={handleRetry} style={styles.controlText}>
                Retry
              </Text>
            </View>
          </View>

          <ProgressBar
            vertical
            length={160}
            progress={Math.min(1, sim.current.speed / MAX_SPEED)}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: [{ translateY: -80 }],
            }}
          />

          <Ship
            style={{
              bottom: GROUND_HEIGHT + playerY,
              left:
                sim.current.playerX +
                (sim.current.shakeT > 0
                  ? Math.sin(sim.current.shakePhase) * (sim.current.shakeT * 0.4)
                  : 0),
              transform: [
                {
                  scale:
                    1 +
                    (sim.current.activatePulseT > 0
                      ? Math.sin((12 - sim.current.activatePulseT) * 0.5) * 0.06
                      : 0),
                },
                // Subtle glow position wobble when magnet is active
                {
                  translateY: Date.now() < sim.current.magnetUntil ? Math.sin(sim.current.shakePhase * 0.4) * 1.5 : 0,
                },
              ],
            }}
            variant={sim.current.currentSkin as ShipVariant}
          />

          {/* Active effect glows around ship for clarity */}
          {Date.now() < sim.current.shieldUntil && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: sim.current.playerX - 8,
                bottom: GROUND_HEIGHT + playerY - 8,
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
                left: sim.current.playerX - 6,
                bottom: GROUND_HEIGHT + playerY - 6,
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
                left: sim.current.playerX - 10,
                bottom: GROUND_HEIGHT + playerY - 10,
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
                left: sim.current.playerX - 4,
                bottom: GROUND_HEIGHT + playerY - 14,
                width: PLAYER_WIDTH + 8,
                height: PLAYER_HEIGHT + 28,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: "rgba(167,139,250,0.9)",
              }}
            />
          )}

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
            const bodyH = obs.type === "wide" ? obs.size * 1.4 : obs.size;
            return (
              <Monster
                key={obs.id}
                width={obs.size}
                height={bodyH}
                color={obs.color}
                style={{ left: obs.x, top: obs.y }}
              />
            );
          })}

          {sim.current.coins.map((co) => (
            <Coin key={co.id} size={co.size} style={{ left: co.x, top: co.y }} />
          ))}

          {sim.current.powerUps.map((pu) => (
            <PowerUp
              key={pu.id}
              type={pu.type}
              size={pu.size}
              color={pu.color}
              style={{ left: pu.x, top: pu.y }}
            />
          ))}

          <View style={styles.ground}>
            <View style={[styles.wave, { bottom: 64, opacity: 0.25 }]} />
            <View style={[styles.wave, { bottom: 42, opacity: 0.4 }]} />
            <View style={[styles.wave, { bottom: 20, opacity: 0.55 }]} />
            <View style={styles.groundStripe} />
            <View style={[styles.groundStripe, { opacity: 0.26 }]} />
          </View>

          {gameOver && (
            <View style={styles.overlay} pointerEvents="box-none">
              <View style={styles.card}>
                <Text style={styles.gameOverTitle}>Game Over</Text>
                <Text style={styles.finalScore}>{score.toLocaleString()}</Text>
                <Text style={styles.coinsSummary}>Coins {sim.current.coinsCollected.toLocaleString()}</Text>
                <Text style={styles.tapHint}>Tap anywhere to play again</Text>
              </View>
            </View>
          )}

          {/* Active power-up badges */}
          {Date.now() < sim.current.shieldUntil && (
            <View style={[styles.badge, { top: scalePx(110), backgroundColor: "rgba(96,165,250,0.2)", borderColor: "#60a5fa" }]}>
              <Text style={styles.badgeText}>Shield {Math.ceil((sim.current.shieldUntil - Date.now()) / 1000)}s</Text>
            </View>
          )}
          {Date.now() < sim.current.x2Until && (
            <View style={[styles.badge, { top: scalePx(150), backgroundColor: "rgba(245,158,11,0.2)", borderColor: "#f59e0b" }]}>
              <Text style={styles.badgeText}>x2 {Math.ceil((sim.current.x2Until - Date.now()) / 1000)}s</Text>
            </View>
          )}
          {Date.now() < sim.current.magnetUntil && (
            <View style={[styles.badge, { top: scalePx(190), backgroundColor: "rgba(34,197,94,0.2)", borderColor: "#22c55e" }]}>
              <Text style={styles.badgeText}>Magnet {Math.ceil((sim.current.magnetUntil - Date.now()) / 1000)}s</Text>
            </View>
          )}
          {Date.now() < sim.current.boostUntil && (
            <View style={[styles.badge, { top: scalePx(230), backgroundColor: "rgba(167,139,250,0.2)", borderColor: "#a78bfa" }]}>
              <Text style={styles.badgeText}>Boost {Math.ceil((sim.current.boostUntil - Date.now()) / 1000)}s</Text>
            </View>
          )}
        </View>
        </BackgroundWrapper>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GameScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0c1222",
  },
  container: {
    flex: 1,
    backgroundColor: "#0b1730",
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
    height: 3,
    backgroundColor: "rgba(255,200,120,0.35)",
  },
  sun: {
    position: "absolute",
    top: "8%",
    right: "10%",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffc857",
    shadowColor: "#ffb347",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 8,
  },
  cloud: {
    position: "absolute",
    width: 72,
    height: 22,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  scoreLabel: {
    position: "absolute",
    top: scalePx(72),
    alignSelf: "center",
    fontSize: scalePx(11),
    letterSpacing: 3,
    color: "rgba(255,255,255,0.55)",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  scoreValue: {
    position: "absolute",
    top: scalePx(98),
    alignSelf: "center",
    fontSize: scalePx(36),
    fontWeight: "200",
    color: "#f4f7ff",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  highScore: {
    position: "absolute",
    top: scalePx(134),
    alignSelf: "center",
    fontSize: scalePx(12),
    color: "rgba(255,255,255,0.45)",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  player: {
    position: "absolute",
    left: PLAYER_X,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  shipHull: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: "#8b4513",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 2,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.25)",
  },
  shipMast: {
    position: "absolute",
    bottom: 18,
    left: 20,
    width: 4,
    height: 28,
    backgroundColor: "#c0a080",
    borderRadius: 2,
  },
  shipSail: {
    position: "absolute",
    bottom: 18,
    left: 22,
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderLeftWidth: 0,
    borderRightWidth: 20,
    borderBottomWidth: 22,
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
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.35)",
  },
  monsterEye: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  monsterPupil: {
    position: "absolute",
    top: 9,
    left: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000",
    opacity: 0.7,
  },
  monsterFin: {
    position: "absolute",
    top: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  monsterTeethRow: {
    position: "absolute",
    bottom: -6,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  monsterTooth: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 8,
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
    borderTopWidth: 4,
    borderTopColor: "#1aa3ff",
  },
  groundStripe: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  wave: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#1aa3ff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,10,20,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "rgba(18,26,42,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  gameOverTitle: {
    fontSize: 14,
    letterSpacing: 4,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 8,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  finalScore: {
    fontSize: 40,
    fontWeight: "300",
    color: "#f4f7ff",
    marginBottom: 16,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  coinsSummary: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 12,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  tapHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },
  badge: {
    position: "absolute",
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  controlsRow: {
    position: "absolute",
    top: 8,
    right: 12,
    flexDirection: "row",
  },
  controlButton: {
    paddingHorizontal: scalePx(14),
    paddingVertical: scalePx(8),
    borderRadius: scalePx(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: scalePx(10),
  },
  controlText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: scalePx(14),
    letterSpacing: 0.5,
  },
  phaseBadge: {
    position: "absolute",
    top: scalePx(16),
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: scalePx(10),
    paddingVertical: scalePx(4),
    borderRadius: scalePx(12),
  },
  phaseText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: scalePx(10),
    letterSpacing: 2,
  },
  coinCounter: {
    position: "absolute",
    top: scalePx(10),
    left: scalePx(14),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: scalePx(10),
    paddingVertical: scalePx(6),
    borderRadius: scalePx(14),
  },
  coinText: {
    marginLeft: scalePx(6),
    color: "#fff",
    fontWeight: "800",
    fontSize: scalePx(18),
    letterSpacing: 1.0,
  },
  customizeBtn: {
    position: "absolute",
    top: 10,
    right: 120,
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  customizeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  shopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
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
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    backgroundColor: "rgba(18,26,42,0.98)",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  modalSubTitle: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});
