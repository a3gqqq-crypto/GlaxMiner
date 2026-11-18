// GlaxMiner mining scene: a small Canvas 2D game engine.
//
// Layers (back to front): pre-rendered cave/space backdrop, twinkling wall
// crystals and drifting motes, the Glaxite ore cluster (cracks, flash, charge
// glow, recoil), the miner and pickaxe (keyframed wind-up / swing / impact /
// recovery), particles (sparks, shards, glow puffs, shock rings), headlamp.
//
// Purely visual. It never reads or changes balances; the session state it is
// given (idle / mining / ready) comes from the server via GameProvider.
import { pickaxe } from "./pickaxes";
import { sfx } from "./sound";

export const W = 360;
export const H = 300;
const GROUND = 252;
const PIVOT = { x: 124, y: 170 }; // hands/pivot in front of the chest
const HANDLE = 104;
const ORE = { x: 262, y: 244 };

const A_REST = 1.05;
const A_WIND = -2.3;
const A_HIT = 0.42;
const CYCLE = 1.55; // seconds per swing
// the miner is drawn at MS scale around his feet; toWorld maps miner-space
// points (pivot, pickaxe head) into scene space
const MS = 1.24;
const ANCHOR = { x: 106, y: GROUND };
const toWorld = (x, y) => [ANCHOR.x + (x - ANCHOR.x) * MS, ANCHOR.y + (y - ANCHOR.y) * MS];

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeIn = (t) => t * t * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const rand = (a, b) => a + Math.random() * (b - a);

// ------------------------------------------------------------------ sprites
const spriteCache = new Map();
function glowSprite(color, size = 64) {
  const key = color + size;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, color);
  grd.addColorStop(0.25, color + "aa");
  grd.addColorStop(1, color + "00");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  spriteCache.set(key, c);
  return c;
}
function drawGlow(ctx, color, x, y, r, alpha = 1) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ ore shape
const CRYSTALS = [
  { dx: -50, len: 46, w: 16, ang: -0.75, tone: 0.75 },
  { dx: -30, len: 78, w: 24, ang: -0.36, tone: 0.9 },
  { dx: -4, len: 122, w: 34, ang: -0.06, tone: 1 },
  { dx: 24, len: 92, w: 28, ang: 0.24, tone: 0.92 },
  { dx: 46, len: 60, w: 20, ang: 0.55, tone: 0.8 },
  { dx: 10, len: 38, w: 16, ang: 0.95, tone: 0.7 },
];
function prismPoints(c) {
  const bx = ORE.x + c.dx;
  const by = ORE.y - 6;
  const ux = Math.sin(c.ang);
  const uy = -Math.cos(c.ang);
  const px = -uy;
  const py = ux;
  const hw = c.w / 2;
  const P = (along, side) => [bx + ux * along + px * side * hw, by + uy * along + py * side * hw];
  return {
    bl: P(0, -1), br: P(0, 1), sl: P(c.len * 0.78, -1), sr: P(c.len * 0.78, 1),
    tip: P(c.len, 0), mid0: P(0, 0), mid1: P(c.len * 0.78, 0.05),
    center: P(c.len * 0.45, 0), axis: [ux, uy],
  };
}

