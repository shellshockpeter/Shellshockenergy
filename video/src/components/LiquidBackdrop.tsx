import { AbsoluteFill, useCurrentFrame } from "remotion";
import { color } from "../brand/theme";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")";

type Blob = { x: number; y: number; r: number; c: string; sx: number; sy: number; px: number; py: number };

const BLOBS: Blob[] = [
  { x: 130, y: 150, r: 300, c: "rgba(255,183,0,0.26)", sx: 80, sy: 60, px: 70, py: 95 },
  { x: 560, y: 330, r: 260, c: "rgba(255,226,153,0.12)", sx: 70, sy: 80, px: 85, py: 60 },
  { x: 180, y: 520, r: 280, c: "rgba(133,95,0,0.34)", sx: 90, sy: 50, px: 100, py: 75 },
  { x: 620, y: 60, r: 220, c: "rgba(255,255,255,0.07)", sx: 50, sy: 70, px: 65, py: 80 },
];

/**
 * Dark liquid-glass backdrop: a graphite base, slow-flowing gold and smoke light blobs warped by an SVG
 * turbulence displacement, diagonal caustic streaks, a corner specular glare, vignette and fine grain.
 * Glass panels placed on top can blur this with backdrop-filter.
 */
export const LiquidBackdrop: React.FC = () => {
  const f = useCurrentFrame();
  const freq = 0.0042 + 0.0008 * Math.sin(f / 55);
  const streak = ((f * 4) % 1500) - 500;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #101014 0%, #0A0A0D 48%, #120F08 100%)" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="liq" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={`${freq} ${freq * 1.5}`} numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={90} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: "url(#liq)" }}>
        {BLOBS.map((b, i) => {
          const x = b.x + Math.sin(f / b.px + i) * b.sx;
          const y = b.y + Math.cos(f / b.py + i * 2) * b.sy;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - b.r,
                top: y - b.r,
                width: b.r * 2,
                height: b.r * 2,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${b.c}, transparent 68%)`,
                filter: "blur(30px)",
              }}
            />
          );
        })}
      </AbsoluteFill>
      {/* caustic streaks */}
      <div
        style={{
          position: "absolute",
          left: streak,
          top: -200,
          width: 260,
          height: 1100,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.055), transparent)",
          transform: "rotate(18deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: streak * 0.6 + 260,
          top: -200,
          width: 120,
          height: 1100,
          background: "linear-gradient(90deg, transparent, rgba(255,226,153,0.05), transparent)",
          transform: "rotate(18deg)",
        }}
      />
      {/* corner specular glare + vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 18% -4%, rgba(255,255,255,0.12), transparent 52%)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, transparent 55%, ${color.bg} 120%)` }} />
      <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.05, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

/** Frosted-glass surface style (backdrop blur, soft fill, bright top edge, dark bottom edge). */
export const glass = (strength = 1): React.CSSProperties => ({
  background: `linear-gradient(135deg, rgba(255,255,255,${0.15 * strength}), rgba(255,255,255,${0.04 * strength}))`,
  backdropFilter: "blur(22px) saturate(1.5)",
  WebkitBackdropFilter: "blur(22px) saturate(1.5)",
  border: "1px solid rgba(255,255,255,0.20)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -1px 0 rgba(0,0,0,0.45), 0 14px 36px rgba(0,0,0,0.38)",
});
