// Synthesised sound effects (Web Audio): no audio files to download.
// Off by default; enabling happens from a tap, which also unlocks audio on
// mobile browsers. Everything is quiet and short to stay pleasant on loop.
import { getPref } from "../lib/prefs";

let ctx = null;
let master = null;
let noise = null;

function enabled() {
  return getPref("sound") === true && document.visibilityState === "visible";
}

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      const len = ctx.sampleRate * 0.6;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    ctx = null;
  }
}

function env(g, t, a, peak, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function noiseBurst({ dur = 0.2, from = 800, to = 3000, type = "bandpass", q = 1.2, peak = 0.3, attack = 0.01, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  env(g, t, attack, peak, dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.3);
  src.stop(t + dur + 0.05);
}

function tone({ freq, to, dur = 0.15, type = "sine", peak = 0.2, delay = 0, attack = 0.004 }) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  env(g, t, attack, peak, dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  swing() {
    if (!enabled() || !ctx) return;
    noiseBurst({ dur: 0.22, from: 400, to: 2600, q: 0.8, peak: 0.12, attack: 0.08 });
  },
  impact(power = 1) {
    if (!enabled() || !ctx) return;
    tone({ freq: 140, to: 55, dur: 0.18, type: "sine", peak: 0.35 });
    noiseBurst({ dur: 0.09, from: 3500, to: 1200, q: 0.9, peak: 0.28 });
    const base = 1300 + Math.random() * 500;
    tone({ freq: base, dur: 0.35, type: "triangle", peak: 0.07 * power, delay: 0.01 });
    tone({ freq: base * 1.5, dur: 0.28, type: "sine", peak: 0.05 * power, delay: 0.03 });
  },
  shatter() {
    if (!enabled() || !ctx) return;
    noiseBurst({ dur: 0.35, from: 5000, to: 1500, type: "highpass", q: 0.7, peak: 0.25 });
    for (let i = 0; i < 5; i++) tone({ freq: 1800 + Math.random() * 2200, dur: 0.18, type: "sine", peak: 0.05, delay: 0.03 + i * 0.045 });
  },
  tick() {
    if (!enabled() || !ctx) return;
    tone({ freq: 2400 + Math.random() * 800, dur: 0.07, type: "sine", peak: 0.03 });
  },
  upgrade() {
    if (!enabled() || !ctx) return;
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.32, type: "triangle", peak: 0.12, delay: i * 0.09 }));
    noiseBurst({ dur: 0.6, from: 600, to: 6000, q: 0.5, peak: 0.08, attack: 0.2 });
  },
  claim() {
    if (!enabled() || !ctx) return;
    [784, 988, 1175, 1568].forEach((f, i) => tone({ freq: f, dur: 0.4, type: "sine", peak: 0.11, delay: i * 0.07 }));
    tone({ freq: 196, to: 98, dur: 0.5, type: "sine", peak: 0.25 });
  },
};
