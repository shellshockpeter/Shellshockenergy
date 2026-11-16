/**
 * SHELL SHOCK REEL GRAPHICS — single source of truth.
 *
 * Every time below is ABSOLUTE SECONDS FROM REEL START (the 61.5s timeline).
 * Speech-to-text timings are good to about +/-0.4s, so nudge sync with
 * AUDIO_OFFSET (shifts every cue) instead of editing beats one by one.
 *   AUDIO_OFFSET = +0.3  -> everything lands 0.3s LATER
 *   AUDIO_OFFSET = -0.3  -> everything lands 0.3s EARLIER
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Global sync nudge in seconds. Positive = later, negative = earlier. */
export const AUDIO_OFFSET = 0;

export const REEL_DURATION_SEC = 61.5;

/** Seconds -> frames, with the global offset applied. Use for CUES. */
export const cueFrame = (sec: number) => Math.round((sec + AUDIO_OFFSET) * FPS);
/** Seconds -> frames, NO offset. Use for durations / fixed positions. */
export const secToFrames = (sec: number) => Math.round(sec * FPS);

export const COLORS = {
  base: "#040806",
  neon: "#39FF14",
  text: "#F4FFF6",
  glass: "rgba(255,255,255,0.06)",
  emerald: "#04603A",
  deepEmerald: "#063B2A",
  gold: "#E8C26A",
  goldDeep: "#B8892A",
  goldLight: "#FFF1C2",
  champagne: "#F3DFA8",
} as const;

export const FONT_WEIGHTS = { headline: ["600", "800", "900"] } as const;

/** Safe zone for Reels/TikTok UI. Key content stays inside this. */
export const SAFE = { left: 60, right: 960, top: 260, bottom: 1500 } as const;

/* ------------------------------------------------------------------ */
/* COMPOSITION 1 — HookOverlay (transparent)                           */
/* ------------------------------------------------------------------ */

export const HOOK = {
  startSec: 0,
  durationSec: 8.6,
  copy: {
    big: "20",
    pandas: "PANDAS",
    code: "CODE: SHOCK20",
    percent: "%",
    off: "OFF",
    tag: "ENTIRE ORDER",
  },
  cues: {
    pulseOut: 1.9, // tiny idle pulse fades before the slam
    slam: 2.0, // giant "20" on spoken "20"
    gridStart: 2.05, // first panda pops
    pandasLabel: 2.4,
    gridHold: 3.2,
    fly: 4.2, // pandas fly into the 20
    chip: 4.2, // CODE chip drops in on "shock 20"
    percent: 5.4, // 20 -> 20%
    off: 5.9, // "20% OFF" lands
    tag: 7.0, // ENTIRE ORDER slides in
    exit: 8.0, // everything exits, clean alpha by 8.6
  },
  panda: { cols: 5, rows: 4, count: 20, popStaggerFrames: 2, flyStaggerFrames: 1 },
} as const;

/* ------------------------------------------------------------------ */
/* COMPOSITION 2 — IngredientRundown (opaque)                          */
/* ------------------------------------------------------------------ */

export const RUNDOWN = {
  /** Reel time at the rundown's frame 0. Drop the render in your editor at this time. */
  startSec: 18.6,
  endSec: 58.0,
  /** Final fade-to-base so the editor cut is clean. */
  fadeOutSec: 0.4,
} as const;

export type Item = {
  value: number;
  /** decimals to show (3.2 -> 1) */
  decimals?: number;
  unit: "MG" | "G";
  name: string;
  /** card/row enters */
  inAt: number;
  /** neon check lands (end of the spoken phrase) */
  checkAt: number;
};

export type Beat = {
  id: string;
  label: string; // small caps label
  start: number;
  end: number;
  /** optional override: when the exit starts (default: next beat start - 0.1) */
  exitAt?: number;
  items: Item[];
  tag?: { text: string; at: number };
  /** slow glow "breathe" from this time (long beats) */
  breatheFrom?: number;
  finale?: boolean;
};

export const BEATS: Beat[] = [
  {
    id: "stim",
    label: "ENERGY ENGINE",
    start: 19.0,
    end: 25.8,
    items: [
      { value: 330, unit: "MG", name: "CAFFEINE", inAt: 19.0, checkAt: 22.0 },
      { value: 40, unit: "MG", name: "SYNEPHRINE", inAt: 22.3, checkAt: 25.2 },
    ],
    tag: { text: "HIGH STIMULANT", at: 21.2 },
  },
  {
    id: "nootropics",
    label: "NOOTROPIC STACK",
    start: 25.8,
    end: 28.0,
    items: [{ value: 1800, unit: "MG", name: "TOTAL NOOTROPICS", inAt: 25.8, checkAt: 27.4 }],
  },
  {
    id: "focus",
    label: "COGNITIVE STACK",
    start: 28.0,
    end: 35.5,
    items: [
      { value: 600, unit: "MG", name: "ALPHA GPC", inAt: 28.0, checkAt: 31.3 }, // checkAt inferred
      { value: 600, unit: "MG", name: "ORGANIC LION'S MANE", inAt: 32.0, checkAt: 34.8 },
    ],
    tag: { text: "FOCUS", at: 31.0 },
  },
  {
    id: "cordyceps",
    label: "PERFORMANCE",
    start: 35.5,
    end: 39.0,
    items: [{ value: 600, unit: "MG", name: "ORGANIC CORDYCEPS", inAt: 35.5, checkAt: 38.3 }],
    tag: { text: "VO2 MAX OPTIMIZATION", at: 37.5 },
  },
  {
    id: "citrulline",
    label: "PUMP MATRIX",
    start: 39.0,
    end: 42.0,
    items: [{ value: 7, unit: "G", name: "L-CITRULLINE", inAt: 39.0, checkAt: 41.4 }],
    tag: { text: "PUMP", at: 41.0 },
  },
  {
    id: "beta",
    label: "ENDURANCE",
    start: 42.0,
    end: 50.0,
    exitAt: 50.4, // hold through the tingles aside, hand off into the finale
    items: [
      {
        value: 3.2,
        decimals: 1,
        unit: "G",
        name: "STANDARD BETA-ALANINE DOSE",
        inAt: 42.0,
        checkAt: 49.2,
      },
    ],
    tag: { text: "MUSCLE ENDURANCE", at: 48.0 },
    breatheFrom: 44.5,
  },
  {
    id: "tongkat",
    label: "THE FINISHER",
    start: 51.0,
    end: 58.0,
    items: [{ value: 300, unit: "MG", name: "TONGKAT ALI", inAt: 51.0, checkAt: 55.0 }], // checkAt inferred
    tag: { text: "VITALITY ENHANCEMENT", at: 53.0 },
    finale: true,
  },
];

/** When the background starts shifting from neon-green to gold. */
export const GOLD_SHIFT = { from: 50.2, to: 52.6 } as const;
