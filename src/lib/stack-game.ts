import { cats, catImage } from "./cats";
import { bonk, meow, pop } from "./sound";

export interface StackGameEvents {
  onScore(score: number): void;
  onLives(lives: number): void;
  onGameOver(score: number): void;
}

interface Stacked {
  img: HTMLImageElement;
  w: number;
  h: number;
  /** current drawn center x (springs toward the target) */
  x: number;
  /** offset from the center of the piece below, set when it landed */
  offset: number;
  rot: number;
}

type FallingKind = "cat" | "bird" | "fish";

interface Falling {
  kind: FallingKind;
  img?: HTMLImageElement;
  pitch: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  phase: number;
  rot: number;
  vr: number;
}

interface Debris {
  img?: HTMLImageElement;
  glyph?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const MAX_LIVES = 3;
const GRAVITY = 1400;
const SPARK_COLORS = ["#ffd34e", "#f07a2b", "#ffffff", "#ff9ec4"];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export class StackGame {
  private readonly ctx: CanvasRenderingContext2D;
  private capyImg?: HTMLImageElement;
  private catImgs: { img: HTMLImageElement; pitch: number }[] = [];

  private width = 0;
  private height = 0;
  private dpr = 1;

  private running = false;
  private paused = false;
  private raf = 0;
  private last = 0;

  private capyX = 0;
  private capyW = 0;
  private capyH = 0;
  private targetX = 0;
  private keyDir = 0;

  private stack: Stacked[] = [];
  private falling: Falling[] = [];
  private debris: Debris[] = [];
  private sparks: Spark[] = [];
  private camY = 0;
  private spawnTimer = 0;
  private elapsed = 0;
  private lives = MAX_LIVES;
  private score = 0;
  private shake = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly events: StackGameEvents,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    this.ctx = ctx;
    if (import.meta.env.DEV) (window as unknown as { __stackGame: StackGame }).__stackGame = this;
  }

  async load(): Promise<void> {
    const playable = cats.filter((c) => c.id !== "Capy");
    const [capy, ...rest] = await Promise.all([
      loadImage(catImage("Capy")),
      ...playable.map((c) => loadImage(catImage(c.id))),
    ]);
    this.capyImg = capy;
    this.catImgs = rest.map((img, i) => ({ img, pitch: playable[i]!.pitch }));
    this.resize();
    this.drawIdle();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.capyW = Math.min(150, this.width * 0.3);
    if (this.capyImg) this.capyH = this.capyW * (this.capyImg.height / this.capyImg.width);
    if (!this.running) {
      this.capyX = this.targetX = this.width / 2;
      this.drawIdle();
    }
  }

  start(): void {
    this.stack = [];
    this.falling = [];
    this.debris = [];
    this.sparks = [];
    this.camY = 0;
    this.spawnTimer = 0.6;
    this.elapsed = 0;
    this.lives = MAX_LIVES;
    this.score = 0;
    this.capyX = this.targetX = this.width / 2;
    this.events.onScore(0);
    this.events.onLives(this.lives);
    this.running = true;
    this.paused = false;
    this.loop();
  }

