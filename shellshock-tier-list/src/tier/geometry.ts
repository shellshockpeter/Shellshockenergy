import { Easing, spring } from "remotion";
import {
  CORNER,
  FPS,
  FULL,
  FX,
  HOOK,
  INGREDIENTS,
  Ingredient,
  SEGMENTS,
  TIERS,
  T_CORNER_TO_FULL,
  T_FULL_TO_CORNER,
  T_HIDDEN_TO_FULL,
  W,
  slotIndex,
} from "./data";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeIn = (t: number) => Math.pow(clamp(t), 2.2);
export const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
export const prog = (f: number, from: number, dur: number) =>
  clamp((f - from) / dur);

// ───────────────────────── chart presence ─────────────────────────
export type Presence = {
  vis: number; // overall opacity of the chart
  pop: number; // pop-in scale (about center)
  morph: number; // 0 = full-screen layout, 1 = corner layout (spring may overshoot)
  scrim: number; // 0..1 dim/blur layer behind the chart
  headerChip: boolean;
};

const segIndex = (f: number) => {
  for (let i = 0; i < SEGMENTS.length; i++) {
    if (f >= SEGMENTS[i].from && f < SEGMENTS[i].to) return i;
  }
  return SEGMENTS.length - 1;
};

export const presenceAt = (f: number): Presence => {
  const i = segIndex(f);
  const seg = SEGMENTS[i];
  const prev = SEGMENTS[i - 1];
  const base: Presence = {
    vis: 1,
    pop: 1,
    morph: 0,
    scrim: 0,
    headerChip: false,
  };
  switch (seg.state) {
    case "hidden": {
      // chart fades out (10 frames) after the hook, then empty until f146
      const p = prog(f, HOOK.chartFadeStart, HOOK.chartFadeFrames);
      if (f >= HOOK.chartFadeStart && f < HOOK.chartFadeStart + HOOK.chartFadeFrames) {
        return { ...base, vis: 1 - easeInOut(p), pop: lerp(1, 0.97, p) };
      }
      return { ...base, vis: 0 };
    }
    case "hook-full": {
      const p = easeOut(prog(f, seg.from, T_HIDDEN_TO_FULL));
      return { ...base, vis: p, pop: lerp(0.9, 1, p), scrim: 0 };
    }
    case "full": {
      if (!prev || prev.state === "hidden") {
        const p = easeOut(prog(f, seg.from, T_HIDDEN_TO_FULL));
        return { ...base, vis: p, pop: lerp(0.9, 1, p), scrim: p };
      }
      const m = easeInOut(prog(f, seg.from, T_CORNER_TO_FULL));
      return { ...base, morph: 1 - m, scrim: m };
    }
    case "corner": {
      const m = spring({
        frame: f - seg.from,
        fps: FPS,
        config: { damping: 18, stiffness: 140 },
        durationInFrames: T_FULL_TO_CORNER,
      });
      return {
        ...base,
        morph: m,
        scrim: clamp(1 - m),
        headerChip: true,
      };
    }
  }
};

// ───────────────────────── punch-in + shake ─────────────────────────
export const punchAt = (f: number): number => {
  let p = 1;
  for (const ing of INGREDIENTS) {
    if (!ing.punch) continue;
    const [s, k, e] = ing.punch;
    if (f >= s && f <= e) {
      const v =
        f <= k
          ? lerp(1, FX.punchScale, easeOut(prog(f, s, k - s)))
          : lerp(FX.punchScale, 1, easeInOut(prog(f, k, e - k)));
      p = Math.max(p, v);
    }
  }
  return p;
};

export const shakeAt = (f: number) => {
  let dx = 0;
  let dy = 0;
  for (const ing of INGREDIENTS) {
    const age = f - ing.slam;
    if (age >= 0 && age < FX.shake) {
      const amp = 6 * (1 - age / FX.shake);
      dx += amp * Math.cos(age * 2.7 + 0.6);
      dy += amp * Math.sin(age * 3.9 + 0.2);
    }
  }
  return { dx, dy };
};

