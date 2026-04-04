import Sound from "react-native-sound";
import { AUDIO_GAIN, AUDIO_MIX, AUDIO_TIMING } from "./audioConstants";
import { BUNDLE_AUDIO } from "./audioFiles";

type LoadedMap = Record<string, Sound | null>;

function loadSound(filename: string): Promise<Sound> {
  return new Promise((resolve, reject) => {
    const s = new Sound(filename, Sound.MAIN_BUNDLE, (err) => {
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
  private lastCoinComboAt = 0;
  private coinCombo = 0;
  private coinVariant = 0;
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
        ["coin1", BUNDLE_AUDIO.coin1],
        ["coin2", BUNDLE_AUDIO.coin2],
        ["death", BUNDLE_AUDIO.death],
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
          } catch {
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
    if (now - this.lastCoinComboAt > AUDIO_TIMING.coinComboResetMs) {
      this.coinCombo = 0;
    } else {
      this.coinCombo = Math.min(12, this.coinCombo + 1);
    }
    this.lastCoinComboAt = now;

    this.coinVariant ^= 1;
    const key = this.coinVariant ? "coin2" : "coin1";
    const s = this.loaded[key];
    if (!s?.isLoaded()) return;

    const base = AUDIO_GAIN.coin * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    const pitch = 1 + Math.min(this.coinCombo * AUDIO_TIMING.coinComboPitchStep, AUDIO_TIMING.coinComboPitchMax);
    try {
      s.stop(() => {
        s.setVolume(base);
        s.setSpeed(pitch);
        s.play(() => {
          try {
            s.setSpeed(1);
          } catch {
            /* ignore */
          }
        });
      });
    } catch {
      /* ignore */
    }
  }

  playDeath(): void {
    if (this.deathLock) return;
    this.deathLock = true;
    const s = this.loaded.death;
    if (!s?.isLoaded()) {
      this.deathLock = false;
      return;
    }
    const vol = AUDIO_GAIN.death * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    try {
      s.stop(() => {
        s.setVolume(vol);
        s.setSpeed(1);
        s.play(() => {
          this.deathLock = false;
        });
      });
    } catch {
      this.deathLock = false;
    }
    setTimeout(() => {
      this.deathLock = false;
    }, 2400);
  }

  playPowerup(): void {
    const s = this.loaded.powerup;
    if (!s?.isLoaded()) return;
    const vol = AUDIO_GAIN.powerup * AUDIO_MIX.sfx * AUDIO_MIX.sfxMaster;
    try {
      s.stop(() => {
        s.setVolume(vol);
        s.setSpeed(1);
        s.play();
      });
    } catch {
      /* ignore */
    }
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
        s.setVolume(vol);
        s.play();
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

  /** Game over: hum off, death sting */
  onGameOver(): void {
    this.stopShipHum();
    this.playDeath();
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
