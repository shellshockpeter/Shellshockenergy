import React from "react";
import { Ingredient, TIER_COLOR } from "./data";
import { CARD_H, CARD_W } from "./geometry";
import { DISPLAY, SANS, fitSize } from "./fonts";
import { GOLD, IngredientIcon } from "./icons";

// 1px specular border: white 25% on top → 5% at the bottom (mask trick keeps radius)
export const SpecularBorder: React.FC<{
  radius: number;
  width?: number;
  top?: number;
  bottom?: number;
}> = ({ radius, width = 1, top = 0.25, bottom = 0.05 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: radius,
      padding: width,
      background: `linear-gradient(180deg, rgba(255,255,255,${top}), rgba(255,255,255,${bottom}))`,
      WebkitMask:
        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
      pointerEvents: "none",
    }}
  />
);

export const glassStyle = (radius: number, blur = 24): React.CSSProperties => ({
  borderRadius: radius,
  background:
    "linear-gradient(165deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.06))," +
    "rgba(12,14,18,0.42)",
  backdropFilter: `blur(${blur}px) saturate(160%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 22px 28px -22px rgba(255,255,255,0.18), 0 10px 40px rgba(0,0,0,0.35)",
});

const LockOpen: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinejoin="miter">
    <rect x="4" y="11" width="16" height="10" />
    <polyline points="8,11 8,6 13,3 17,6 17,8" />
  </svg>
);

export const FDA_TEXT =
  "*These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.";

type CardProps = {
  ing: Ingredient;
  frame: number;
  x: number;
  y: number;
  scale: number;
  opacity?: number;
  aura?: number;
  ghost?: boolean;
  glass?: boolean;
  tint?: string; // overlay colour for glitch copies
};

export const IngredientCard: React.FC<CardProps> = ({
  ing,
  frame,
  x,
  y,
  scale,
  opacity = 1,
  aura = 0,
  ghost = false,
  glass = true,
}) => {
  const lines = ing.name.length > 12 ? ing.name.split(" ") : [ing.name];
  const longest = Math.max(...lines.map((l) => l.length));
  const nameSize = fitSize("x".repeat(longest), 366, 56);
  const pulse = 0.75 + 0.25 * Math.sin(frame / 4);
  const R = 34;
  const tongkat = ing.id === "tongkat";
  return (
    <div
      style={{
        position: "absolute",
        left: x - CARD_W / 2,
        top: y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        transform: `scale(${scale})`,
        transformOrigin: "50% 50%",
        opacity,
        willChange: "transform",
      }}
    >
      {aura > 0 && (
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: R + 8,
            background: GOLD,
            opacity: 0.4 * pulse * aura,
            filter: "blur(20px)",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...(glass
            ? glassStyle(R, 22)
            : {
                borderRadius: R,
                background: "rgba(24,26,32,0.8)",
              }),
          outline: ghost ? `2px dashed ${GOLD}aa` : "none",
          outlineOffset: -3,
        }}
      >
        <SpecularBorder radius={R} width={1.5} top={0.4} bottom={0.08} />
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 22,
            width: 128,
            height: 128 + (tongkat ? 0 : 38),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 24,
            background:
              "radial-gradient(circle at 50% 40%, rgba(255,201,74,0.22), rgba(255,201,74,0.02) 70%), rgba(0,0,0,0.28)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          <IngredientIcon id={ing.id} size={96} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 22 + 128 + 22,
            top: 18,
            right: 22,
            bottom: tongkat ? 54 : 18,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: nameSize,
              lineHeight: 0.98,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: 1,
              textShadow: "0 0 18px rgba(255,201,74,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            {lines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {ing.dose && (
              <div
                style={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 24,
                  color: "#1a1400",
                  background: `linear-gradient(180deg, #FFE08A, ${GOLD})`,
                  padding: "4px 14px",
                  borderRadius: 999,
                  letterSpacing: 0.5,
                }}
              >
                {ing.dose}
              </div>
            )}
            {tongkat && (
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 26,
                  color: "#46FF7A",
                  letterSpacing: 2,
                  textShadow: "0 0 12px rgba(70,255,122,0.5)",
                }}
              >
                VITALITY
              </div>
            )}
          </div>
        </div>
        {tongkat && (
          <div
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              bottom: 12,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 10.5,
              lineHeight: 1.25,
              color: "rgba(255,255,255,0.62)",
            }}
          >
            {FDA_TEXT}
          </div>
        )}
        {ghost && (
          <div style={{ position: "absolute", top: 14, right: 18 }}>
            <LockOpen size={28} />
          </div>
        )}
      </div>
    </div>
  );
};

// ───────────────── row chip (small, inside the tier row) ─────────────────
export const RowChip: React.FC<{
  ing: Ingredient;
  w: number;
  h: number;
  s: number; // row scale
  appear: number; // 0..1
}> = ({ ing, w, h, s, appear }) => {
  const iconS = h * 0.7;
  const fs = fitSize(ing.short, w - iconS - h * 0.55, h * 0.4);
  const col = TIER_COLOR[ing.tier];
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        opacity: appear,
        transform: `scale(${0.7 + 0.3 * appear})`,
        display: "flex",
        alignItems: "center",
        gap: h * 0.14,
        padding: `0 ${h * 0.2}px`,
        boxSizing: "border-box",
        ...glassStyle(h * 0.32, 12),
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 ${14 * s}px ${col}55`,
      }}
    >
      <SpecularBorder radius={h * 0.32} top={0.35} bottom={0.08} />
      <IngredientIcon id={ing.id} size={iconS} glow={s > 0.3} />
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: fs,
          color: "#fff",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          letterSpacing: 0.5,
        }}
      >
        {ing.short}
      </div>
    </div>
  );
};

export const OverflowChip: React.FC<{ n: number; h: number }> = ({ n, h }) => (
  <div
    style={{
      height: h,
      minWidth: h,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: DISPLAY,
      fontSize: h * 0.5,
      color: GOLD,
      ...glassStyle(h * 0.32, 8),
    }}
  >
    +{n}
  </div>
);

// ───────────────── ON DECK pill (chart header) ─────────────────
export const OnDeckPill: React.FC<{
  ing: Ingredient;
  frame: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  opacity: number;
}> = ({ ing, frame, cx, cy, w, h, opacity }) => {
  const pulse = 0.5 + 0.5 * Math.sin(frame / 4.5);
  const iconS = h * 0.74;
  const fs = fitSize(ing.short, w - iconS - h * 0.9, h * 0.4);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        opacity,
        display: "flex",
        alignItems: "center",
        gap: h * 0.14,
        padding: `0 ${h * 0.22}px`,
        boxSizing: "border-box",
        ...glassStyle(h * 0.34, 10),
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 ${(8 + 14 * pulse) * (h / 28)}px rgba(255,201,74,${0.3 + 0.35 * pulse})`,
      }}
    >
      <SpecularBorder radius={h * 0.34} top={0.5} bottom={0.15} />
      <IngredientIcon id={ing.id} size={iconS} glow={h > 20} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: h * 0.27,
            color: GOLD,
            letterSpacing: 1,
            opacity: 0.7 + 0.3 * pulse,
          }}
        >
          ON DECK
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: fs,
            color: "#fff",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            marginTop: h * 0.04,
          }}
        >
          {ing.short}
        </div>
      </div>
    </div>
  );
};
