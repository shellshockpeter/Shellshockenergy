// Frame data for the Shell Shock tier list overlay.
// Source of truth = the cue sheet. NEVER retime by eye: change numbers only
// if the cue sheet (or tier-timeline.json) changes.

export const FPS = 30;
export const TOTAL_FRAMES = 4451;
export const W = 1080;
export const H = 1920;

export const TIERS = ["S", "A", "B", "C", "D", "E", "F"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_COLOR: Record<Tier, string> = {
  S: "#FFD25A",
  A: "#FF9F1C",
  B: "#C6F432",
  C: "#35E0B0",
  D: "#4DA3FF",
  E: "#8B7BFF",
  F: "#FF3B4E",
};

// Rows that are visible but dimmed + empty for the whole video.
export const DIMMED_TIERS: Tier[] = ["C", "D", "E"];

export type IngId =
  | "creatine"
  | "caffeine"
  | "alphagpc"
  | "betaalanine"
  | "tyrosine"
  | "tongkat";

export type Ingredient = {
  id: IngId;
  name: string; // card title
  short: string; // chip label
  tier: Tier;
  dose?: string;
  // cue frames
  fullStart: number; // chart goes full
  cornerStart: number; // chart eases to corner
  launch: number; // card launches toward its row
  slam: number; // card lands (exact)
  deck: boolean; // sits as ON DECK chip in the header while chart is corner
  punch?: [number, number, number]; // start, peak, end (1.35x corner punch-in)
  ghost?: {
    start: number; // ghost flies from chip, hovers over B
    slideUp: number; // ghost slides up to A
    vibrateStart: number;
    vibrateEnd: number; // vibration stops, card drifts back down toward B
  };
};

export const INGREDIENTS: Ingredient[] = [
  {
    id: "creatine",
    name: "Creatine Monohydrate",
    short: "Creatine",
    tier: "F",
    fullStart: 146,
    cornerStart: 183,
    launch: 301,
    slam: 311,
    deck: true,
    punch: [302, 311, 338],
  },
  {
    id: "caffeine",
    name: "Caffeine",
    short: "Caffeine",
    tier: "S",
    fullStart: 681,
    cornerStart: 795,
    launch: 683,
    slam: 693,
    deck: false,
  },
  {
    id: "alphagpc",
    name: "Alpha GPC",
    short: "Alpha GPC",
    tier: "S",
    dose: "600mg",
    fullStart: 1489,
    cornerStart: 1530,
    launch: 1496,
    slam: 1506,
    deck: false,
  },
  {
    id: "betaalanine",
    name: "Beta-Alanine",
    short: "Beta-Alanine",
    tier: "B",
    dose: "3.2g",
    fullStart: 2108,
    cornerStart: 2179,
    launch: 2675,
    slam: 2685,
    deck: true,
    punch: [2676, 2685, 2712],
    ghost: {
      start: 2276,
      slideUp: 2337,
      vibrateStart: 2557,
      vibrateEnd: 2604,
    },
  },
  {
    id: "tyrosine",
    name: "L-Tyrosine",
    short: "L-Tyrosine",
    tier: "A",
    dose: "2,000mg",
    fullStart: 2791,
    cornerStart: 2895,
    launch: 2868,
    slam: 2878,
    deck: false,
  },
  {
    id: "tongkat",
    name: "Tongkat Ali",
    short: "Tongkat Ali",
    tier: "B",
    dose: "300mg",
    fullStart: 3428,
    cornerStart: 3517,
    launch: 3453,
    slam: 3463,
    deck: false,
  },
];

export const ING_BY_ID = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
) as Record<IngId, Ingredient>;

// Index of an ingredient within its row, by slam order (max 2 chips shown).
export const slotIndex = (ing: Ingredient): number =>
  INGREDIENTS.filter((o) => o.tier === ing.tier && o.slam < ing.slam).length;

export type ChartState = "hidden" | "hook-full" | "full" | "corner";
export type Segment = { from: number; to: number; state: ChartState };

// STATE TRACK (start inclusive, end exclusive) — verbatim from the cue sheet.
export const SEGMENTS: Segment[] = [
  { from: 0, to: 18, state: "hidden" },
  { from: 18, to: 126, state: "hook-full" },
  { from: 126, to: 146, state: "hidden" },
  { from: 146, to: 183, state: "full" },
  { from: 183, to: 681, state: "corner" },
  { from: 681, to: 795, state: "full" },
  { from: 795, to: 1489, state: "corner" },
  { from: 1489, to: 1530, state: "full" },
  { from: 1530, to: 2108, state: "corner" },
  { from: 2108, to: 2179, state: "full" },
  { from: 2179, to: 2791, state: "corner" },
  { from: 2791, to: 2895, state: "full" },
  { from: 2895, to: 3428, state: "corner" },
  { from: 3428, to: 3517, state: "full" },
  { from: 3517, to: TOTAL_FRAMES, state: "corner" },
];

// Transition lengths
export const T_HIDDEN_TO_FULL = 12;
export const T_FULL_TO_CORNER = 14; // spring damping 18, stiffness 140
export const T_CORNER_TO_FULL = 12;

// HOOK (Creatine fake-out)
export const HOOK = {
  chartIn: 18,
  reject: 108,
  glitchFrames: 6,
  chartFadeStart: 126,
  chartFadeFrames: 10,
};

// Slam FX timings
export const FX = {
  launchLead: 10,
  settle: 8,
  burst: 12,
  ring: 6,
  sparks: 10,
  shake: 4,
  rowFlare: 20,
  chipAt: 8, // card shrinks into chip at slam+8
  chipDur: 6,
  punchScale: 1.35,
};

// Corner box (fractions of 1080x1920): left 5.5%, top 10.5%, 41% x 17%
export const CORNER = {
  x: W * 0.055,
  y: H * 0.105,
  w: W * 0.41,
  h: H * 0.17,
};
// Full-state chart rect (covers the screen)
export const FULL = { x: 20, y: 24, w: W - 40, h: H - 48 };

// Debug zones (fractions)
export const FACE_ZONE = {
  x: W * 0.46,
  y: H * 0.27,
  w: W * (0.75 - 0.46),
  h: H * 0.26,
};
export const TUB_ZONE = { x: W * 0.3, y: H * 0.76, w: W * 0.4, h: H * 0.19 };