  setPaused(paused: boolean): void {
    if (!this.running || paused === this.paused) return;
    this.paused = paused;
    if (!paused) this.loop();
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Point Capy at a screen x position (from mouse or finger). */
  pointTo(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.targetX = Math.max(this.capyW / 2, Math.min(this.width - this.capyW / 2, clientX - rect.left));
  }

  setKeyDirection(dir: number): void {
    this.keyDir = dir;
  }

  get isRunning(): boolean {
    return this.running;
  }

  // ---------------------------------------------------------------------------

  private loop = (): void => {
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    const frame = (now: number) => {
      if (!this.running || this.paused) return;
      const dt = Math.min((now - this.last) / 1000, 1 / 30);
      this.last = now;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  };

  private get groundY(): number {
    return this.height - 18;
  }

  private catSize(img: HTMLImageElement): { w: number; h: number } {
    const w = this.capyW * 0.72;
    return { w, h: w * (img.height / img.width) };
  }

  /** World-space y of the surface the next cat lands on. */
  private surfaceY(): number {
    let y = this.groundY - this.capyH * 0.78;
    for (const s of this.stack) y -= s.h * 0.78;
    return y;
  }

  private topX(): number {
    const top = this.stack[this.stack.length - 1];
    return top ? top.x : this.capyX;
  }

  private topHalfWidth(): number {
    const top = this.stack[this.stack.length - 1];
    return (top ? top.w : this.capyW * 0.8) / 2;
  }

  private update(dt: number): void {
    this.elapsed += dt;
    const level = this.score;

    // Capy movement
    if (this.keyDir !== 0) {
      this.targetX = Math.max(this.capyW / 2, Math.min(this.width - this.capyW / 2, this.targetX + this.keyDir * 520 * dt));
    }
    this.capyX += (this.targetX - this.capyX) * Math.min(1, dt * 12);

    // Stack springs toward its rest positions, lagging more the higher it goes
    let belowX = this.capyX;
    this.stack.forEach((s, i) => {
      const target = belowX + s.offset;
      const stiffness = 16 / (1 + i * 0.12);
      s.x += (target - s.x) * Math.min(1, dt * stiffness);
      s.rot = Math.max(-0.5, Math.min(0.5, (s.x - target) * 0.012 + s.offset * 0.004));
      belowX = s.x;
    });

    // Camera follows the tower top
    const desired = Math.max(0, this.height * 0.42 - this.surfaceY());
    this.camY += (desired - this.camY) * Math.min(1, dt * 3);

    // Spawning
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn(level);
      this.spawnTimer = Math.max(0.55, 1.25 - level * 0.035) * (0.8 + Math.random() * 0.4);
    }

    // Falling things
    const surface = this.surfaceY();
    const topX = this.topX();
    const half = this.topHalfWidth();
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const f = this.falling[i]!;
      const prevBottom = f.y + f.h / 2;
      f.y += f.vy * dt;
      f.phase += dt;
      f.rot += f.vr * dt;
      if (f.kind === "bird") f.x += Math.sin(f.phase * 3) * 60 * dt;
      const bottom = f.y + f.h / 2;

      if (prevBottom <= surface && bottom >= surface && Math.abs(f.x - topX) < half + f.w * 0.3) {
        this.falling.splice(i, 1);
        this.hit(f, topX, half, surface);
        continue;
      }
      // Touching the grass (or falling off the bottom of the screen) counts as a miss
      if (bottom > Math.min(this.groundY, this.height - this.camY)) {
        this.falling.splice(i, 1);
        if (f.kind === "cat") this.miss(f);
      }
    }

    // Debris & sparks
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i]!;
      d.vy += GRAVITY * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rot += d.vr * dt;
      d.life -= dt;
      if (d.life <= 0) this.debris.splice(i, 1);
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.vy += 600 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }

    this.shake = Math.max(0, this.shake - dt * 30);
  }

  private spawn(level: number): void {
    const roll = Math.random();
    const birdChance = level < 3 ? 0 : Math.min(0.28, 0.08 + level * 0.01);
    const fishChance = this.lives < MAX_LIVES ? 0.06 : 0;
    const speed = Math.min(380, 150 + level * 9) * (0.9 + Math.random() * 0.2);
    const margin = this.capyW * 0.4;
    const x = margin + Math.random() * (this.width - margin * 2);
    const y = -this.camY - 60;

    if (roll < birdChance) {
      this.falling.push({ kind: "bird", pitch: 1, x, y, w: 48, h: 48, vy: speed * 0.9, phase: 0, rot: 0, vr: 0 });
    } else if (roll < birdChance + fishChance) {
      this.falling.push({ kind: "fish", pitch: 1, x, y, w: 40, h: 40, vy: speed * 0.8, phase: 0, rot: 0, vr: 2 });
    } else {
      const pick = this.catImgs[Math.floor(Math.random() * this.catImgs.length)]!;
      const { w, h } = this.catSize(pick.img);
      this.falling.push({ kind: "cat", img: pick.img, pitch: pick.pitch, x, y, w, h, vy: speed, phase: 0, rot: (Math.random() - 0.5) * 0.4, vr: (Math.random() - 0.5) * 2 });
    }
  }

  private hit(f: Falling, topX: number, half: number, surface: number): void {
    if (f.kind === "cat" && f.img) {
      // Keep the total lean within reach so the tower never drifts off-screen
      const maxLean = this.capyW * 0.9;
      const lean = Math.max(-maxLean, Math.min(maxLean, topX - this.capyX + f.x - topX));
      const offset = Math.max(-half * 0.8, Math.min(half * 0.8, lean - (topX - this.capyX)));
      this.stack.push({ img: f.img, w: f.w, h: f.h, x: f.x, offset, rot: 0 });
      this.score = this.stack.length;
      this.events.onScore(this.score);
      this.burst(f.x, surface, 10);
      pop(1 + Math.min(this.score, 20) * 0.04);
      if (this.score % 5 === 0) meow(f.pitch);
    } else if (f.kind === "fish") {
      this.lives = Math.min(MAX_LIVES, this.lives + 1);
      this.events.onLives(this.lives);
      this.burst(f.x, surface, 16);
      pop(1.6);
    } else {
      // Bird knocks the top two cats off the tower
      const knocked = this.stack.splice(Math.max(0, this.stack.length - 2));
      let y = surface;
      for (const s of knocked.reverse()) {
        this.debris.push({ img: s.img, x: s.x, y, w: s.w, h: s.h, vx: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 160), vy: -420, rot: s.rot, vr: (Math.random() - 0.5) * 10, life: 2 });
        y += s.h * 0.78;
      }
      this.debris.push({ glyph: "🐦", x: f.x, y: f.y, w: f.w, h: f.h, vx: 260, vy: -500, rot: 0, vr: 6, life: 1.5 });
      this.score = this.stack.length;
      this.events.onScore(this.score);
      this.shake = 10;
      bonk();
    }
  }

  private miss(f: Falling): void {
    this.lives -= 1;
    this.events.onLives(this.lives);
    this.shake = 8;
    this.burst(f.x, this.groundY, 6);
    bonk();
    if (this.lives <= 0) this.gameOver();
  }

  private gameOver(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    // Topple the whole tower for drama, then draw a final frame
    for (const s of this.stack) {
      this.debris.push({ img: s.img, x: s.x, y: 0, w: s.w, h: s.h, vx: (Math.random() - 0.5) * 500, vy: -300, rot: s.rot, vr: (Math.random() - 0.5) * 8, life: 2 });
    }
    this.draw();
    this.events.onGameOver(this.score);
  }

  private burst(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 80 + Math.random() * 180;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.5 + Math.random() * 0.3, color: SPARK_COLORS[i % SPARK_COLORS.length]! });
    }
  }

  // ---------------------------------------------------------------------------

  private drawImage(img: HTMLImageElement, x: number, y: number, w: number, h: number, rot: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  private drawGlyph(glyph: string, x: number, y: number, size: number, rot: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.font = `${size}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, 0, 0);
    ctx.restore();
  }

  private drawIdle(): void {
    if (!this.capyImg || this.width === 0) return;
    this.capyX = this.width / 2;
    this.draw();
  }

  private draw(): void {
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save();
    ctx.translate(sx, this.camY);

    // Ground
    ctx.fillStyle = "#5fb94a";
    ctx.fillRect(-20, this.groundY, this.width + 40, this.height + 400);
    ctx.fillStyle = "#4a9a39";
    ctx.fillRect(-20, this.groundY, this.width + 40, 5);

    // Capy and the tower
    if (this.capyImg) {
      const capyCY = this.groundY - this.capyH / 2 + 4;
      const flip = this.targetX < this.capyX - 2;
      ctx.save();
      ctx.translate(this.capyX, capyCY);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(this.capyImg, -this.capyW / 2, -this.capyH / 2, this.capyW, this.capyH);
      ctx.restore();

      let base = this.groundY - this.capyH * 0.78;
      for (const s of this.stack) {
        this.drawImage(s.img, s.x, base - s.h / 2, s.w, s.h, s.rot);
        base -= s.h * 0.78;
      }
    }

    // Falling things
    for (const f of this.falling) {
      if (f.kind === "cat" && f.img) this.drawImage(f.img, f.x, f.y, f.w, f.h, f.rot);
      else if (f.kind === "bird") this.drawGlyph("🐦", f.x, f.y, f.w, Math.sin(f.phase * 6) * 0.25);
      else this.drawGlyph("🐟", f.x, f.y, f.w, f.rot);
    }

    for (const d of this.debris) {
      ctx.globalAlpha = Math.min(1, d.life);
      if (d.img) this.drawImage(d.img, d.x, d.y, d.w, d.h, d.rot);
      else if (d.glyph) this.drawGlyph(d.glyph, d.x, d.y, d.w, d.rot);
    }
    ctx.globalAlpha = 1;

    for (const s of this.sparks) {
      ctx.globalAlpha = Math.max(0, s.life * 2);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