// ------------------------------------------------------------------ backdrop
function renderBackdrop(scale) {
  const c = document.createElement("canvas");
  c.width = Math.round(W * scale);
  c.height = Math.round(H * scale);
  const g = c.getContext("2d");
  g.scale(scale, scale);

  // space visible through the cave mouth
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0a0818");
  sky.addColorStop(0.55, "#120d26");
  sky.addColorStop(1, "#0b0b12");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(233,225,255,${rand(0.15, 0.7)})`;
    const s = Math.random() < 0.1 ? 1.4 : 0.8;
    g.fillRect(rand(0, W), rand(0, 150), s, s);
  }
  // distant ringed planet
  const pg = g.createRadialGradient(300, 40, 4, 300, 62, 60);
  pg.addColorStop(0, "#3b2a6e");
  pg.addColorStop(1, "#140f2a");
  g.fillStyle = pg;
  g.beginPath();
  g.arc(300, 62, 46, 0, TAU);
  g.fill();
  g.strokeStyle = "rgba(185,162,255,0.35)";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(300, 64, 82, 14, -0.25, 0.1, Math.PI - 0.1);
  g.stroke();
  // nebula haze
  const neb = g.createRadialGradient(90, 70, 0, 90, 70, 120);
  neb.addColorStop(0, "rgba(139,92,246,0.18)");
  neb.addColorStop(1, "rgba(139,92,246,0)");
  g.fillStyle = neb;
  g.fillRect(0, 0, W, H);

  // cave rock frame (arch)
  const rock = (pts, fill) => {
    g.fillStyle = fill;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
  };
  rock([[0, 0], [70, 0], [58, 24], [36, 40], [30, 76], [14, 120], [18, 170], [0, 210]], "#15121f");
  rock([[0, 0], [44, 0], [30, 30], [16, 60], [8, 110], [0, 140]], "#1c1829");
  rock([[W, 0], [250, 0], [236, 10], [214, 6], [192, 14], [210, 22], [252, 20], [300, 8], [330, 16], [346, 40], [W, 52]], "#15121f");
  rock([[W, 90], [342, 120], [352, 170], [336, 210], [W, 230]], "#17131f");
  // back wall behind the ore
  rock([[150, GROUND], [170, 196], [196, 170], [232, 150], [280, 140], [326, 152], [352, 186], [W, 200], [W, GROUND]], "#18141f");
  rock([[190, GROUND], [208, 210], [240, 186], [290, 178], [330, 196], [W, 214], [W, GROUND]], "#1d1826");

  // ground
  const gr = g.createLinearGradient(0, GROUND - 6, 0, H);
  gr.addColorStop(0, "#2a2438");
  gr.addColorStop(0.15, "#1a1624");
  gr.addColorStop(1, "#0d0b12");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, GROUND + 4);
  for (let x = 0; x <= W; x += 24) g.lineTo(x, GROUND + Math.sin(x * 0.07) * 2.5 + (x % 48 ? 1 : -1));
  g.lineTo(W, H);
  g.lineTo(0, H);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(185,162,255,0.18)";
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 0; x <= W; x += 24) {
    const y = GROUND + Math.sin(x * 0.07) * 2.5 + (x % 48 ? 1 : -1);
    if (x) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.stroke();
  // pebbles
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.3 ? "139,92,246" : "120,110,150"},${rand(0.15, 0.45)})`;
    g.beginPath();
    g.ellipse(rand(0, W), rand(GROUND + 8, H - 6), rand(1, 3.5), rand(0.8, 2), 0, 0, TAU);
    g.fill();
  }
  // wall crystal seams (static part; glints are animated)
  for (const [x, y, s, a] of WALL_GEMS) {
    g.fillStyle = "rgba(106,66,217,0.55)";
    g.beginPath();
    g.moveTo(x, y - s);
    g.lineTo(x + s * 0.5, y);
    g.lineTo(x, y + s * 0.6);
    g.lineTo(x - s * 0.5, y);
    g.closePath();
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.translate(-x, -y);
    g.fill();
    g.restore();
  }
  return c;
}
const WALL_GEMS = [
  [22, 96, 7, 0.3], [30, 150, 5, -0.4], [12, 186, 6, 0.2], [344, 132, 6, -0.3], [334, 184, 5, 0.5],
  [214, 12, 4, 0.2], [312, 22, 5, -0.2], [176, 206, 4, 0.1], [340, 230, 5, 0.3], [48, 34, 4, 0.4],
];

