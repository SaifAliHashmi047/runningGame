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
  private musicDucked = false;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  private effMusicVol = AUDIO_MIX.music * AUDIO_MIX.musicMaster;
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
        ["bgMenu", BUNDLE_AUDIO.bgMenu],
        ["bgGameplay", BUNDLE_AUDIO.bgGameplay],
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

  private bgMenu(): Sound | null {
    return this.loaded.bgMenu ?? null;
  }
  private bgGameplay(): Sound | null {
    return this.loaded.bgGameplay ?? null;
  }
  private hum(): Sound | null {
    return this.loaded.shipHum ?? null;
  }

  private clearFade() {
    if (this.fadeTimer != null) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private fadeVolume(s: Sound | null, from: number, to: number, ms: number, onDone?: () => void) {
    this.clearFade();
    if (!s?.isLoaded()) {
      onDone?.();
      return;
    }
    const steps = Math.max(8, Math.floor(ms / 32));
    let i = 0;
    this.fadeTimer = setInterval(() => {
      i++;
      const t = Math.min(1, i / steps);
      const v = from + (to - from) * t;
      try {
        s.setVolume(v);
      } catch {
        /* ignore */
      }
      if (i >= steps) {
        this.clearFade();
        onDone?.();
      }
    }, Math.max(16, Math.floor(ms / steps)));
  }

  // —— Menu / gameplay music ——

  playMenuMusic(): void {
    const menu = this.bgMenu();
    const game = this.bgGameplay();
    safeStop(game);
    this.musicDucked = false;
    this.clearFade();
    if (!menu?.isLoaded()) return;
    menu.setNumberOfLoops(-1);
    menu.setVolume(0);
    menu.play();
    this.fadeVolume(menu, 0, this.effMusicVol * AUDIO_GAIN.bgMenu, AUDIO_TIMING.musicFadeInMs);
  }

  stopMenuMusic(): void {
    const menu = this.bgMenu();
    if (!menu?.isLoaded()) return;
    this.fadeVolume(menu, menu.getVolume(), 0, AUDIO_TIMING.musicFadeOutMs, () => safeStop(menu));
  }

  playGameplayMusic(): void {
    const menu = this.bgMenu();
    const game = this.bgGameplay();
    safeStop(menu);
    this.musicDucked = false;
    this.clearFade();
    if (!game?.isLoaded()) return;
    game.setNumberOfLoops(-1);
    game.setVolume(0);
    game.play();
    this.fadeVolume(game, 0, this.effMusicVol * AUDIO_GAIN.bgGameplay, AUDIO_TIMING.musicFadeInMs);
  }

  stopGameplayMusic(): void {
    const game = this.bgGameplay();
    if (!game?.isLoaded()) return;
    this.fadeVolume(game, game.getVolume(), 0, AUDIO_TIMING.musicFadeOutMs, () => safeStop(game));
  }

  /** Alias — looping gameplay bed */
  playMusicLoop(): void {
    this.playGameplayMusic();
  }

  /** Alias — soft hero hover loop */
  playShipHumLoop(): void {
    this.startShipHum();
  }

  pauseMusic(): void {
    safePause(this.bgGameplay());
  }

  resumeMusic(): void {
    const g = this.bgGameplay();
    if (!g?.isLoaded()) return;
    try {
      g.play();
    } catch {
      /* ignore */
    }
  }

  duckMusic(): void {
    const game = this.bgGameplay();
    if (!game?.isLoaded()) return;
    this.musicDucked = true;
    const cur = game.getVolume();
    const target = this.effMusicVol * AUDIO_GAIN.bgGameplay * AUDIO_TIMING.duckMusicMult;
    this.fadeVolume(game, cur, target, 180);
  }

  unduckMusic(): void {
    const game = this.bgGameplay();
    if (!game?.isLoaded()) return;
    this.musicDucked = false;
    const target = this.effMusicVol * AUDIO_GAIN.bgGameplay;
    this.fadeVolume(game, game.getVolume(), target, 260);
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
    this.pauseMusic();
    this.pauseShipHum();
  }

  resumeGameAudio(): void {
    this.resumeMusic();
    this.resumeShipHum();
  }

  /**
   * Entering a run from menu / retry: menu off, gameplay + hum on.
   */
  onGameSessionStart(): void {
    this.stopMenuMusic();
    this.deathLock = false;
    this.playGameplayMusic();
    this.startShipHum();
  }

  /**
   * Leaving game screen (home): stop run layers, menu handled separately.
   */
  onGameSessionEnd(): void {
    this.clearFade();
    this.stopShipHum();
    this.stopGameplayMusic();
  }

  /** Game over: hum off, music duck, death sting */
  onGameOver(): void {
    this.stopShipHum();
    this.duckMusic();
    this.playDeath();
  }

  /** After retry — restore mix and loops */
  onRunRestart(): void {
    this.deathLock = false;
    this.musicDucked = false;
    this.unduckMusic();
    this.startShipHum();
  }

  dispose(): void {
    this.clearFade();
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
