import AsyncStorage from "@react-native-async-storage/async-storage";
import Sound from "react-native-sound";
import { MUSIC_ENABLED_KEY } from "../storage/persistenceKeys";
import { getAudioManager } from "./AudioManager";
import { mainBundleFilename } from "./bundleFilename";

const LOG = "[BGM]";

const UI_MUSIC = "ui_music.mp3";
const GAME_MUSIC = "game_music.mp3";

/** Menu / home / splash */
export const BGM_UI_VOLUME = 0.48;
/** Active run */
export const BGM_GAME_VOLUME = 0.72;

function safeStop(s: Sound | null | undefined): void {
  if (s?.isLoaded()) {
    try {
      s.stop();
    } catch {
      /* ignore */
    }
  }
}

function safeRelease(s: Sound | null | undefined): void {
  if (s?.isLoaded()) {
    try {
      s.release();
    } catch {
      /* ignore */
    }
  }
}

function playLoopFromStart(s: Sound | null, volume: number, label: string): void {
  if (!s?.isLoaded()) return;
  try {
    s.setNumberOfLoops(-1);
    s.setVolume(volume);
    s.stop();
    s.setCurrentTime(0);
    if (__DEV__) {
      console.log(LOG, "play (loop from start)", label);
    }
    s.play((ok) => {
      if (__DEV__ && ok === false) {
        console.warn("[GlobalMusic] play() reported failure");
      }
    });
  } catch {
    /* ignore */
  }
}

/**
 * Resume after `pause()` — only call when we know native playback was paused.
 * Avoid stacking `play()` on an already-running `Sound`; that can produce clicks/ticks.
 */
function resumeTrack(s: Sound | null, volume: number, label: string): void {
  if (!s?.isLoaded()) return;
  try {
    s.setVolume(volume);
    s.setNumberOfLoops(-1);
    if (__DEV__) {
      console.log(LOG, "play (resume)", label);
    }
    s.play();
  } catch {
    /* ignore */
  }
}

/**
 * Single global background-music manager (react-native-sound best practice):
 * - Preloads each distinct loop **once**; never `new Sound()` per screen.
 * - `uiSound` / `gameSound` hold the two MP3 assets; **route mapping is swapped** from filenames:
 *   home + splash play `game_music.mp3`, gameplay plays `ui_music.mp3`.
 * - Call `release()` when the root app unmounts / process teardown.
 */
export class GlobalMusicManager {
  private static singleton: GlobalMusicManager | null = null;

  static shared(): GlobalMusicManager {
    if (!GlobalMusicManager.singleton) {
      GlobalMusicManager.singleton = new GlobalMusicManager();
      if (__DEV__) {
        console.log(LOG, "singleton created");
      }
    }
    return GlobalMusicManager.singleton;
  }

  private uiSound: Sound | null = null;
  private gameSound: Sound | null = null;
  private loadPromise: Promise<void> | null = null;
  private routeMode: "none" | "ui" | "game" = "none";
  /** True only after `pause()` from app background — `resume()` is a no-op unless this is set. */
  private suspendedForBackground = false;
  /** Serializes overlapping `setRoute` calls (rapid navigation / async races). */
  private routeChain: Promise<void> = Promise.resolve();
  /** First bundle load finished (success or fail per file). */
  private initialized = false;
  /** User toggle — background music audible when true. */
  private userMusicEnabled = true;

  get isInitialized(): boolean {
    return this.initialized;
  }

  get isUserMusicEnabled(): boolean {
    return this.userMusicEnabled;
  }

  /**
   * Turn background music on/off (home, splash, gameplay). Persists to AsyncStorage.
   */
  setUserMusicEnabled(enabled: boolean): void {
    this.userMusicEnabled = enabled;
    void AsyncStorage.setItem(MUSIC_ENABLED_KEY, enabled ? "1" : "0");
    this.applyUserMusicVolumes();
  }

  private volHomeRoute(): number {
    return this.userMusicEnabled ? BGM_UI_VOLUME : 0;
  }

  private volGameplayRoute(): number {
    return this.userMusicEnabled ? BGM_GAME_VOLUME : 0;
  }

  /** Refresh native volumes for the active route (after toggle without restarting loops). */
  private applyUserMusicVolumes(): void {
    const u = this.uiSound;
    const g = this.gameSound;
    try {
      if (this.routeMode === "ui" && g?.isLoaded()) {
        g.setVolume(this.volHomeRoute());
        if (u?.isLoaded()) u.setVolume(0);
      } else if (this.routeMode === "game" && u?.isLoaded()) {
        u.setVolume(this.volGameplayRoute());
        if (g?.isLoaded()) g.setVolume(0);
      } else {
        if (u?.isLoaded()) u.setVolume(0);
        if (g?.isLoaded()) g.setVolume(0);
      }
    } catch {
      /* ignore */
    }
  }

  get isLoadedPromisePending(): boolean {
    return this.loadPromise != null;
  }

