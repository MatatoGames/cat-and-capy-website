// Tiny Web Audio synth for meows, chirps and pops. No audio files to download.

const STORAGE_KEY = "cac-muted";
const listeners = new Set<(muted: boolean) => void>();

let ctx: AudioContext | null = null;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn(muted));
}

export function onMutedChange(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function audio(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function envelope(ac: AudioContext, start: number, attack: number, hold: number, release: number, peak: number): GainNode {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + attack);
  g.gain.setValueAtTime(peak, start + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release);
  return g;
}

/** A cartoon meow: a sawtooth with a rising-then-falling pitch through a vowel-ish filter. */
export function meow(pitch = 1, voice: "meow" | "chirp" | "grunt" = "meow"): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const p = pitch * (0.92 + Math.random() * 0.16);

  const osc = ac.createOscillator();
  osc.type = voice === "grunt" ? "square" : "sawtooth";
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 3;

  if (voice === "chirp") {
    osc.frequency.setValueAtTime(700 * p, t);
    osc.frequency.exponentialRampToValueAtTime(1300 * p, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(900 * p, t + 0.14);
    filter.frequency.value = 1800 * p;
    const g = envelope(ac, t, 0.01, 0.06, 0.08, 0.18);
    osc.connect(filter).connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.2);
    return;
  }

  const dur = voice === "grunt" ? 0.35 : 0.55;
  const base = voice === "grunt" ? 110 : 520;
  osc.frequency.setValueAtTime(base * p, t);
  osc.frequency.exponentialRampToValueAtTime(base * 1.6 * p, t + dur * 0.35);
  osc.frequency.exponentialRampToValueAtTime(base * 0.9 * p, t + dur);
  filter.frequency.setValueAtTime(900 * p, t);
  filter.frequency.exponentialRampToValueAtTime(2200 * p, t + dur * 0.35);
  filter.frequency.exponentialRampToValueAtTime(700 * p, t + dur);

  const g = envelope(ac, t, 0.04, dur * 0.5, dur * 0.4, voice === "grunt" ? 0.25 : 0.2);
  osc.connect(filter).connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Short bubbly pop, for UI feedback. */
export function pop(pitch = 1): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(380 * pitch, t);
  osc.frequency.exponentialRampToValueAtTime(900 * pitch, t + 0.07);
  const g = envelope(ac, t, 0.005, 0.02, 0.08, 0.25);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

/** Low rumbling purr. */
export function purr(): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 55;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 24;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 0.5;
  const amp = ac.createGain();
  amp.gain.value = 0.5;
  lfo.connect(lfoGain).connect(amp.gain);
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 300;
  const g = envelope(ac, t, 0.08, 0.45, 0.3, 0.35);
  osc.connect(filter).connect(amp).connect(g).connect(ac.destination);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.9);
  lfo.stop(t + 0.9);
}

/** Descending "bonk" for misses. */
export function bonk(): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
  const g = envelope(ac, t, 0.005, 0.05, 0.2, 0.3);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}