// ------------------------------------------------------------------ pickaxe head
export function drawHead(ctx, pk, t, glowBoost) {
  // local frame: origin at the end of the handle, +x along the handle,
  // +y is the striking side (tip that hits the ore).
  const edge = pk.edge;
  const metal = pk.metal;
  if (pk.glow) drawGlow(ctx, pk.glow, 0, 0, 30 + 8 * glowBoost, 0.35 + 0.35 * glowBoost);

  ctx.lineJoin = "round";
  const pick = (len, width, curl) => {
    // one blade: from the collar to a point, curved toward the handle
    ctx.beginPath();
    ctx.moveTo(-4, -width);
    ctx.quadraticCurveTo(-2 - curl, len * 0.55, -10 - curl, len);
    ctx.quadraticCurveTo(4, len * 0.5, 5, -width * 0.2);
    ctx.closePath();
  };
  const blades = (lenS, lenB, w, curl) => {
    ctx.fillStyle = metal;
    pick(lenS, w, curl);
    ctx.fill();
    ctx.save();
    ctx.scale(1, -1);
    pick(lenB, w, curl * 0.6);
    ctx.fill();
    ctx.restore();
    // cutting edge highlight on the striking blade
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.quadraticCurveTo(3, lenS * 0.5, -10 - curl, lenS);
    ctx.stroke();
  };

  switch (pk.shape) {
    case "crystal":
    case "crystal-large": {
      const big = pk.shape === "crystal-large";
      blades(big ? 30 : 26, big ? 20 : 16, 6, 5);
      ctx.fillStyle = pk.core;
      ctx.beginPath();
      const s = big ? 9 : 7;
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.7, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    case "twin": {
      blades(28, 24, 6, 4);
      ctx.fillStyle = metal;
      ctx.fillRect(-12, -5, 8, 10);
      ctx.fillStyle = pk.core;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, TAU);
      ctx.arc(-8, 0, 3, 0, TAU);
      ctx.fill();
      break;
    }
    case "arc": {
      blades(28, 18, 6, 6);
      ctx.strokeStyle = pk.core;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 40);
      ctx.beginPath();
      let y = -14;
      ctx.moveTo(-2, y);
      while (y < 22) {
        y += 5;
        ctx.lineTo(-2 + rand(-4, 4), y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = pk.core;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
      break;
    }
    case "ring": {
      blades(30, 22, 6, 5);
      ctx.strokeStyle = pk.core;
      ctx.lineWidth = 2;
      ctx.save();
      ctx.rotate(t * 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 5, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, TAU);
      ctx.fill();
      break;
    }
    case "winged": {
      ctx.fillStyle = pk.core;
      ctx.globalAlpha = 0.85;
      for (const sgn of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.quadraticCurveTo(-22, 14 * sgn, -30, 4 * sgn);
        ctx.quadraticCurveTo(-18, 6 * sgn, -6, 0);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      blades(32, 22, 7, 5);
      ctx.fillStyle = "#fff1c4";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
      break;
    }
    case "singularity": {
      blades(34, 26, 7, 6);
      drawGlow(ctx, "#b9a2ff", 0, 0, 22, 0.8);
      ctx.fillStyle = "#050507";
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#ffd27a";
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.rotate(-t * 4);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 1.3);
      ctx.stroke();
      ctx.restore();
      break;
    }
    default: {
      blades(26, 18, 6, 4);
      if (pk.core) {
        ctx.fillStyle = pk.core;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, TAU);
        ctx.fill();
      }
    }
  }
  // collar
  ctx.fillStyle = "#1a1a24";
  ctx.fillRect(-8, -4, 6, 8);
}