  ensureLoaded(): Promise<void> {
    if (this.loadPromise) {
      if (__DEV__) {
        console.log(LOG, "ensureLoaded: duplicate init attempt — reusing in-flight / completed load");
      }
      return this.loadPromise;
    }
    if (__DEV__) {
      console.log(LOG, "ensureLoaded: starting (first init)");
    }
    this.loadPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(MUSIC_ENABLED_KEY);
        this.userMusicEnabled = raw === null || raw !== "0";
      } catch {
        this.userMusicEnabled = true;
      }
      getAudioManager().configure();
      await new Promise<void>((resolve) => {
        let remaining = 2;
        const finish = (): void => {
          remaining -= 1;
          if (remaining <= 0) {
            this.initialized = true;
            if (__DEV__) {
              console.log(LOG, "ensureLoaded: finished");
            }
            resolve();
          }
        };

        const loadOne = (logical: string, assign: (x: Sound | null) => void): void => {
          const path = mainBundleFilename(logical);
          const snd = new Sound(path, Sound.MAIN_BUNDLE, (err) => {
            if (err) {
              if (__DEV__) {
                console.warn(`[GlobalMusic] failed to load ${logical} ("${path}")`, err);
              }
              assign(null);
            } else {
              assign(snd);
            }
            finish();
          });
        };

        loadOne(UI_MUSIC, (x) => {
          this.uiSound = x;
        });
        loadOne(GAME_MUSIC, (x) => {
          this.gameSound = x;
        });
      });
    })();
    return this.loadPromise;
  }

  private applyRoutePlayback(): void {
    if (this.suspendedForBackground) return;
    if (this.routeMode === "ui") {
      playLoopFromStart(this.gameSound, this.volHomeRoute(), "home/splash (game_music)");
    } else if (this.routeMode === "game") {
      playLoopFromStart(this.uiSound, this.volGameplayRoute(), "gameplay (ui_music)");
    }
  }

  setRoute(isHomeRoute: boolean): Promise<void> {
    const op = async (): Promise<void> => {
      await this.ensureLoaded();
      const next = isHomeRoute ? "ui" : "game";
      if (this.routeMode === next) {
        if (__DEV__) {
          console.log(LOG, "setRoute: skip — already", next);
        }
        return;
      }
      if (__DEV__) {
        console.log(LOG, "setRoute:", this.routeMode, "->", next);
      }
      safeStop(this.uiSound);
      safeStop(this.gameSound);
      this.routeMode = next;
      this.applyRoutePlayback();
    };

    this.routeChain = this.routeChain.then(op).catch((e) => {
      if (__DEV__) {
        console.warn(LOG, "setRoute failed", e);
      }
    });
    return this.routeChain;
  }

  pause(): void {
    if (this.suspendedForBackground) {
      if (__DEV__) {
        console.log(LOG, "pause: skip — already suspended");
      }
      return;
    }
    if (__DEV__) {
      console.log(LOG, "pause (app background)");
    }
    this.suspendedForBackground = true;
    try {
      this.uiSound?.pause();
    } catch {
      /* ignore */
    }
    try {
      this.gameSound?.pause();
    } catch {
      /* ignore */
    }
  }

  resume(): void {
    if (!this.suspendedForBackground) {
      if (__DEV__) {
        console.log(LOG, "resume: skip — was not suspended (avoids duplicate play / clicks)");
      }
      return;
    }
    if (__DEV__) {
      console.log(LOG, "resume (app foreground)");
    }
    this.suspendedForBackground = false;
    if (this.routeMode === "ui") {
      resumeTrack(this.gameSound, this.volHomeRoute(), "home/splash (game_music)");
    } else if (this.routeMode === "game") {
      resumeTrack(this.uiSound, this.volGameplayRoute(), "gameplay (ui_music)");
    } else {
      this.applyRoutePlayback();
    }
  }

  /** Hard-stop both loops; leaves `routeMode` so the next `setRoute` can still no-op — call `resetRouteForReplay` if you need music again without changing home/game. */
  stop(): void {
    if (__DEV__) {
      console.log(LOG, "stop (both tracks)");
    }
    safeStop(this.uiSound);
    safeStop(this.gameSound);
  }

  /** Stops playback and clears route so the next `setRoute(home|game)` always starts fresh. */
  resetRouteForReplay(): void {
    this.stop();
    this.routeMode = "none";
  }

  /** Native teardown — only when the app root unmounts or you intentionally destroy audio. */
  release(): void {
    if (__DEV__) {
      console.log(LOG, "release (native teardown)");
    }
    safeRelease(this.uiSound);
    safeRelease(this.gameSound);
    this.uiSound = null;
    this.gameSound = null;
    this.loadPromise = null;
    this.initialized = false;
    this.routeMode = "none";
    this.suspendedForBackground = false;
    this.routeChain = Promise.resolve();
    GlobalMusicManager.singleton = null;
  }
}

/** @deprecated Prefer `GlobalMusicManager.shared().ensureLoaded()` */
export function ensureBackgroundMusicLoaded(): Promise<void> {
  return GlobalMusicManager.shared().ensureLoaded();
}

export function setBackgroundMusicRoute(isHomeRoute: boolean): Promise<void> {
  return GlobalMusicManager.shared().setRoute(isHomeRoute);
}

export function pauseBackgroundMusic(): void {
  GlobalMusicManager.shared().pause();
}

export function resumeBackgroundMusic(): void {
  GlobalMusicManager.shared().resume();
}

export function releaseGlobalMusic(): void {
  GlobalMusicManager.shared().release();
}

export function stopBackgroundMusic(): void {
  GlobalMusicManager.shared().stop();
}

export function resetBackgroundMusicRoute(): void {
  GlobalMusicManager.shared().resetRouteForReplay();
}

export function setBackgroundMusicUserEnabled(enabled: boolean): void {
  GlobalMusicManager.shared().setUserMusicEnabled(enabled);
}

export function getBackgroundMusicUserEnabled(): boolean {
  return GlobalMusicManager.shared().isUserMusicEnabled;
}
