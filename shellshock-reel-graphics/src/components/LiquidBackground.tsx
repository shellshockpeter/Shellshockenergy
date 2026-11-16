import React from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { COLORS, HEIGHT, WIDTH } from "../config";
import { useReelTime } from "../time";

type Blob = { size: number; x: number; y: number; ax: number; ay: number; w: number; p: number; neonColor: string; goldColor: string; alpha: number };

// Coordinates are in HALF-RES space (540x960); the layer is scaled 2x.
// Rendering the displacement filter at half-res is 4x cheaper and the blobs are soft anyway.
const BLOBS: Blob[] = [
  { size: 460, x: 120, y: 240, ax: 90, ay: 110, w: 0.21, p: 0.0, neonColor: "#39FF14", goldColor: "#E8C26A", alpha: 0.30 },
  { size: 520, x: 430, y: 520, ax: 110, ay: 90, w: 0.17, p: 1.7, neonColor: "#04603A", goldColor: "#06503A", alpha: 0.85 },
  { size: 480, x: 160, y: 800, ax: 100, ay: 80, w: 0.19, p: 3.1, neonColor: "#0A7A4A", goldColor: "#0A6A44", alpha: 0.65 },
  { size: 380, x: 450, y: 170, ax: 70, ay: 100, w: 0.25, p: 4.4, neonColor: "#39FF14", goldColor: "#B8892A", alpha: 0.20 },
];

/** Blobs + feTurbulence warp + champagne light. Transparent background. */
export const LiquidBlobs: React.FC<{ goldMix: number; fadeIn?: number; id?: string }> = ({ goldMix, fadeIn = 1, id = "liq" }) => {
  const t = useReelTime();
  const fx = 0.0075 + Math.sin(t * 0.21) * 0.0012;
  const fy = 0.0105 + Math.cos(t * 0.17) * 0.0014;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id={`${id}-warp`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency={`${fx} ${fy}`} numOctaves={2} seed={7} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={46} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WIDTH / 2,
          height: HEIGHT / 2,
          transform: "scale(2)",
          transformOrigin: "0 0",
          filter: `url(#${id}-warp)`,
          opacity: fadeIn,
        }}
      >
        {BLOBS.map((b, i) => {
          const px = b.x + Math.sin(t * b.w + b.p) * b.ax;
          const py = b.y + Math.cos(t * b.w * 0.83 + b.p * 1.3) * b.ay;
          const m = interpolateColors(goldMix, [0, 1], [b.neonColor, b.goldColor]).match(/[\d.]+/g) ?? ["0", "0", "0"];
          const rgb = `${Math.round(+m[0])},${Math.round(+m[1])},${Math.round(+m[2])}`;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: px - b.size / 2,
                top: py - b.size / 2,
                width: b.size,
                height: b.size,
                borderRadius: "50%",
                background: `radial-gradient(circle at 50% 50%, rgba(${rgb},1) 0%, rgba(${rgb},0.62) 22%, rgba(${rgb},0.26) 44%, rgba(${rgb},0.07) 66%, rgba(${rgb},0) 80%)`,
                opacity: b.alpha,
              }}
            />
          );
        })}
        {/* warm champagne light that only exists in the finale */}
        <div
          style={{
            position: "absolute",
            left: 262 - 360,
            top: 400 - 360 + Math.sin(t * 0.3) * 30,
            width: 720,
            height: 720,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(243,223,168,0.8) 0%, rgba(243,223,168,0.3) 34%, rgba(243,223,168,0) 68%)",
            opacity: goldMix * 0.6,
          }}
        />
      </div>
    </div>
  );
};

export const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse 85% 70% at 50% 46%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.72) 100%)",
    }}
  />
);

/** 4% film grain. */
export const Grain: React.FC<{ id?: string }> = ({ id = "liq" }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, opacity: 0.04, mixBlendMode: "overlay" }}>
      <filter id={`${id}-grain`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 9} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id}-grain)`} />
    </svg>
  );
};

/** The original opaque liquid-glass background (used when no footage is present). */
export const LiquidBackground: React.FC<{ goldMix: number; fadeIn?: number; id?: string }> = ({ goldMix, fadeIn = 1, id = "liq" }) => (
  <div style={{ position: "absolute", inset: 0, background: COLORS.base, overflow: "hidden" }}>
    <LiquidBlobs goldMix={goldMix} fadeIn={fadeIn} id={id} />
    <Vignette />
    <Grain id={id} />
  </div>
);