// ───────────────────────── layout ─────────────────────────
export type Rect = { x: number; y: number; w: number; h: number };

export type Geo = {
  p: Presence;
  rect: Rect;
  z: number; // layout multiplier (punch * pop)
  u: number; // size unit relative to the full chart width
  t: number; // clamped morph
  pad: number;
  headerH: number;
  gap: number;
  rowH: number;
  s: number; // rowH / 228 — scale for row details
  rowsTop: number;
  rowX: number;
  rowW: number;
  tileW: number;
  areaX: number;
  areaW: number;
  radius: number;
  punch: number;
  cardScale: number;
  pill: { cx: number; cy: number; w: number; h: number };
};

export const CARD_W = 560;
export const CARD_H = 210;
export const CENTER_BOTTOM = { x: W / 2, y: 1340 };

export const geoAt = (f: number): Geo => {
  const p = presenceAt(f);
  const punch = punchAt(f);
  const sh = shakeAt(f);
  const t = clamp(p.morph, 0, 1);
  const z = punch * p.pop;
  const bw = lerp(FULL.w, CORNER.w, p.morph);
  const bh = lerp(FULL.h, CORNER.h, p.morph);
  const bx = lerp(FULL.x, CORNER.x, p.morph);
  const by = lerp(FULL.y, CORNER.y, p.morph);
  // pop scales about the center, punch scales about top-left
  let rect: Rect;
  if (p.pop !== 1) {
    rect = {
      x: bx + (bw * (1 - p.pop)) / 2,
      y: by + (bh * (1 - p.pop)) / 2,
      w: bw * p.pop,
      h: bh * p.pop,
    };
  } else {
    rect = { x: bx, y: by, w: bw * punch, h: bh * punch };
  }
  rect = { ...rect, x: rect.x + sh.dx, y: rect.y + sh.dy };

  const pad = lerp(30, 8, p.morph) * z;
  const headerH = lerp(150, 46, p.morph) * z;
  const gap = lerp(16, 3, p.morph) * z;
  const rowsTop = rect.y + pad + headerH;
  const rowsH = rect.h - 2 * pad - headerH;
  const rowH = (rowsH - 6 * gap) / 7;
  const s = rowH / 228;
  const rowX = rect.x + pad;
  const rowW = rect.w - 2 * pad;
  const tileW = rowH * 0.92;
  const areaX = rowX + tileW + 14 * s;
  const areaW = rowW - tileW - 14 * s - 14 * s;
  const pillW = lerp(300, 172, p.morph) * z;
  const pillH = lerp(76, 33, p.morph) * z;
  return {
    p,
    rect,
    z,
    u: rect.w / FULL.w,
    t,
    pad,
    headerH,
    gap,
    rowH,
    s,
    rowsTop,
    rowX,
    rowW,
    tileW,
    areaX,
    areaW,
    radius: 28 * s,
    punch,
    cardScale: (rect.w / (W - 40)) * (1 - 0.38 * t),
    pill: {
      cx: rect.x + rect.w - pad - pillW / 2 - 4 * z,
      cy: rect.y + pad + headerH / 2,
      w: pillW,
      h: pillH,
    },
  };
};

export const tierIndex = (tier: string) => TIERS.indexOf(tier as never);
/** Row center Y; fractional row index allowed (A→B in between etc). */
export const rowCenterY = (g: Geo, r: number) =>
  g.rowsTop + r * (g.rowH + g.gap) + g.rowH / 2;
export const rowAreaCenterX = (g: Geo) => g.areaX + g.areaW / 2;
export const slotCenterX = (g: Geo, slot: number) =>
  g.areaX + (g.areaW * (slot + 0.5)) / 2;
export const slotW = (g: Geo) => g.areaW / 2;

