import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HIGH_SCORE_KEY = "@stackRunner/highScore";

const GRAVITY = 0.72;
const JUMP_FORCE = 15;
const GROUND_HEIGHT = 128;
const PLAYER_X = 72;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 52;

const BASE_SPEED = 6.5;
const MAX_SPEED = 13.5;
const SPEED_RAMP = 0.0012;

const MIN_OBSTACLE_W = 36;
const MAX_OBSTACLE_W = 56;
const SPAWN_INTERVAL_MIN = 42;
const SPAWN_INTERVAL_MAX = 78;

type Obstacle = { id: number; x: number; size: number };

type SimState = {
  playerY: number;
  velocity: number;
  obstacles: Obstacle[];
  speed: number;
  spawnCooldown: number;
  score: number;
};

function collides(playerY: number, obs: Obstacle): boolean {
  const obsLeft = obs.x;
  const obsRight = obs.x + obs.size;
  const obsBottom = GROUND_HEIGHT;
  const obsTop = GROUND_HEIGHT + obs.size;

  const pLeft = PLAYER_X;
  const pRight = PLAYER_X + PLAYER_WIDTH;
  const pBottom = GROUND_HEIGHT + playerY;
  const pTop = GROUND_HEIGHT + playerY + PLAYER_HEIGHT;

  const horizontal = obsLeft < pRight && obsRight > pLeft;
  const vertical = pBottom < obsTop && pTop > obsBottom;
  return horizontal && vertical;
}

const initialSim = (): SimState => ({
  playerY: 0,
  velocity: 0,
  obstacles: [],
  speed: BASE_SPEED,
  spawnCooldown: 55,
  score: 0,
});

function GameScreen() {
  const sim = useRef<SimState>(initialSim());
  const obstacleIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [, setFrame] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        if (!cancelled && raw != null) {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) setHighScore(n);
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
    setFrame((f) => f + 1);
  }, []);

  const handleJump = useCallback(() => {
    if (gameOver) {
      resetGame();
      return;
    }
    if (sim.current.playerY === 0) {
      sim.current.velocity = JUMP_FORCE;
    }
  }, [gameOver, resetGame]);

  useEffect(() => {
    if (gameOver) return;

    const loop = () => {
      const s = sim.current;

      s.velocity -= GRAVITY;
      s.playerY += s.velocity;
      if (s.playerY < 0) {
        s.playerY = 0;
        s.velocity = 0;
      }

      let nextObstacles = s.obstacles.map((obs) => ({
        ...obs,
        x: obs.x - s.speed,
      }));
      nextObstacles = nextObstacles.filter((obs) => obs.x + obs.size > -40);

      s.spawnCooldown -= 1;
      if (s.spawnCooldown <= 0) {
        s.spawnCooldown =
          SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
        obstacleIdRef.current += 1;
        const size = MIN_OBSTACLE_W + Math.random() * (MAX_OBSTACLE_W - MIN_OBSTACLE_W);
        nextObstacles = [
          ...nextObstacles,
          { id: obstacleIdRef.current, x: SCREEN_WIDTH + 20, size },
        ];
      }

      s.speed = Math.min(s.speed + SPEED_RAMP, MAX_SPEED);
      s.obstacles = nextObstacles;
      s.score += Math.floor(s.speed * 0.35);

      let died = false;
      for (const obs of s.obstacles) {
        if (collides(s.playerY, obs)) {
          died = true;
          break;
        }
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
    <TouchableWithoutFeedback onPress={handleJump}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          <View style={styles.skyTop} />
          <View style={styles.skyMid} />
          <View style={styles.horizon} />

          <View style={styles.sun} />

          <View style={[styles.cloud, { left: "12%", top: "14%" }]} />
          <View style={[styles.cloud, { left: "58%", top: "10%", opacity: 0.85 }]} />

          <Text style={styles.scoreLabel}>DISTANCE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
          <Text style={styles.highScore}>
            BEST {Math.max(highScore, score).toLocaleString()}
          </Text>

          <View
            style={[
              styles.player,
              {
                bottom: GROUND_HEIGHT + playerY,
              },
            ]}
          >
            <View style={styles.playerHighlight} />
          </View>

          {obstacles.map((obs) => (
            <View key={obs.id} style={[styles.obstacleWrap, { left: obs.x, width: obs.size }]}>
              <View style={[styles.obstacleBody, { height: obs.size }]} />
              <View style={styles.obstacleSpike} />
            </View>
          ))}

          <View style={styles.ground}>
            <View style={styles.groundStripe} />
            <View style={[styles.groundStripe, { opacity: 0.35 }]} />
          </View>

          {gameOver && (
            <View style={styles.overlay} pointerEvents="box-none">
              <View style={styles.card}>
                <Text style={styles.gameOverTitle}>Run ended</Text>
                <Text style={styles.finalScore}>{score.toLocaleString()} m</Text>
                <Text style={styles.tapHint}>Tap anywhere to run again</Text>
              </View>
            </View>
          )}
        </View>
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
    backgroundColor: "#1b2a4a",
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
    top: 18,
    alignSelf: "center",
    fontSize: 11,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.55)",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  scoreValue: {
    position: "absolute",
    top: 34,
    alignSelf: "center",
    fontSize: 36,
    fontWeight: "200",
    color: "#f4f7ff",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  highScore: {
    position: "absolute",
    top: 78,
    alignSelf: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  player: {
    position: "absolute",
    left: PLAYER_X,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: "#ff5e57",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  playerHighlight: {
    position: "absolute",
    top: 6,
    left: 8,
    right: 14,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.28)",
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
  obstacleSpike: {
    marginTop: -2,
    width: "55%",
    height: 8,
    backgroundColor: "#1a1c20",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  ground: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: GROUND_HEIGHT,
    backgroundColor: "#1f6f4f",
    borderTopWidth: 4,
    borderTopColor: "#2d8f63",
  },
  groundStripe: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(0,0,0,0.12)",
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
  tapHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },
});
