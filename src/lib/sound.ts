"use client";

/**
 * SportMatch sound kit — synthesised with the Web Audio API.
 * No audio files: zero network, instant playback, tiny bundle.
 *
 * Rules (see DESIGN_SYSTEM.md › Sound):
 * - Only on user-initiated, meaningful moments (never on hover or scroll).
 * - Short (< 600 ms), quiet (peak gain ≤ 0.18), muted with one toggle.
 * - Respects `prefers-reduced-motion` as a proxy for "calm UI" on first run.
 */
export type SoundName = "tap" | "select" | "success" | "whistle" | "notify" | "error" | "xp" | "levelup" | "cheer" | "kick";

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
  try { localStorage.setItem("sm-sound", v ? "1" : "0"); } catch {}
}
export function isSoundEnabled() {
  return enabled;
}
export function initSoundPreference() {
  try {
    const s = localStorage.getItem("sm-sound");
    if (s !== null) enabled = s === "1";
    else if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) enabled = false;
  } catch {}
  return enabled;
}

function ac() {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, { type = "sine" as OscillatorType, gain = 0.12, slideTo }: { type?: OscillatorType; gain?: number; slideTo?: number } = {}) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(c: AudioContext, start: number, dur: number, { gain = 0.08, lp = 1800, hp = 200 } = {}) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f1 = c.createBiquadFilter();
  f1.type = "lowpass";
  f1.frequency.value = lp;
  const f2 = c.createBiquadFilter();
  f2.type = "highpass";
  f2.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f1).connect(f2).connect(g).connect(c.destination);
  src.start(start);
}

export function play(name: SoundName) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime + 0.005;
  switch (name) {
    case "tap":
      tone(c, 660, t, 0.06, { type: "triangle", gain: 0.05 });
      break;
    case "select":
      tone(c, 880, t, 0.08, { type: "triangle", gain: 0.07 });
      break;
    case "kick": // ball strike: low thump + click
      tone(c, 140, t, 0.12, { type: "sine", gain: 0.18, slideTo: 60 });
      noise(c, t, 0.05, { gain: 0.06, lp: 4000, hp: 1200 });
      break;
    case "success": // bright major arpeggio
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.07, 0.22, { type: "triangle", gain: 0.09 }));
      break;
    case "whistle": { // referee whistle: trilled high tone, two blasts
      [0, 0.22].forEach((off, k) => {
        const o = c.createOscillator();
        const lfo = c.createOscillator();
        const lfoGain = c.createGain();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.value = 2900;
        lfo.frequency.value = 38;
        lfoGain.gain.value = 120;
        lfo.connect(lfoGain).connect(o.frequency);
        const d = k ? 0.32 : 0.14;
        g.gain.setValueAtTime(0.0001, t + off);
        g.gain.exponentialRampToValueAtTime(0.07, t + off + 0.015);
        g.gain.setValueAtTime(0.07, t + off + d - 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + off + d);
        o.connect(g).connect(c.destination);
        o.start(t + off); lfo.start(t + off);
        o.stop(t + off + d + 0.02); lfo.stop(t + off + d + 0.02);
      });
      break;
    }
    case "notify":
      tone(c, 988, t, 0.12, { type: "sine", gain: 0.08 });
      tone(c, 1319, t + 0.09, 0.18, { type: "sine", gain: 0.07 });
      break;
    case "error":
      tone(c, 220, t, 0.16, { type: "square", gain: 0.04 });
      tone(c, 165, t + 0.12, 0.2, { type: "square", gain: 0.04 });
      break;
    case "xp": // coin
      tone(c, 1318, t, 0.07, { type: "square", gain: 0.035 });
      tone(c, 1760, t + 0.06, 0.16, { type: "square", gain: 0.035 });
      break;
    case "levelup":
      [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(c, f, t + i * 0.075, 0.28, { type: "triangle", gain: 0.08 }));
      break;
    case "cheer": // stadium crowd swell + whistle-ish shimmer
      noise(c, t, 1.4, { gain: 0.09, lp: 2600, hp: 300 });
      noise(c, t + 0.15, 1.1, { gain: 0.05, lp: 5200, hp: 1800 });
      break;
  }
}

/** Light haptic feedback on supporting phones (no-op elsewhere). */
export function haptic(pattern: number | number[] = 12) {
  try { navigator.vibrate?.(pattern); } catch {}
}
