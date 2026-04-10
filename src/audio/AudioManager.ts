import Sound from "react-native-sound";
import { AUDIO_GAIN, AUDIO_MIX, AUDIO_TIMING } from "./audioConstants";
import { BUNDLE_AUDIO } from "./audioFiles";
import { mainBundleFilename } from "./bundleFilename";

type LoadedMap = Record<string, Sound | null>;

function loadSound(filename: string): Promise<Sound> {
  const path = mainBundleFilename(filename);
  return new Promise((resolve, reject) => {
    const s = new Sound(path, Sound.MAIN_BUNDLE, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(s);
    });
  });
}

function safeStop(s: Sound | null | undefined) {
  if (s?.isLoaded()) {
    try {
      s.stop();
    } catch {
      /* ignore */
    }
  }
}

function safePause(s: Sound | null | undefined) {
  if (s?.isLoaded()) {
    try {
      s.pause();
    } catch {
      /* ignore */
    }
  }
}

function safeRelease(s: Sound | null | undefined) {
  if (s?.isLoaded()) {
    try {
      s.release();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Central game audio: preloads clips, keeps one instance per asset, throttles spammy SFX.
 */
export class GameAudioManager {
  private static instance: GameAudioManager | null = null;

  static shared(): GameAudioManager {
    if (!GameAudioManager.instance) {
      GameAudioManager.instance = new GameAudioManager();
    }
    return GameAudioManager.instance;
  }

  private loaded: LoadedMap = {};
  private preloadPromise: Promise<void> | null = null;
  private configured = false;

  private lastCoinMs = 0;
  private deathLock = false;

  private effAmbientVol = AUDIO_MIX.ambient * AUDIO_MIX.ambientMaster;

  /** Configure iOS/Android session once */
  configure(): void {
    if (this.configured) return;
    this.configured = true;
    try {
      Sound.setCategory("Playback", true);
    } catch {
      /* ignore */
    }
  }

  preload(): Promise<void> {
    if (this.preloadPromise) return this.preloadPromise;
    this.configure();
    this.preloadPromise = (async () => {
      const entries: [string, string][] = [
        ["shipHum", BUNDLE_AUDIO.shipHum],
        ["coin", BUNDLE_AUDIO.coin],
        ["death", BUNDLE_AUDIO.death],
        ["gameOver", BUNDLE_AUDIO.gameOver],
        ["zoneUp", BUNDLE_AUDIO.zoneUp],
        ["powerup", BUNDLE_AUDIO.powerup],
        ["buttonTap", BUNDLE_AUDIO.buttonTap],
        ["obstacleHit", BUNDLE_AUDIO.obstacleHit],
      ];
      await Promise.all(
        entries.map(async ([key, file]) => {
          try {
            const s = await loadSound(file);
            this.loaded[key] = s;
          } catch (e) {
            if (__DEV__) {
              console.warn(`[SFX] failed to load ${file}`, e);
            }
            this.loaded[key] = null;
          }
        })
      );
    })();
    return this.preloadPromise;
  }

  private hum(): Sound | null {
    return this.loaded.shipHum ?? null;
  }

  /** Alias — soft hero hover loop */
  playShipHumLoop(): void {
    this.startShipHum();
  }

  // —— Ship hum ——

  startShipHum(): void {
    const h = this.hum();
    if (!h?.isLoaded()) return;
    h.setNumberOfLoops(-1);
    h.setVolume(this.effAmbientVol * AUDIO_GAIN.shipHum);
    try {
      h.stop();
      h.setCurrentTime(0);
      h.play();
    } catch {
      /* ignore */
    }
  }

  stopShipHum(): void {
    safeStop(this.hum());
  }

  pauseShipHum(): void {
    safePause(this.hum());
  }

  resumeShipHum(): void {
    const h = this.hum();
    if (!h?.isLoaded()) return;
    try {
      h.play();
    } catch {
      /* ignore */
    }
  }

  // —— SFX ——

  playCoin(): void {
    const now = Date.now();
    if (now - this.lastCoinMs < AUDIO_TIMING.coinMinIntervalMs) {
      return;
    }
    this.lastCoinMs = now;

    const s = this.loaded.coin;
    if (!s?.isLoaded()) return;

    const base = AUDIO_GAIN.coin * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    try {
      s.stop(() => {
        s.setVolume(base);
        s.setSpeed(1);
        s.play();
      });
    } catch {
      /* ignore */
    }
  }

  /** Explosion clip when the ship dies on an obstacle (`BUNDLE_AUDIO.death`). */
  playDeath(): void {
    if (this.deathLock) return;
    this.deathLock = true;
    const s = this.loaded.death;
    if (!s?.isLoaded()) {
      this.deathLock = false;
      return;
    }
    const vol = AUDIO_GAIN.death * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    const releaseLock = (): void => {
      this.deathLock = false;
    };
    try {
      s.stop(() => {
        try {
          s.setVolume(vol);
          s.setSpeed(1);
          s.setCurrentTime(0);
          s.play(() => {
            releaseLock();
          });
        } catch {
          releaseLock();
        }
      });
    } catch {
      releaseLock();
    }
    setTimeout(releaseLock, 5000);
  }

  /** Game-over sting (`game_over.mp3`) — call shortly after `playDeath` for a layered cue. */
  playGameOverSting(): void {
    const s = this.loaded.gameOver;
    if (!s?.isLoaded()) return;
    const vol = AUDIO_GAIN.gameOver * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    try {
      s.stop(() => {
        try {
          s.setVolume(vol);
          s.setSpeed(1);
          s.setCurrentTime(0);
          s.play();
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
  }

  /**
   * Power-up pickup — waits for `preload()` so early pickups still play (avoids silent no-op).
   * Omits `setSpeed` here: some Android `MediaPlayer` builds fail MP3 playback after `setSpeed`.
   */
  playPowerup(): void {
    void this.preload().then(() => {
      const s = this.loaded.powerup;
      if (!s?.isLoaded()) {
        if (__DEV__) {
          console.warn("[SFX] playPowerup: powerup clip missing or failed to load");
        }
        return;
      }
      const vol = AUDIO_GAIN.powerup * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
      const fire = (): void => {
        try {
          s.setVolume(vol);
          s.setCurrentTime(0);
          s.play();
        } catch {
          /* ignore */
        }
      };
      try {
        s.stop(() => {
          fire();
        });
      } catch {
        fire();
      }
    });
  }

  playZoneUp(): void {
    const s = this.loaded.zoneUp;
    if (!s?.isLoaded()) return;
    const vol = AUDIO_GAIN.zoneUp * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    try {
      s.stop(() => {
        s.setVolume(vol);
        s.play();
      });
    } catch {
      /* ignore */
    }
  }

  playButtonTap(): void {
    const s = this.loaded.buttonTap;
    if (!s?.isLoaded()) return;
    const vol = AUDIO_GAIN.buttonTap * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    try {
      s.stop(() => {
        s.setVolume(vol);
        s.play();
      });
    } catch {
      /* ignore */
    }
  }

  playObstacleHit(): void {
    const s = this.loaded.obstacleHit;
    if (!s?.isLoaded()) return;
    const vol = AUDIO_GAIN.obstacleHit * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    try {
      s.stop(() => {
        try {
          s.setVolume(vol);
          s.setSpeed(1);
          s.setCurrentTime(0);
          s.play();
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
  }

  // —— Pause / resume gameplay stack ——

  pauseGameAudio(): void {
    this.pauseShipHum();
  }

  resumeGameAudio(): void {
    this.resumeShipHum();
  }

  /**
   * Entering a run from menu / retry: ship hum on.
   */
  onGameSessionStart(): void {
    this.deathLock = false;
    this.startShipHum();
  }

  /**
   * Leaving game screen (home): stop run layers.
   */
  onGameSessionEnd(): void {
    this.stopShipHum();
  }

  /**
   * Fatal obstacle collision: impact SFX, stop ship hum, explosion, then game-over sting.
   * Call only after `preload()` has resolved so clips are loaded.
   */
  onGameOver(): void {
    this.playObstacleHit();
    this.stopShipHum();
    this.playDeath();
    setTimeout(() => {
      this.playGameOverSting();
    }, 140);
  }

  /** After retry — restore ship hum */
  onRunRestart(): void {
    this.deathLock = false;
    this.startShipHum();
  }

  dispose(): void {
    for (const k of Object.keys(this.loaded)) {
      safeRelease(this.loaded[k]);
      this.loaded[k] = null;
    }
    this.preloadPromise = null;
  }
}

export function getAudioManager(): GameAudioManager {
  return GameAudioManager.shared();
}
