import type { CSSProperties } from "react";
import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../brand/theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 progress between start and start+dur (absolute frames). */
export const prog = (
  f: number,
  start: number,
  dur: number,
  easing: (t: number) => number = Easing.out(Easing.cubic),
): number => interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing });

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** blurIn: opacity 0→1, blur 10px→0, small rise and scale. ~7f. */
export const blurIn = (f: number, start: number, dur = 7): CSSProperties => {
  const p = prog(f, start, dur);
  return {
    opacity: p,
    filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
    transform: `translateY(${(1 - p) * 12}px) scale(${0.92 + 0.08 * p})`,
  };
};

/** popIn: spring with ~3% overshoot. */
export const popIn = (f: number, start: number): number =>
  spring({
    frame: f - start,
    fps: FPS,
    config: { damping: 12, stiffness: 200, mass: 0.6 },
  });

/** wipe: left→right clip reveal. Returns a clip-path. */
export const wipe = (f: number, start: number, dur: number): CSSProperties => {
  const p = prog(f, start, dur, (t) => t);
  return { clipPath: `inset(-20% ${(1 - p) * 100}% -20% 0)` };
};

export const easeInOut = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);
