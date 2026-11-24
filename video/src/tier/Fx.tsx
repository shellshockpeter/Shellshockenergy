import React from "react";
import { random } from "remotion";
import { FX, Ingredient, W, H } from "./data";
import { clamp, easeOut } from "./geometry";
import { GOLD } from "./icons";

type Props = {
  ing: Ingredient;
  age: number; // frames since slam
  cx: number;
  cy: number;
  u: number; // size unit (1 at full-screen chart)
  intensity?: number;
};

/** Burst + shockwave ring — sits BEHIND the card. */
export const SlamGlow: React.FC<Props> = ({ age, cx, cy, u, intensity = 1 }) => {
  if (age < 0) return null;
  const R = 280 * u;
  const burst = age < FX.burst ? 1 - age / FX.burst : 0;
  const ringP = age < FX.ring ? easeOut(age / FX.ring) : -1;
  return (
    <>
      {burst > 0 && (
        <div
          style={{
            position: "absolute",
            left: cx - R,
            top: cy - R,
            width: R * 2,
            height: R * 2,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,236,160,1) 0%, rgba(255,201,74,0.85) 22%, rgba(255,160,40,0.35) 55%, rgba(255,160,40,0) 72%)",
            mixBlendMode: "screen",
            opacity: burst * intensity,
            transform: `scale(${0.55 + 0.55 * easeOut(age / FX.burst)})`,
          }}
        />
      )}
      {ringP >= 0 && (
        <div
          style={{
            position: "absolute",
            left: cx - 340 * u * ringP,
            top: cy - 340 * u * ringP,
            width: 680 * u * ringP,
            height: 680 * u * ringP,
            borderRadius: "50%",
            border: `3px solid ${GOLD}`,
            boxShadow: `0 0 ${14 * u}px ${GOLD}`,
            opacity: (1 - age / FX.ring) * intensity,
            mixBlendMode: "screen",
          }}
        />
      )}
    </>
  );
};

const SPARKS = 16;

/** Sparks (+ F-tier cracks) — drawn ABOVE the card. */
export const SlamSparks: React.FC<Props & { f: boolean; rowW: number; rowH: number }> = ({
  ing,
  age,
  cx,
  cy,
  u,
  intensity = 1,
  f: isF,
  rowW,
  rowH,
}) => {
  if (age < 0) return null;
  const sparks =
    age < FX.sparks
      ? Array.from({ length: SPARKS + (ing.id.length % 3) }, (_, i) => {
          const a = random(`sp-a-${ing.id}-${i}`) * Math.PI * 2;
          const v = (30 + random(`sp-v-${ing.id}-${i}`) * 42) * u;
          const grav = 1.6 * u;
          const pos = (t: number) => ({
            x: cx + Math.cos(a) * v * t,
            y: cy + Math.sin(a) * v * t + 0.5 * grav * t * t,
          });
          const head = pos(age + 0.5);
          const tail = pos(Math.max(0, age - 2.2));
          return { head, tail, o: 1 - age / FX.sparks, i };
        })
      : [];
  const crack = isF && age < 10 ? 1 - age / 10 : 0;
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen", pointerEvents: "none" }}
    >
      {sparks.map((s) => (
        <g key={s.i} opacity={s.o * intensity}>
          <line
            x1={s.tail.x}
            y1={s.tail.y}
            x2={s.head.x}
            y2={s.head.y}
            stroke="#FFD25A"
            strokeWidth={Math.max(1.5, 3.2 * u)}
            strokeLinecap="round"
          />
          <circle cx={s.head.x} cy={s.head.y} r={Math.max(1.5, 3 * u)} fill="#FFF3C0" />
        </g>
      ))}
      {crack > 0 && (
        <g opacity={crack} stroke="#FFE9E9" strokeWidth={Math.max(1.5, 3 * u)} fill="none" strokeLinejoin="miter">
          <CrackLines cx={cx} cy={cy} rowW={rowW} rowH={rowH} />
        </g>
      )}
    </svg>
  );
};

const CrackLines: React.FC<{ cx: number; cy: number; rowW: number; rowH: number }> = ({
  cx,
  cy,
  rowW,
  rowH,
}) => {
  const hw = rowW * 0.36;
  const hh = rowH / 2;
  const seg = (dx: number, dy: number, jag: number[]) => {
    const p = [`${cx},${cy}`];
    jag.forEach((j, i) => {
      const t = (i + 1) / jag.length;
      p.push(`${cx + dx * t + j * hh * 0.35},${cy + dy * t + (i % 2 ? j : -j) * hh * 0.25}`);
    });
    return <polyline points={p.join(" ")} />;
  };
  return (
    <>
      {seg(-hw, -hh * 0.9, [0.4, -0.6, 0.5, -0.3, 0.2])}
      {seg(hw, -hh * 0.7, [-0.5, 0.6, -0.4, 0.5, -0.2])}
      {seg(-hw * 0.8, hh * 0.9, [0.3, -0.5, 0.6, -0.4])}
      {seg(hw * 0.9, hh, [-0.4, 0.5, -0.6, 0.3])}
      {seg(0, -hh * 1.3, [0.5, -0.4, 0.3])}
      {seg(0, hh * 1.3, [-0.3, 0.5, -0.4])}
    </>
  );
};

/** Brief red tint over the chart for the F-tier slam. */
export const redTint = (age: number) =>
  age >= 0 && age < 12 ? 0.24 * clamp(1 - age / 12) : 0;
