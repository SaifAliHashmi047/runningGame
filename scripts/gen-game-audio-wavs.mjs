/**
 * Generates short placeholder .wav files (replace with real MP3/WAV assets).
 * Writes to audio/* (source tree), android res/raw, and ios StackHouse bundle.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function writeWav(filePath, { durationSec, sineHz = 440, gain = 0.12 }) {
  const sampleRate = 22050;
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSec));
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const v = Math.sin(2 * Math.PI * sineHz * t) * gain;
    const s = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
    buf.writeInt16LE(s, 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

function writeNoiseBurst(filePath, durationSec, gain = 0.2) {
  const sampleRate = 22050;
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSec));
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  let seed = 0xfeed;
  for (let i = 0; i < numSamples; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const env = 1 - i / numSamples;
    const v = (((seed & 0xffff) / 0x8000) - 1) * gain * env;
    const s = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
    buf.writeInt16LE(s, 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

const specs = [
  { rel: "sfx/coin_collect_1.wav", durationSec: 0.055, sineHz: 920, gain: 0.14 },
  { rel: "sfx/coin_collect_2.wav", durationSec: 0.055, sineHz: 740, gain: 0.13 },
  { rel: "sfx/hero_dead.wav", durationSec: 0.38, sineHz: 0, gain: 0 },
  { rel: "sfx/zone_speed_up.wav", durationSec: 0.22, sineHz: 0, gain: 0 },
  { rel: "sfx/powerup_collect.wav", durationSec: 0.16, sineHz: 330, gain: 0.16 },
  { rel: "sfx/button_tap.wav", durationSec: 0.028, sineHz: 2400, gain: 0.09 },
  { rel: "sfx/obstacle_hit.wav", durationSec: 0.09, sineHz: 120, gain: 0.18 },
  { rel: "ambient/ship_hum_loop.wav", durationSec: 0.35, sineHz: 72, gain: 0.07 },
];

for (const s of specs) {
  const base = path.basename(s.rel);
  const audioDir = path.join(root, "audio", path.dirname(s.rel));
  const androidPath = path.join(root, "android", "app", "src", "main", "res", "raw", base);
  const iosPath = path.join(root, "ios", "StackHouse", base);

  if (s.rel === "sfx/hero_dead.wav") {
    writeNoiseBurst(path.join(audioDir, path.basename(s.rel)), s.durationSec, 0.22);
    writeNoiseBurst(androidPath, s.durationSec, 0.22);
    writeNoiseBurst(iosPath, s.durationSec, 0.22);
  } else if (s.rel === "sfx/zone_speed_up.wav") {
    const sr = 22050;
    const n = Math.floor(sr * s.durationSec);
    const dataSize = n * 2;
    const buf = Buffer.alloc(44 + dataSize);
    buf.write("RIFF", 0);
    buf.writeUInt32LE(36 + dataSize, 4);
    buf.write("WAVE", 8);
    buf.write("fmt ", 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(1, 22);
    buf.writeUInt32LE(sr, 24);
    buf.writeUInt32LE(sr * 2, 28);
    buf.writeUInt16LE(2, 32);
    buf.writeUInt16LE(16, 34);
    buf.write("data", 36);
    buf.writeUInt32LE(dataSize, 40);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const f = 320 + t * 480;
      const v = Math.sin(2 * Math.PI * f * t) * 0.12 * (0.4 + (i / n) * 0.6);
      const samp = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
      buf.writeInt16LE(samp, 44 + i * 2);
    }
    fs.mkdirSync(audioDir, { recursive: true });
    fs.writeFileSync(path.join(audioDir, path.basename(s.rel)), buf);
    fs.mkdirSync(path.dirname(androidPath), { recursive: true });
    fs.writeFileSync(androidPath, buf);
    fs.mkdirSync(path.dirname(iosPath), { recursive: true });
    fs.writeFileSync(iosPath, buf);
  } else {
    writeWav(path.join(audioDir, path.basename(s.rel)), {
      durationSec: s.durationSec,
      sineHz: s.sineHz,
      gain: s.gain,
    });
    fs.mkdirSync(path.dirname(androidPath), { recursive: true });
    writeWav(androidPath, { durationSec: s.durationSec, sineHz: s.sineHz, gain: s.gain });
    fs.mkdirSync(path.dirname(iosPath), { recursive: true });
    writeWav(iosPath, { durationSec: s.durationSec, sineHz: s.sineHz, gain: s.gain });
  }
}

console.log("Wrote placeholder WAVs to audio/, android/.../raw/, ios/StackHouse/");
