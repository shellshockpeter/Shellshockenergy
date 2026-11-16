import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../config";
import { easeInOut, enterSpring, ramp } from "../ease";

const MASK_BORDER: React.CSSProperties = {
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
};

/**
 * Liquid-glass card. Centered on (cx, cy).
 * - blur-to-sharp entrance from slightly below (soft overshoot spring)
 * - one specular sweep on entrance
 * - exit: scale 0.96 + fade (window given in LOCAL frames)
 * NOTE: opacity/filter are never put on an ancestor of the backdrop-filter layer
 * (that would kill the backdrop blur), only on sibling layers.
 */
export const GlassCard: React.FC<{
  cx: number;
  cy: number;
  width: number;
  height: number;
  enterAt: number;
  enterDur?: number;
  exitStart?: number;
  exitEnd?: number;
  scale?: number;
  variant?: "green" | "gold";
  glowBoost?: number; // 0..1 extra glow ("breathe")
  children: React.ReactNode;
}> = ({
  cx,
  cy,
  width,
  height,
  enterAt,
  enterDur = 20,
  exitStart,
  exitEnd,
  scale = 1,
  variant = "green",
  glowBoost = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const gold = variant === "gold";
  if (frame < enterAt) return null;

  const e = enterSpring(frame, enterAt, enterDur, gold ? 16 : 13);
  const x = exitStart !== undefined && exitEnd !== undefined ? ramp(frame, exitStart, exitEnd, easeInOut) : 0;
  if (x >= 1) return null;

  const fade = ramp(frame, enterAt, enterAt + Math.round(enterDur * 0.5)) * (1 - x);
  // content lags the glass body on the way in and leaves first on the way out,
  // so two overlapping cards never show text-on-text
  const inLag = gold ? 5 : 2;
  const contentOp =
    ramp(frame, enterAt + inLag, enterAt + inLag + 8) *
    (exitStart !== undefined ? 1 - ramp(frame, exitStart, exitStart + 6) : 1);
  const blur = (1 - ramp(frame, enterAt + inLag, enterAt + Math.round(enterDur * 0.8) + inLag)) * (gold ? 22 : 18);
  const s = (0.94 + 0.06 * e) * (1 - 0.04 * x) * scale;
  const ty = (1 - e) * (gold ? 80 : 64);

  // specular sweep(s)
  const sweepDur = gold ? 34 : 22;
  const sweepStart = enterAt + (gold ? 14 : 5);
  const sweep = ramp(frame, sweepStart, sweepStart + sweepDur, easeInOut);
  const sweepX = interpolate(sweep, [0, 1], [-70, 130]);
  const sweepOn = frame >= sweepStart && frame <= sweepStart + sweepDur + 2;

  const accent = gold ? COLORS.gold : COLORS.neon;
  const accentRGB = gold ? "232,194,106" : "57,255,20";
  const glow = (gold ? 0.26 : 0.14) + glowBoost * (gold ? 0.2 : 0.22);
  const borderW = gold ? 3 : 1.5;
  const angle = frame * 1.1;

  const borderBg = gold
    ? `conic-gradient(from ${angle}deg, rgba(232,194,106,0.25), #FFF1C2 10%, rgba(232,194,106,0.25) 28%, rgba(255,255,255,0.12) 48%, #E8C26A 70%, #FFFFFF 80%, rgba(232,194,106,0.25))`
    : `linear-gradient(155deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.12) 34%, rgba(255,255,255,0) 58%, rgba(${accentRGB},0.28) 100%)`;

  return (
    <div
      style={{
        position: "absolute",
        left: cx - width / 2,
        top: cy - height / 2,
        width,
        height,
        transform: `translateY(${ty}px) scale(${s})`,
        transformOrigin: "50% 50%",
      }}
    >
      {/* glass body */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 36,
          overflow: "hidden",
          opacity: fade,
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          background: `linear-gradient(165deg, rgba(255,255,255,0.10) 0%, ${COLORS.glass} 40%, rgba(${accentRGB},0.035) 100%)`,
          boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.32), inset 0 -40px 80px rgba(${accentRGB},0.05), 0 0 ${gold ? 130 : 90}px rgba(${accentRGB},${glow}), 0 40px 90px rgba(0,0,0,0.5)`,
        }}
      >
        {/* top highlight */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "32%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0))",
          }}
        />
        {sweepOn ? (
          <div
            style={{
              position: "absolute",
              top: "-20%",
              bottom: "-20%",
              width: gold ? "70%" : "55%",
              left: `${sweepX}%`,
              transform: "skewX(-18deg)",
              background: gold
                ? "linear-gradient(90deg, rgba(255,241,194,0), rgba(255,241,194,0.34) 50%, rgba(255,241,194,0))"
                : "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.22) 50%, rgba(255,255,255,0))",
              mixBlendMode: "screen",
            }}
          />
        ) : null}
      </div>
      {/* gradient border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 36,
          padding: borderW,
          background: borderBg,
          opacity: fade * (gold ? 1 : 0.95),
          ...MASK_BORDER,
        }}
      />
      {/* content (blur-to-sharp) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: contentOp,
          filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
          color: COLORS.text,
        }}
      >
        {children}
      </div>
      {/* tiny accent glint on the top edge */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: "18%",
          width: "34%",
          height: 2,
          borderRadius: 2,
          opacity: fade * 0.9,
          background: `linear-gradient(90deg, rgba(${accentRGB},0), ${accent}, rgba(${accentRGB},0))`,
          filter: `blur(0.5px) drop-shadow(0 0 8px ${accent})`,
        }}
      />
    </div>
  );
};
