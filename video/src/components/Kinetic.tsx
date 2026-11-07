import { spring, useCurrentFrame } from "remotion";
import { FPS, color, font } from "../brand/theme";
import { Accent } from "./Text";
import { lerp, prog } from "../lib/anim";
import { parseMarkup } from "./Caption";

/** Deterministic pseudo-random in [0,1) (Remotion renders must be pure). */
export const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&?";

/** Decode effect: characters scramble, then resolve left to right. */
export const scramble = (text: string, f: number, start: number, perChar = 0.9): string =>
  text
    .split("")
    .map((ch, j) => {
      if (ch === " ") return ch;
      const done = start + 2 + j * perChar;
      if (f >= done) return ch;
      return POOL[Math.floor(hash(j * 31 + Math.floor(f / 2) * 7) * POOL.length)];
    })
    .join("");

export type Word = { text: string; accent?: boolean };

/** "Is Killing Your *Gains*" → words, accent flag per word. */
export const toWords = (text: string): Word[] =>
  parseMarkup(text).flatMap((part) =>
    part.text
      .split(" ")
      .filter(Boolean)
      .map((w) => ({ text: w, accent: part.accent })),
  );

type LineProps = {
  words: Word[];
  y: number;
  start: number;
  stagger?: number;
  size: number;
  /** Frame the gold underline starts sweeping (omit for none). */
  underlineAt?: number;
};

/** Kinetic title line: each word slams in (scale, drop, blur, skew) on a spring. Accent word gets a glow burst. */
export const KineticLine: React.FC<LineProps> = ({ words, y, start, stagger = 3, size, underlineAt }) => {
  const f = useCurrentFrame();
  const ul = underlineAt === undefined ? 0 : prog(f, underlineAt, 9);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 720,
        top: y,
        transform: "translateY(-50%)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "relative", display: "flex", gap: size * 0.26 }}>
        {words.map((w, i) => {
          const s0 = start + i * stagger;
          const s = spring({ frame: f - s0, fps: FPS, config: { damping: 11, stiffness: 230, mass: 0.5 } });
          const c = Math.min(1, Math.max(0, s));
          const burst = w.accent ? 22 * (1 - prog(f, s0 + 4, 12)) : 0;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: font.sans,
                fontWeight: 600,
                fontSize: size,
                lineHeight: 1,
                color: color.text,
                opacity: Math.min(1, s * 3),
                transform: `translateY(${lerp(-30, 0, s)}px) scale(${lerp(1.9, 1, s)}) skewX(${(1 - c) * -12}deg)`,
                filter: `blur(${(1 - c) * 10}px)${burst > 0.5 ? ` drop-shadow(0 0 ${burst}px rgba(255,183,0,0.9))` : ""}`,
              }}
            >
              {w.accent ? <Accent size="1em">{w.text}</Accent> : w.text}
            </span>
          );
        })}
        {underlineAt !== undefined && (
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: -6,
              height: 3,
              width: `${ul * 100}%`,
              background: color.accent,
              boxShadow: `0 0 12px ${color.glow}`,
            }}
          />
        )}
      </div>
    </div>
  );
};
