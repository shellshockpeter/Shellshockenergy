import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { COLORS, FPS } from "../config";
import { ramp } from "../ease";

export type DotSpec = {
  /** local frame where the dot half-fills (2-item beats), optional */
  halfAt?: number;
  /** local frame where the dot fills fully */
  fillAt: number;
  /** local frame this beat becomes the active one */
  activeAt: number;
  activeUntil: number;
  gold?: boolean;
};

/** 7 tiny glass dots that fill neon green as each ingredient's check lands. */
export const ProgressDots: React.FC<{
  dots: DotSpec[];
  cx: number;
  y: number;
  appearAt: number;
  fadeOutAt: number;
}> = ({ dots, cx, y, appearAt, fadeOutAt }) => {
  const frame = useCurrentFrame();
  const d = 20;
  const gap = 24;
  const total = dots.length * d + (dots.length - 1) * gap;
  const left = cx - total / 2;
  const out = 1 - ramp(frame, fadeOutAt, fadeOutAt + 10);

  return (
    <>
      {dots.map((dot, i) => {
        const inP = ramp(frame, appearAt + i * 2, appearAt + i * 2 + 10);
        const fillP = spring({ frame: frame - dot.fillAt, fps: FPS, config: { damping: 9, stiffness: 200, mass: 0.6 } });
        const half = dot.halfAt !== undefined ? ramp(frame, dot.halfAt, dot.halfAt + 8) * 0.5 : 0;
        const fill = Math.max(half, frame >= dot.fillAt ? Math.min(1, fillP) : 0);
        const fillScale = frame >= dot.fillAt ? fillP : half;
        const active = ramp(frame, dot.activeAt, dot.activeAt + 8) * (1 - ramp(frame, dot.activeUntil, dot.activeUntil + 8));
        const color = dot.gold ? COLORS.gold : COLORS.neon;
        const glow = frame >= dot.fillAt ? interpolate(frame - dot.fillAt, [0, 6, 24], [0, 1, 0.35], { extrapolateRight: "clamp" }) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: left + i * (d + gap),
              top: y - d / 2,
              width: d,
              height: d,
              borderRadius: d,
              opacity: inP * out,
              transform: `translateY(${(1 - inP) * 10}px)`,
              background: COLORS.glass,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 0 ${10 * active}px rgba(255,255,255,${0.5 * active})`,
              border: `1.5px solid rgba(255,255,255,${0.22 + 0.4 * active})`,
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 2.5,
                borderRadius: d,
                background: dot.gold ? `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold})` : color,
                opacity: fill,
                transform: `scale(${Math.max(0, fillScale)})`,
                boxShadow: `0 0 ${14 * glow + 4}px ${color}`,
              }}
            />
          </div>
        );
      })}
    </>
  );
};
