import {
  DEBUG_PERF_OVERLAY,
  PERF_SAMPLE_WINDOW,
  PERF_UI_REFRESH_MS,
  TARGET_FRAME_MS,
  tierFromAvgFrameTime,
  type VisualQualityTier,
} from "./performanceConfig";

export type PerfSamplerStats = {
  fps: number;
  avgFrameMs: number;
  droppedFrames: number;
  visualTier: VisualQualityTier;
  obstacleCount: number;
  extraFxCount: number;
};

/**
 * RAF frame-time ring (simple array trim). Optional React refresh for debug HUD.
 */
export class PerfSampler {
  private times: number[] = [];
  private lastPush = 0;
  private lastT = 0;
  private dropped = 0;
  private smoothedTier: VisualQualityTier = 0;
  private highLoadStreak = 0;
  private lowLoadStreak = 0;

  reset(): void {
    this.times = [];
    this.lastPush = 0;
    this.lastT = 0;
    this.dropped = 0;
    this.smoothedTier = 0;
    this.highLoadStreak = 0;
    this.lowLoadStreak = 0;
  }

  recordFrame(nowMs: number): void {
    if (this.lastT > 0) {
      const dt = nowMs - this.lastT;
      this.times.push(dt);
      if (this.times.length > PERF_SAMPLE_WINDOW) this.times.shift();
      if (dt > TARGET_FRAME_MS * 1.75) this.dropped += 1;
    }
    this.lastT = nowMs;

    const raw = tierFromAvgFrameTime(this.avgMs());
    if (raw > this.smoothedTier) {
      this.highLoadStreak++;
      this.lowLoadStreak = 0;
      if (this.highLoadStreak >= 2) {
        this.smoothedTier = raw;
        this.highLoadStreak = 0;
      }
    } else if (raw < this.smoothedTier) {
      this.lowLoadStreak++;
      this.highLoadStreak = 0;
      if (this.lowLoadStreak >= 4) {
        this.smoothedTier = raw;
        this.lowLoadStreak = 0;
      }
    } else {
      this.highLoadStreak = 0;
      this.lowLoadStreak = 0;
    }
  }

  shouldRefreshUi(nowMs: number): boolean {
    if (!DEBUG_PERF_OVERLAY) return false;
    if (nowMs - this.lastPush >= PERF_UI_REFRESH_MS) {
      this.lastPush = nowMs;
      return true;
    }
    return false;
  }

  getStats(obstacleCount: number, extraFxCount: number): PerfSamplerStats {
    const avg = this.avgMs();
    return {
      fps: avg > 0.05 ? 1000 / avg : 0,
      avgFrameMs: avg,
      droppedFrames: this.dropped,
      visualTier: this.smoothedTier,
      obstacleCount,
      extraFxCount,
    };
  }

  getVisualTier(): VisualQualityTier {
    return this.smoothedTier;
  }

  private avgMs(): number {
    if (this.times.length === 0) return TARGET_FRAME_MS;
    let s = 0;
    for (let i = 0; i < this.times.length; i++) s += this.times[i];
    return s / this.times.length;
  }
}