// ------------------------------------------------------------------ scene
export class MiningScene {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.mode = opts.mode || "idle"; // idle | mining | ready | preview
    this.tier = opts.tier || 1;
    this.charge = 0;
    this.reduced = Boolean(opts.reduced);
    this.lowPower = (navigator.hardwareConcurrency || 4) <= 4;
    this.onImpact = opts.onImpact || null;
    this.t = 0;
    this.phase = 0.6;
    this.particles = [];
    this.cracks = [];
    this.hits = 0;
    this.flash = 0;
    this.recoil = 0;
    this.shake = 0;
    this.regrow = 1;
    this.trail = [];
    this.motes = Array.from({ length: this.lowPower ? 16 : 28 }, () => ({ x: rand(0, W), y: rand(0, H), v: rand(4, 14), r: rand(0.5, 1.6), a: rand(0.2, 0.7) }));
    this.queuedStrike = false;
    this.running = false;
    this.raf = 0;
    this.last = 0;
    this.resize();
  }

  setState({ mode, tier, charge, reduced }) {
    if (mode && mode !== this.mode) {
      this.mode = mode;
      if (mode === "mining" || mode === "preview") this.phase = 0.7;
    }
    if (tier != null && tier !== this.tier) {
      this.tier = tier;
      this.burst(1.2, true);
    }
    if (charge != null) this.charge = charge;
    if (reduced != null) this.reduced = reduced;
    if (this.reduced) this.renderStill();
  }

  resize() {
    const cssW = this.canvas.clientWidth || W;
    const dprCap = this.lowPower ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    this.scale = (cssW / W) * dpr;
    this.canvas.width = Math.round(W * this.scale);
    this.canvas.height = Math.round(H * this.scale);
    this.backdrop = renderBackdrop(this.scale);
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || this.reduced) {
      this.renderStill();
      return;
    }
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  renderStill() {
    this.particles = [];
    this.render();
  }

  strike() {
    // a player tap: hurry the next swing (cosmetic only)
    if (this.mode !== "mining" && this.mode !== "preview") return false;
    if (this.phase > 0.62 || this.phase < 0.2) {
      this.phase = 0.3;
      this.queuedStrike = true;
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- update
  pose() {
    const p = this.phase;
    let a;
    let lean = 0;
    let crouch = 0;
    if (this.mode === "idle") {
      a = A_REST + Math.sin(this.t * 1.6) * 0.04;
      lean = Math.sin(this.t * 1.6) * 0.015;
      return { a, lean, crouch, swinging: false, reach: 1 };
    }
    if (this.mode === "ready") {
      a = -1.75 + Math.sin(this.t * 3) * 0.08;
      lean = -0.05;
      crouch = Math.sin(this.t * 3) * 1.5;
      return { a, lean, crouch, swinging: false, reach: 1 };
    }
    let swinging = false;
    let reach = 1;
    if (p < 0.34) {
      // backswing: the pick drops past the boots and rises behind the
      // shoulder (clockwise), arms pulled in so it clears the ground
      const k = easeInOut(p / 0.34);
      a = lerp(A_REST, A_WIND + TAU, k);
      reach = 1 - 0.34 * Math.sin(k * Math.PI);
      lean = lerp(0, -0.12, k);
      crouch = lerp(0, -2, k) + Math.sin(k * Math.PI) * 2;
    } else if (p < 0.44) {
      const k = (p - 0.34) / 0.1;
      a = A_WIND - 0.06 * Math.sin(k * Math.PI);
      lean = -0.12;
      crouch = -2;
    } else if (p < 0.53) {
      const k = easeIn((p - 0.44) / 0.09);
      a = lerp(A_WIND, A_HIT, k);
      lean = lerp(-0.12, 0.14, k);
      crouch = lerp(-2, 4, k);
      swinging = true;
    } else if (p < 0.64) {
      const k = (p - 0.53) / 0.11;
      a = A_HIT - 0.16 * Math.sin(k * Math.PI);
      lean = 0.14;
      crouch = 4 * (1 - k * 0.5);
    } else {
      const k = easeOut((p - 0.64) / 0.36);
      a = lerp(A_HIT, A_REST, k);
      lean = lerp(0.14, 0, k);
      crouch = lerp(2, 0, k);
    }
    return { a, lean, crouch, swinging, reach };
  }

  update(dt) {
    this.t += dt;
    const swingMode = this.mode === "mining" || this.mode === "preview";
    if (swingMode) {
      const prev = this.phase;
      this.phase += dt / CYCLE;
      if (prev < 0.44 && this.phase >= 0.44) sfx.swing();
      if (prev < 0.53 && this.phase >= 0.53) this.impact();
      if (this.phase >= 1) this.phase -= 1;
    }
    // decay
    this.flash = Math.max(0, this.flash - dt * 4);
    this.recoil = Math.max(0, this.recoil - dt * 6);
    this.shake *= Math.exp(-dt * 16);
    this.regrow = Math.min(1, this.regrow + dt * 1.6);
    for (const c of this.cracks) c.age += dt;

    // motes
    for (const m of this.motes) {
      m.y -= m.v * dt;
      m.x += Math.sin(this.t * 0.6 + m.v) * dt * 3;
      if (m.y < -4) {
        m.y = H + 4;
        m.x = rand(0, W);
      }
    }
    // ready: crystals shed golden sparkles
    if (this.mode === "ready" && Math.random() < dt * (this.lowPower ? 6 : 12)) {
      const c = CRYSTALS[Math.floor(rand(0, CRYSTALS.length))];
      const pts = prismPoints(c);
      this.particles.push({ k: "sparkle", x: pts.center[0] + rand(-8, 8), y: pts.center[1] + rand(-20, 20), vx: rand(-6, 6), vy: rand(-26, -10), life: 1.4, max: 1.4, c: Math.random() < 0.7 ? "#ffd27a" : "#ffffff" });
    }

    // particles
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const q = ps[i];
      q.life -= dt;
      if (q.life <= 0) {
        ps.splice(i, 1);
        continue;
      }
      if (q.k === "spark" || q.k === "shard") {
        q.vy += (q.k === "spark" ? 520 : 760) * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        if (q.y > GROUND + 4 && q.vy > 0) {
          q.y = GROUND + 4;
          q.vy *= q.k === "shard" ? -0.35 : -0.2;
          q.vx *= 0.6;
          if (q.k === "spark") q.life = Math.min(q.life, 0.12);
        }
        if (q.k === "shard") q.rot += q.vr * dt;
      } else if (q.k === "sparkle") {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
      } else if (q.k === "ring" || q.k === "puff") {
        q.r += q.vr * dt;
      } else if (q.k === "dust") {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.r += 14 * dt;
      }
    }
  }

  impact() {
    const pk = pickaxe(this.tier);
    // contact point: the pick head at the moment of impact (lean 0.14 moves the pivot)
    const [hx, hy] = toWorld(PIVOT.x + Math.sin(0.14) * 40 + Math.cos(A_HIT) * HANDLE - 2, PIVOT.y + 4 + Math.sin(A_HIT) * HANDLE + 6);
    this.hits += 1;
    const big = this.hits % 8 === 0;
    this.flash = big ? 1 : 0.7;
    this.recoil = 1;
    this.shake = big ? 6.5 : 2.8 + pk.power * 0.6;

    const scale = this.lowPower ? 0.6 : 1;
    const nSpark = Math.round((12 + 6 * pk.power) * scale * (big ? 1.6 : 1));
    for (let i = 0; i < nSpark; i++) {
      const ang = rand(-Math.PI * 0.95, -Math.PI * 0.15) + Math.PI * 0.05;
      const sp = rand(120, 320) * (0.8 + pk.power * 0.15);
      this.particles.push({ k: "spark", x: hx, y: hy, vx: Math.cos(ang) * sp - 60, vy: Math.sin(ang) * sp, life: rand(0.25, 0.6), max: 0.6, c: pk.sparks[i % pk.sparks.length] });
    }
    const nShard = Math.round((5 + 3 * pk.power) * scale * (big ? 3 : 1));
    for (let i = 0; i < nShard; i++) {
      const ang = rand(-Math.PI * 0.95, -Math.PI * 0.35);
      const sp = rand(110, 260) * (big ? 1.4 : 1);
      const n = 3 + Math.floor(Math.random() * 3);
      const r = rand(3, big ? 8 : 6);
      const pts = Array.from({ length: n }, (_, j) => {
        const a = (j / n) * TAU + rand(-0.4, 0.4);
        const rr = r * rand(0.6, 1.2);
        return [Math.cos(a) * rr, Math.sin(a) * rr];
      });
      this.particles.push({ k: "shard", x: hx + rand(-4, 8), y: hy + rand(-8, 8), vx: Math.cos(ang) * sp + rand(-20, 40), vy: Math.sin(ang) * sp, rot: rand(0, TAU), vr: rand(-14, 14), pts, life: rand(1, 1.8), max: 1.8, c: Math.random() < 0.6 ? "#9b74ff" : Math.random() < 0.5 ? "#b9a2ff" : "#6a42d9" });
    }
    this.particles.push({ k: "puff", x: hx, y: hy, r: 14, vr: 160, life: 0.3, max: 0.3, c: pk.sparks[0] });
    for (let i = 0; i < (this.lowPower ? 3 : 6); i++) {
      this.particles.push({ k: "dust", x: hx + rand(-10, 10), y: GROUND - rand(0, 10), vx: rand(-30, 30), vy: rand(-18, -4), r: rand(6, 12), life: rand(0.6, 1.1), max: 1.1 });
    }
    this.particles.push({ k: "ring", x: hx, y: hy, r: 4, vr: big ? 260 : 170, life: big ? 0.45 : 0.32, max: big ? 0.45 : 0.32, c: pk.trail });

    // cracks spread from the strike into the big crystal
    if (big) {
      this.cracks = [];
      this.regrow = 0.82;
      sfx.shatter();
    } else {
      const segs = [[hx + 2, hy]];
      let x = hx + 2;
      let y = hy;
      let dir = rand(-0.9, 0.5);
      for (let i = 0; i < 4 + Math.floor(Math.random() * 3); i++) {
        dir += rand(-0.7, 0.7);
        x += Math.cos(dir) * rand(6, 13);
        y += Math.sin(dir) * rand(6, 13) - 3;
        segs.push([x, y]);
      }
      this.cracks.push({ segs, age: 0 });
      if (this.cracks.length > 7) this.cracks.shift();
    }
    sfx.impact(Math.min(pk.power, 2));
    if (Math.random() < 0.5) setTimeout(() => sfx.tick(), 70);
    this.onImpact?.({ big, tap: this.queuedStrike });
    this.queuedStrike = false;
  }

  burst(power = 1, celebrate = false) {
    // a ring of fragments around the ore (used for upgrades / claim)
    const pk = pickaxe(this.tier);
    for (let i = 0; i < 26 * power; i++) {
      const a = rand(0, TAU);
      const sp = rand(60, 220);
      this.particles.push({ k: "spark", x: ORE.x, y: ORE.y - 60, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: rand(0.4, 0.9), max: 0.9, c: celebrate ? pk.sparks[i % pk.sparks.length] : "#ffd27a" });
    }
    this.particles.push({ k: "ring", x: ORE.x, y: ORE.y - 60, r: 10, vr: 300, life: 0.5, max: 0.5, c: pk.trail });
    this.flash = 1;
    this.shake = 5;
  }

  // ---------------------------------------------------------------- render
  render() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.backdrop, 0, 0);
    const sx = this.shake > 0.05 ? rand(-1, 1) * this.shake : 0;
    const sy = this.shake > 0.05 ? rand(-1, 1) * this.shake * 0.7 : 0;
    ctx.setTransform(s, 0, 0, s, sx * s, sy * s);

    const t = this.t;
    const live = this.mode === "mining" || this.mode === "preview";
    const ready = this.mode === "ready";

    // wall glints
    ctx.globalCompositeOperation = "lighter";
    WALL_GEMS.forEach(([x, y], i) => {
      const tw = 0.5 + 0.5 * Math.sin(t * 1.3 + i * 1.7);
      drawGlow(ctx, "#8b5cf6", x, y, 10, 0.25 + 0.4 * tw);
    });
    for (const m of this.motes) {
      ctx.globalAlpha = m.a;
      ctx.fillStyle = "#b9a2ff";
      ctx.fillRect(m.x, m.y, m.r, m.r);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    this.drawOre(ctx, live, ready);
    const pose = this.pose();
    this.drawMiner(ctx, pose);
    this.drawParticles(ctx);

    // vignette
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const v = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, H * 0.85);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(5,5,10,0.55)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  drawOre(ctx, live, ready) {
    const t = this.t;
    const charge = ready ? 1 : this.charge;
    const squash = 1 - this.recoil * 0.035;
    ctx.save();
    ctx.translate(ORE.x, ORE.y);
    ctx.scale(1 + this.recoil * 0.02, squash);
    ctx.translate(-ORE.x, -ORE.y);

    // aura
    ctx.globalCompositeOperation = "lighter";
    const auraCol = ready ? "#f5b544" : "#8b5cf6";
    const breathe = 0.5 + 0.5 * Math.sin(t * (ready ? 4 : 1.8));
    drawGlow(ctx, auraCol, ORE.x, ORE.y - 62, 92, (live ? 0.28 + 0.3 * charge : 0.18) + 0.1 * breathe + this.flash * 0.35);
    ctx.globalCompositeOperation = "source-over";

    // rock bed
    ctx.fillStyle = "#231d30";
    ctx.beginPath();
    ctx.moveTo(ORE.x - 84, ORE.y + 8);
    ctx.lineTo(ORE.x - 66, ORE.y - 12);
    ctx.lineTo(ORE.x - 30, ORE.y - 20);
    ctx.lineTo(ORE.x + 20, ORE.y - 22);
    ctx.lineTo(ORE.x + 62, ORE.y - 14);
    ctx.lineTo(ORE.x + 84, ORE.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2e2740";
    ctx.beginPath();
    ctx.moveTo(ORE.x - 66, ORE.y - 12);
    ctx.lineTo(ORE.x - 30, ORE.y - 20);
    ctx.lineTo(ORE.x - 10, ORE.y - 4);
    ctx.lineTo(ORE.x - 50, ORE.y);
    ctx.closePath();
    ctx.fill();

    // crystals, back to front
    const order = [0, 5, 4, 1, 3, 2];
    for (const idx of order) {
      const c = CRYSTALS[idx];
      const main = idx === 2;
      const g = main ? this.regrow : 1;
      const cc = { ...c, len: c.len * g };
      const P = prismPoints(cc);
      const tone = c.tone;
      const leftCol = ready ? `rgba(${Math.round(150 * tone)},${Math.round(98 * tone)},${Math.round(40 * tone)},1)` : `rgba(${Math.round(75 * tone)},${Math.round(46 * tone)},${Math.round(163 * tone)},1)`;
      const rightCol = ready ? `rgba(${Math.round(230 * tone)},${Math.round(160 * tone)},${Math.round(60 * tone)},1)` : `rgba(${Math.round(124 * tone)},${Math.round(84 * tone)},${Math.round(240 * tone)},1)`;
      ctx.fillStyle = leftCol;
      ctx.beginPath();
      ctx.moveTo(...P.bl);
      ctx.lineTo(...P.sl);
      ctx.lineTo(...P.tip);
      ctx.lineTo(...P.mid1);
      ctx.lineTo(...P.mid0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rightCol;
      ctx.beginPath();
      ctx.moveTo(...P.mid0);
      ctx.lineTo(...P.mid1);
      ctx.lineTo(...P.tip);
      ctx.lineTo(...P.sr);
      ctx.lineTo(...P.br);
      ctx.closePath();
      ctx.fill();
      // facet highlights
      ctx.strokeStyle = ready ? "rgba(255,236,190,0.75)" : "rgba(233,225,255,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(...P.mid0);
      ctx.lineTo(...P.mid1);
      ctx.lineTo(...P.tip);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(...P.sl);
      ctx.lineTo(...P.tip);
      ctx.lineTo(...P.mid1);
      ctx.closePath();
      ctx.fill();
      // inner energy: charges up with the session
      ctx.globalCompositeOperation = "lighter";
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + idx);
      const inner = ready ? "#ffd27a" : live ? "#3dd6f5" : "#9b74ff";
      drawGlow(ctx, inner, P.center[0], P.center[1], c.w * 1.1, (live ? 0.18 + 0.45 * charge : ready ? 0.6 : 0.12) * (0.75 + 0.25 * pulse) + this.flash * (main ? 0.6 : 0.25));
      ctx.globalCompositeOperation = "source-over";
    }

    // cracks (glowing, fade to faint scars)
    ctx.globalCompositeOperation = "lighter";
    for (const cr of this.cracks) {
      const fresh = Math.max(0, 1 - cr.age * 1.6);
      ctx.strokeStyle = ready ? `rgba(255,220,150,${0.35 + 0.6 * fresh})` : `rgba(160,235,255,${0.3 + 0.65 * fresh})`;
      ctx.lineWidth = 1 + fresh * 1.2;
      ctx.beginPath();
      cr.segs.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      if (fresh > 0) {
        const [ex, ey] = cr.segs[cr.segs.length - 1];
        drawGlow(ctx, "#e8f8ff", ex, ey, 6, fresh);
      }
    }
    // hit flash
    if (this.flash > 0.02) drawGlow(ctx, "#ffffff", ORE.x - 30, ORE.y - 40, 70, this.flash * 0.45);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  drawMiner(ctx, pose) {
    ctx.save();
    ctx.translate(ANCHOR.x, ANCHOR.y);
    ctx.scale(MS, MS);
    ctx.translate(-ANCHOR.x, -ANCHOR.y);
    this.drawMinerBody(ctx, pose);
    ctx.restore();
  }

  drawMinerBody(ctx, pose) {
    const pk = pickaxe(this.tier);
    const t = this.t;
    const hipX = 104;
    const hipY = 206 + pose.crouch;
    const lean = pose.lean;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(108, GROUND + 3, 34, 5, 0, 0, TAU);
    ctx.fill();

    // legs
    const leg = (x0, footX) => {
      ctx.strokeStyle = "#2a2a3c";
      ctx.lineWidth = 11;
      ctx.lineCap = "round";
      const kneeX = lerp(x0, footX, 0.5) + 5;
      const kneeY = lerp(hipY, GROUND - 6, 0.5) + pose.crouch * 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, hipY);
      ctx.quadraticCurveTo(kneeX + 4, kneeY, footX, GROUND - 6);
      ctx.stroke();
      ctx.fillStyle = "#3a3448";
      ctx.beginPath();
      ctx.roundRect(footX - 9, GROUND - 10, 20, 9, 3);
      ctx.fill();
      ctx.fillStyle = "#8b5cf6";
      ctx.fillRect(footX - 7, GROUND - 3, 16, 2);
    };
    leg(hipX - 6, 88);
    leg(hipX + 6, 124);

    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(lean);

    // backpack + glowing coolant tube
    ctx.fillStyle = "#22222f";
    ctx.beginPath();
    ctx.roundRect(-30, -50, 16, 36, 4);
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    const tube = 0.6 + 0.4 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(61,214,245,${0.5 * tube + 0.2})`;
    ctx.fillRect(-26, -46, 3, 28);
    drawGlow(ctx, "#3dd6f5", -24, -32, 12, 0.35 * tube);
    ctx.globalCompositeOperation = "source-over";

    // torso (suit)
    const torso = ctx.createLinearGradient(-16, -58, 18, 0);
    torso.addColorStop(0, "#3a3550");
    torso.addColorStop(1, "#24212f");
    ctx.fillStyle = torso;
    ctx.beginPath();
    ctx.roundRect(-18, -58, 34, 54, 10);
    ctx.fill();
    // chest plate + emblem light
    ctx.fillStyle = "#4a4466";
    ctx.beginPath();
    ctx.roundRect(-10, -50, 22, 18, 5);
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    drawGlow(ctx, "#9b74ff", 1, -41, 9, 0.7);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#b9a2ff";
    ctx.beginPath();
    ctx.moveTo(1, -46);
    ctx.lineTo(5, -41);
    ctx.lineTo(1, -36);
    ctx.lineTo(-3, -41);
    ctx.closePath();
    ctx.fill();
    // belt
    ctx.fillStyle = "#17161f";
    ctx.fillRect(-18, -12, 34, 6);
    ctx.fillStyle = "#f5b544";
    ctx.fillRect(-2, -12, 6, 6);

    // head + helmet
    ctx.save();
    ctx.translate(0, -70);
    ctx.rotate(lean * 0.6);
    ctx.fillStyle = "#2c2a3c";
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, TAU);
    ctx.fill();
    // visor
    const vis = ctx.createLinearGradient(-2, -6, 14, 6);
    vis.addColorStop(0, "#1b6f86");
    vis.addColorStop(1, "#3dd6f5");
    ctx.fillStyle = vis;
    ctx.beginPath();
    ctx.roundRect(-1, -6, 16, 11, 5);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(3, -4, 6, 2);
    // helmet dome + lamp
    ctx.fillStyle = "#46405e";
    ctx.beginPath();
    ctx.arc(0, -3, 17, Math.PI * 1.02, Math.PI * 1.98);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(-16, -5, 32, 3);
    ctx.fillStyle = "#fff4d6";
    ctx.beginPath();
    ctx.arc(10, -12, 3.2, 0, TAU);
    ctx.fill();
    ctx.restore();

    // headlamp beam toward the ore
    ctx.globalCompositeOperation = "lighter";
    const beam = ctx.createLinearGradient(10, -82, 150, -40);
    const flick = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 3.7);
    beam.addColorStop(0, `rgba(255,244,214,${0.22 * flick})`);
    beam.addColorStop(1, "rgba(255,244,214,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(10, -82);
    ctx.lineTo(170, -96);
    ctx.lineTo(170, -10);
    ctx.closePath();
    ctx.fill();
    drawGlow(ctx, "#fff4d6", 10, -82, 10, 0.8 * flick);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // ---- pickaxe + arms (world space, pivot follows the lean)
    const px = PIVOT.x + Math.sin(lean) * 40;
    const py = PIVOT.y + pose.crouch;
    const a = pose.a;
    const ux = Math.cos(a);
    const uy = Math.sin(a);

    // motion trail during the swing
    const L = HANDLE * (pose.reach ?? 1);
    const headX = px + ux * L;
    const headY = py + uy * L;
    if (pose.swinging) this.trail.push([headX, headY, this.t]);
    this.trail = this.trail.filter((tr) => this.t - tr[2] < 0.14).slice(-10);
    if (this.trail.length > 1) {
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (let i = 1; i < this.trail.length; i++) {
        const [x0, y0, t0] = this.trail[i - 1];
        const [x1, y1] = this.trail[i];
        ctx.strokeStyle = pk.trail;
        ctx.globalAlpha = Math.max(0, 1 - (this.t - t0) / 0.14) * 0.55;
        ctx.lineWidth = 3 + i * 1.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    // shoulders (move with torso lean)
    const shBackX = hipX - 8 + Math.sin(lean) * 52;
    const shFrontX = hipX + 10 + Math.sin(lean) * 52;
    const shY = hipY - 52 + pose.crouch * 0.3;
    const handA = [px + ux * 14, py + uy * 14];
    const handB = [px + ux * 34, py + uy * 34];
    const arm = (sx, sy, [hx, hy], col) => {
      const mx = (sx + hx) / 2;
      const my = (sy + hy) / 2 + 10;
      ctx.strokeStyle = col;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx, my, hx, hy);
      ctx.stroke();
    };
    arm(shBackX, shY, handA, "#2b2838");

    // handle
    ctx.strokeStyle = pk.handle;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px - ux * 10, py - uy * 10);
    ctx.lineTo(headX, headY);
    ctx.stroke();
    ctx.strokeStyle = pk.grip;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(px + ux * 8, py + uy * 8);
    ctx.lineTo(px + ux * 40, py + uy * 40);
    ctx.stroke();

    // head (oriented so the striking tip leads the swing)
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(a);
    drawHead(ctx, pk, t, pose.swinging ? 1 : 0.4);
    ctx.restore();

    arm(shFrontX, shY, handB, "#3a3550");
    ctx.fillStyle = "#1c1b26";
    for (const [hx, hy] of [handA, handB]) {
      ctx.beginPath();
      ctx.arc(hx, hy, 4.6, 0, TAU);
      ctx.fill();
    }
  }

  drawParticles(ctx) {
    ctx.globalCompositeOperation = "lighter";
    for (const q of this.particles) {
      const k = q.life / q.max;
      if (q.k === "spark") {
        ctx.strokeStyle = q.c;
        ctx.globalAlpha = Math.min(1, k * 1.8);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - q.vx * 0.045, q.y - q.vy * 0.045);
        ctx.stroke();
        ctx.drawImage(glowSprite(q.c), q.x - 5, q.y - 5, 10, 10);
      } else if (q.k === "dust") {
        ctx.globalAlpha = k * 0.35;
        ctx.drawImage(glowSprite("#8a7fa8"), q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      } else if (q.k === "sparkle") {
        drawGlow(ctx, q.c, q.x, q.y, 5, k);
      } else if (q.k === "puff") {
        drawGlow(ctx, q.c, q.x, q.y, q.r, k * 0.9);
      } else if (q.k === "ring") {
        ctx.strokeStyle = q.c;
        ctx.globalAlpha = k * 0.8;
        ctx.lineWidth = 2 * k + 0.5;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    for (const q of this.particles) {
      if (q.k !== "shard") continue;
      const k = q.life / q.max;
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.globalAlpha = Math.min(1, k * 2.5);
      ctx.fillStyle = q.c;
      ctx.beginPath();
      q.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(233,225,255,0.9)";
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}

export { clamp };