// ───────────────────────── card paths ─────────────────────────
export type CardState = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  aura: number; // 0..1 strength
  ghost: boolean; // unlocked / translucent
  vib: { x: number; y: number };
  mode: "hold" | "deck-travel" | "ghost" | "flight" | "impact" | "shrink";
  age: number; // frames since slam (negative before)
};

export const targetOf = (g: Geo, ing: Ingredient) => ({
  x: rowAreaCenterX(g),
  y: rowCenterY(g, tierIndex(ing.tier)),
});

const chipCenter = (g: Geo) => ({ x: g.pill.cx, y: g.pill.cy });

// Ghost hover path for Beta-Alanine (row-space so it tracks the chart)
const GHOST_B = 2; // B row
const GHOST_A = 1; // A row
const DRIFT_END = 1.5; // drifts back "toward B" before launch

const ghostRow = (ing: Ingredient, f: number): number => {
  const gh = ing.ghost!;
  if (f < gh.slideUp) return GHOST_B;
  if (f < gh.vibrateEnd) {
    return lerp(GHOST_B, GHOST_A, easeOut(prog(f, gh.slideUp, 14)));
  }
  return lerp(GHOST_A, DRIFT_END, easeInOut(prog(f, gh.vibrateEnd, ing.launch - gh.vibrateEnd)));
};

