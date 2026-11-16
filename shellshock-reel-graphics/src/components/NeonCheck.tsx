import React from "react";
import { interpolate, random, spring, useCurrentFrame } from "remotion";
import { COLORS, FPS } from "../config";
import { easeOut, ramp } from "../ease";

const R = 44;
const CIRC = 2 * Math.PI * R;
const CHECK_LEN = 78;

/**
 * Circle draws (stroke-dashoffset) -> check path draws -> glow pulse + particle burst.
 * Scale 0.6 -> 1.08 -> 1. `start` is a LOCAL frame. variant "gold" = green->gold gradient,
 * bigger glow and an expanding ring pulse.
 */
export const NeonCheck: React.FC<{
  start: number;
  size?: number;
  variant?: "green" | "gold";
  id: string;
}> = ({ start, size = 96, variant = "green", id }) => {
  const frame = useCurrentFrame();
  const f = frame - start;
  const gold = variant === "gold";

  if (f < 0) {
    // keep an empty ghost ring so the slot reads as "pending"
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", opacity: 0.35 }}>
        <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={2.5} strokeDasharray="3 7" strokeLinecap="round" />
      </svg>
    );
  }

  const ringDraw = ramp(f, 0, 10);
  const checkDraw = ramp(f, 8, 17);
  const fill = ramp(f, 6, 18);
  const pop = spring({ frame: f, fps: FPS, config: { damping: 9, stiffness: 190, mass: 0.55 } });
  const scale = interpolate(pop, [0, 1], [0.6, 1]); // spring overshoot lands ~1.08 then settles 1

  const glowT = f - 16;
  const glowPulse =
    glowT < 0 ? 0 : interpolate(glowT, [0, 6, 22], [0, 1, 0.45], { extrapolateRight: "clamp", easing: easeOut });
  const glowPx = (gold ? 30 : 24) * glowPulse + (gold ? 10 : 6);
  const stroke = gold ? `url(#grad-${id})` : COLORS.neon;
  const glowColor = gold ? COLORS.gold : COLORS.neon;

  const particles = Array.from({ length: gold ? 14 : 10 }, (_, i) => {
    const ang = (i / (gold ? 14 : 10)) * Math.PI * 2 + random(`${id}-a${i}`) * 0.5;
    const dist = 58 + random(`${id}-d${i}`) * 34;
    const pf = ramp(f, 15, 31);
    const r = 2 + random(`${id}-r${i}`) * 2.2;
    return (
      <circle
        key={i}
        cx={50 + Math.cos(ang) * (46 + dist * pf)}
        cy={50 + Math.sin(ang) * (46 + dist * pf)}
        r={r * (1 - pf * 0.6)}
        fill={gold && i % 2 ? COLORS.goldLight : stroke === COLORS.neon ? COLORS.neon : COLORS.gold}
        opacity={f >= 15 ? (1 - pf) * 0.95 : 0}
      />
    );
  });

  const ringPulse = ramp(f, 16, 38);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        overflow: "visible",
        transform: `scale(${scale})`,
        filter: `drop-shadow(0 0 ${glowPx}px ${glowColor})`,
      }}
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={COLORS.neon} />
          <stop offset="35%" stopColor="#C4F04A" />
          <stop offset="70%" stopColor={COLORS.gold} />
          <stop offset="100%" stopColor={COLORS.goldLight} />
        </linearGradient>
      </defs>
      <circle cx={50} cy={50} r={R} fill={gold ? "rgba(232,194,106,0.12)" : "rgba(57,255,20,0.12)"} opacity={fill} />
      <circle
        cx={50}
        cy={50}
        r={R}
        fill="none"
        stroke={stroke}
        strokeWidth={gold ? 4.5 : 4}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - ringDraw)}
        transform="rotate(-90 50 50)"
      />
      <path
        d="M31 52 L44 65 L70 37"
        fill="none"
        stroke={stroke}
        strokeWidth={gold ? 6.5 : 6}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={CHECK_LEN}
        strokeDashoffset={CHECK_LEN * (1 - checkDraw)}
      />
      {gold && f >= 16 ? (
        <circle
          cx={50}
          cy={50}
          r={R}
          fill="none"
          stroke={COLORS.goldLight}
          strokeWidth={2.5}
          opacity={(1 - ringPulse) * 0.7}
          transform={`translate(50 50) scale(${1 + ringPulse * 0.9}) translate(-50 -50)`}
        />
      ) : null}
      {particles}
    </svg>
  );
};
