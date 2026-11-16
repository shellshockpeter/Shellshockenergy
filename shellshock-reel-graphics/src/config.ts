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

/* ------------------------------------------------------------------ */
/* ADDENDUM 1 — FOOTAGE BEHIND THE RUNDOWN (frosted-glass background)  */
/* ------------------------------------------------------------------ */

/** Your source reel. Must live inside ./public so Remotion can serve it. */
export const FOOTAGE_PATH = "./public/reel.mp4";
/** Gaussian blur on the footage while the rundown is on screen. */
export const BG_BLUR_PX = 22;
/** Footage brightness (1 = untouched). Lowered from 0.55: on bright footage the small labels and gold finale text fell below the original design contrast. */
export const FOOTAGE_DIM = 0.45;
/** Dark-green gradient tint over the footage (raised from 0.40 for the same reason). */
export const BG_TINT_OPACITY = 0.5;
/** Liquid blobs + warp layer, blended "screen" over the footage. */
export const BLOBS_OPACITY = 0.35;
/** Overlay (alpha) version: opacity of the whole background group. */
export const OVERLAY_BG_OPACITY = 0.4;
/** Blur / dim / background fade-in at 18.6s and fade-out at 58.0s. */
export const BG_TRANSITION_FRAMES = 12;

/** File name inside ./public, derived from FOOTAGE_PATH. */
export const FOOTAGE_FILE = FOOTAGE_PATH.replace(/^\.?\/?public\//, "");

/* ------------------------------------------------------------------ */
/* ADDENDUM 2 — SOUND DESIGN                                           */
/* ------------------------------------------------------------------ */

/** Generated by `npm run sfx` (scripts/make_sfx.py) from the cues below. */
export const SFX_STEM_FILE = "sfx_stem.wav";

/** Sounds fire this many frames BEFORE the visual hit so ear and eye land together. */
export const SFX_LEAD_FRAMES = { small: 2, big: 3 } as const;

export type SfxCue = {
  /** human-readable cue name */
  name: string;
  /** wav in ./sfx */
  file: string;
  /** reel seconds of the VISUAL hit (before AUDIO_OFFSET and lead) */
  at: number;
  /** frames the sound leads the visual */
  leadFrames: number;
  /** mix trim in dB on top of the file's own peak level */
  gainDb?: number;
};

const COUNT_FRAMES = { delay: 3, duration: 12, every: 2 } as const; // matches the count-up in IngredientRundown
const f = (frames: number) => frames / FPS;

const buildSfx = (): SfxCue[] => {
  const c = HOOK.cues;
  const out: SfxCue[] = [];
  const S = SFX_LEAD_FRAMES;

  /* ---- hook ---- */
  out.push({ name: "20 slam", file: "slam.wav", at: c.slam, leadFrames: S.big });
  for (let i = 0; i < HOOK.panda.count; i++) {
    out.push({
      name: `panda pop ${String(i + 1).padStart(2, "0")}`,
      file: "pop.wav",
      at: c.gridStart + f(i * HOOK.panda.popStaggerFrames),
      leadFrames: S.small,
    });
  }
  out.push({ name: "pandas fly into 20", file: "whoosh.wav", at: c.fly, leadFrames: S.small });
  out.push({ name: "SHOCK20 chip lands", file: "chip.wav", at: c.chip + 0.27, leadFrames: S.big });
  out.push({ name: "OFF slam", file: "slam.wav", at: c.off, leadFrames: S.big, gainDb: -4 });
  out.push({ name: "ENTIRE ORDER tag", file: "tag.wav", at: c.tag, leadFrames: S.small });
  out.push({ name: "hook exit", file: "whoosh.wav", at: c.exit, leadFrames: S.small, gainDb: -8 });

  /* ---- rundown ---- */
  BEATS.forEach((b, bi) => {
    out.push({ name: `card ${bi + 1} in (${b.id})`, file: "whoosh.wav", at: b.start, leadFrames: S.big });
    if (b.finale) {
      out.push({ name: "GOLD finale", file: "gold.wav", at: b.start, leadFrames: S.big });
    }
    b.items.forEach((it, ii) => {
      if (ii > 0) {
        out.push({ name: `row ${bi + 1}.${ii + 1} in (${it.name})`, file: "whoosh.wav", at: it.inAt, leadFrames: S.small, gainDb: -9 });
      }
      const nTicks = Math.floor(COUNT_FRAMES.duration / COUNT_FRAMES.every);
      for (let k = 0; k < nTicks; k++) {
        out.push({
          name: `count tick ${bi + 1}.${ii + 1}.${k + 1}`,
          file: "tick.wav",
          at: it.inAt + f(COUNT_FRAMES.delay + k * COUNT_FRAMES.every),
          leadFrames: S.small,
        });
      }
      out.push({ name: `check ${bi + 1}.${ii + 1} (${it.name})`, file: `check_${bi + 1}.wav`, at: it.checkAt, leadFrames: S.small });
    });
    if (b.tag) out.push({ name: `tag ${b.tag.text}`, file: "tag.wav", at: b.tag.at, leadFrames: S.small });
  });
  return out.sort((a, b) => a.at - b.at);
};

export const SFX: SfxCue[] = buildSfx();

/** Final trigger times in reel seconds: visual hit + AUDIO_OFFSET - lead. */
export const sfxTimeline = () =>
  SFX.map((s) => ({
    name: s.name,
    file: s.file,
    gainDb: s.gainDb ?? 0,
    time: Math.round((s.at + AUDIO_OFFSET - s.leadFrames / FPS) * 1000) / 1000,
  }));

/** Quiet warm pad under the rundown. Tied to the clip position, so AUDIO_OFFSET does not move it. */
export const AMBIENT = { file: "ambient.wav", from: RUNDOWN.startSec, to: RUNDOWN.endSec, fadeSec: 2 } as const;