export const cardStateAt = (
  ing: Ingredient,
  f: number,
  g: Geo,
): CardState | null => {
  const skipHold = !ing.deck && ing.launch - ing.fullStart < 8;
  const appear = skipHold ? ing.launch : ing.fullStart;
  const end = ing.slam + FX.chipAt + FX.chipDur;
  if (f < appear || f >= end) return null;

  const tgt = targetOf(g, ing);
  const base = g.cardScale;
  const age = f - ing.slam;
  const none = { x: 0, y: 0 };
  const mk = (c: Partial<CardState>): CardState => ({
    x: CENTER_BOTTOM.x,
    y: CENTER_BOTTOM.y,
    scale: base,
    opacity: 1,
    aura: 1,
    ghost: false,
    vib: none,
    mode: "hold",
    age,
    ...c,
  });

  // ── slam sequence ──
  if (f >= ing.launch) {
    const fp = prog(f, ing.launch, FX.launchLead);
    if (f < ing.slam) {
      let start: { x: number; y: number };
      let s0 = base;
      if (ing.ghost) {
        start = {
          x: rowAreaCenterX(g),
          y: rowCenterY(g, ghostRow(ing, ing.launch)),
        };
        s0 = base;
      } else if (ing.deck) {
        start = chipCenter(g);
        s0 = base * 0.5;
      } else {
        start = CENTER_BOTTOM;
        s0 = skipHold ? base * 0.8 : base;
      }
      const e = easeIn(fp);
      const lockFade = ing.ghost ? clamp((f - ing.launch) / 3) : 1;
      return mk({
        x: lerp(start.x, tgt.x, e),
        y: lerp(start.y, tgt.y, e),
        scale: lerp(s0, base, e),
        opacity: ing.ghost ? lerp(0.58, 1, lockFade) : skipHold ? clamp((f - ing.launch + 1) / 2) : 1,
        ghost: ing.ghost ? lockFade < 1 : false,
        mode: "flight",
        aura: 1,
      });
    }
    if (age < FX.chipAt) {
      const sc = 1 + 0.25 * (1 - easeOut(prog(f, ing.slam, FX.settle)));
      return mk({
        x: tgt.x,
        y: tgt.y,
        scale: base * sc,
        mode: "impact",
        aura: 1,
      });
    }
    // shrink into the row chip
    const p = prog(f, ing.slam + FX.chipAt, FX.chipDur);
    const e = easeInOut(p);
    const slot = slotIndex(ing);
    return mk({
      x: lerp(tgt.x, slotCenterX(g, slot), e),
      y: tgt.y,
      scale: lerp(base, base * 0.42, e),
      opacity: 1 - smooth((p - 0.35) / 0.65),
      mode: "shrink",
      aura: 1 - p,
    });
  }

  // ── before launch ──
  if (!ing.deck) {
    const pop = easeOut(prog(f, appear, 10));
    return mk({
      x: CENTER_BOTTOM.x,
      y: CENTER_BOTTOM.y + Math.sin((f - appear) / 9) * 5 * g.u,
      scale: base * lerp(0.55, 1, pop) * (1 + 0.04 * Math.sin((f - appear) / 6)),
      opacity: pop,
      mode: "hold",
    });
  }

  // deck ingredients
  if (f < ing.cornerStart) {
    const pop = easeOut(prog(f, appear, 10));
    return mk({
      x: CENTER_BOTTOM.x,
      y: CENTER_BOTTOM.y + Math.sin((f - appear) / 9) * 5 * g.u,
      scale: base * lerp(0.55, 1, pop) * (1 + 0.04 * Math.sin((f - appear) / 6)),
      opacity: pop,
      mode: "hold",
    });
  }
  if (f < ing.cornerStart + T_FULL_TO_CORNER) {
    const m = clamp(g.p.morph);
    const c = chipCenter(g);
    return mk({
      x: lerp(CENTER_BOTTOM.x, c.x, m),
      y: lerp(CENTER_BOTTOM.y, c.y, m),
      scale: base * lerp(1, 0.5, m),
      opacity: 1 - smooth((m - 0.65) / 0.35),
      mode: "deck-travel",
    });
  }
  if (ing.ghost && f >= ing.ghost.start) {
    const gh = ing.ghost;
    const row = ghostRow(ing, f);
    const fly = easeOut(prog(f, gh.start, 14));
    const c = chipCenter(g);
    const gx = rowAreaCenterX(g);
    const gy = rowCenterY(g, row);
    let vx = 0;
    let vy = 0;
    if (f >= gh.vibrateStart && f < gh.vibrateEnd) {
      const k = f - gh.vibrateStart;
      const amp = 2.6 * g.u * 2.3;
      vx = Math.sin(k * 5.1) * amp;
      vy = Math.cos(k * 7.3) * amp * 0.6;
    }
    const hover = f < gh.slideUp ? Math.sin((f - gh.start) / 8) * 2 * g.u * 2 : 0;
    return mk({
      x: lerp(c.x, gx, fly),
      y: lerp(c.y, gy, fly) + hover,
      scale: base * lerp(0.5, 1, fly),
      opacity: 0.58 * clamp((f - gh.start + 1) / 3),
      ghost: true,
      vib: { x: vx, y: vy },
      mode: "ghost",
      aura: 0.5,
    });
  }
  return null; // sitting as the ON DECK pill
};

/** ON DECK pill visibility 0..1 (header chip) */
export const deckPillAt = (ing: Ingredient, f: number, g: Geo): number => {
  if (!ing.deck) return 0;
  const gone = ing.ghost ? ing.ghost.start : ing.launch;
  if (f >= gone || f < ing.cornerStart) return 0;
  if (f < ing.cornerStart + T_FULL_TO_CORNER) {
    return smooth((clamp(g.p.morph) - 0.65) / 0.35);
  }
  return 1;
};

// ───────────────────────── row flare ─────────────────────────
export const rowFlareAt = (tier: string, f: number): number => {
  let v = 0;
  for (const ing of INGREDIENTS) {
    if (ing.tier !== tier) continue;
    const age = f - ing.slam;
    if (age >= 0 && age < FX.rowFlare) {
      const k = age < 2 ? 0.6 + 0.4 * (age / 2) : 1 - (age - 2) / (FX.rowFlare - 2);
      v = Math.max(v, k);
    }
  }
  return v;
};

/** 0..1 chip presence for a placed ingredient. */
export const chipAt = (ing: Ingredient, f: number): number => {
  const p = prog(f, ing.slam + FX.chipAt + 2, FX.chipDur - 1);
  return p <= 0 ? 0 : easeOut(p);
};
