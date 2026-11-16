import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./config";

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1); // fast out, soft landing
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** Soft-overshoot entrance spring. `dur` stretches the settle time (frames). */
export const enterSpring = (frame: number, delay = 0, dur = 20, damping = 13) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness: 140, mass: 0.9 }, durationInFrames: dur });

/** Clamped 0..1 ramp with easing. */
export const ramp = (frame: number, from: number, to: number, ease: (n: number) => number = easeOut) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
