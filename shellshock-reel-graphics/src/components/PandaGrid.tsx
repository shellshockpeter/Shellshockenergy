import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { enterSpring, ramp } from "../ease";
import { PandaIcon } from "./PandaIcon";

/**
 * 5x4 grid (20 pandas). Pop in one by one with a bounce stagger, then shrink + fly
 * into `target` (the "20"). All coordinates are in 1080x1920 frame space.
 */
export const PandaGrid: React.FC<{
  cols: number;
  rows: number;
  size: number;
  gap: number;
  centerX: number;
  top: number;
  popStart: number; // local frames
  popStagger: number;
  flyStart: number;
  flyStagger: number;
  target: { x: number; y: number };
  onLand?: never;
}> = ({ cols, rows, size, gap, centerX, top, popStart, popStagger, flyStart, flyStagger, target }) => {
  const frame = useCurrentFrame();
  const width = cols * size + (cols - 1) * gap;
  const left = centerX - width / 2;
  const total = cols * rows;

  return (
    <>
      {Array.from({ length: total }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const cx = left + c * (size + gap) + size / 2;
        const cy = top + r * (size + gap) + size / 2;

        const pop = enterSpring(frame, popStart + i * popStagger, 16, 7);
        // bottom rows fly first so the chip landing zone clears quickly
        const flyOrder = (rows - 1 - r) * cols + c;
        const fs = flyStart + flyOrder * flyStagger;
        const fly = ramp(frame, fs, fs + 12, Easing.bezier(0.5, 0, 0.9, 0.4));
        const bob = frame > popStart + total * popStagger + 8 && fly === 0 ? Math.sin(frame * 0.12 + i * 0.7) * 2 : 0;

        const x = interpolate(fly, [0, 1], [cx, target.x]);
        const y = interpolate(fly, [0, 1], [cy + bob, target.y]);
        const s = pop * interpolate(fly, [0, 1], [1, 0.2]);
        const rot = interpolate(pop, [0, 1], [-14, 0]) + fly * 120;
        const opacity = Math.min(1, pop * 3) * (1 - ramp(fly, 0.7, 1, Easing.linear));

        if (pop <= 0.001 || opacity <= 0.001) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              transform: `scale(${s}) rotate(${rot}deg)`,
              opacity,
              filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
            }}
          >
            <PandaIcon size={size} />
          </div>
        );
      })}
    </>
  );
};
