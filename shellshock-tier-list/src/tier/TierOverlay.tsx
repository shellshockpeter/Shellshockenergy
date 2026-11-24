import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import {
  DIMMED_TIERS,
  FACE_ZONE,
  FX,
  HOOK,
  INGREDIENTS,
  ING_BY_ID,
  TIERS,
  TIER_COLOR,
  TUB_ZONE,
  slotIndex,
} from "./data";
import {
  CARD_H,
  CARD_W,
  CENTER_BOTTOM,
  Geo,
  cardStateAt,
  chipAt,
  clamp,
  deckPillAt,
  easeIn,
  easeOut,
  geoAt,
  lerp,
  prog,
  rowCenterY,
  rowFlareAt,
  slotCenterX,
  smooth,
  targetOf,
} from "./geometry";
import { DISPLAY, SANS } from "./fonts";
import {
  IngredientCard,
  OnDeckPill,
  OverflowChip,
  RowChip,
  SpecularBorder,
  glassStyle,
} from "./Card";
import { GOLD, NEON } from "./icons";
import { SlamGlow, SlamSparks, redTint } from "./Fx";

export type TierOverlayProps = { DEBUG?: boolean };

// ───────────────────────── tier row ─────────────────────────
const TierRow: React.FC<{ tier: (typeof TIERS)[number]; i: number; g: Geo; f: number }> = ({
  tier,
  i,
  g,
  f,
}) => {
  const col = TIER_COLOR[tier];
  const dim = DIMMED_TIERS.includes(tier);
  const flare = rowFlareAt(tier, f);
  const y = g.rowsTop + i * (g.rowH + g.gap);
  const tileInset = 8 * g.s;
  const placed = INGREDIENTS.filter((ing) => ing.tier === tier)
    .map((ing) => ({ ing, a: chipAt(ing, f) }))
    .filter((c) => c.a > 0);
  const chipW = g.areaW / 2 - 8 * g.s;
  const chipH = g.rowH * 0.62;
  return (
    <div
      style={{
        position: "absolute",
        left: g.rowX,
        top: y,
        width: g.rowW,
        height: g.rowH,
        ...glassStyle(g.radius, 24),
        background: `linear-gradient(100deg, ${col}${dim ? "10" : "26"}, rgba(255,255,255,0.05) 38%, rgba(255,255,255,0.06)), rgba(12,14,18,0.34)`,
        opacity: dim ? 0.42 : 1,
      }}
    >
      <SpecularBorder radius={g.radius} width={Math.max(1, 1.2 * g.s * 2)} />
      {/* tier-colored flare */}
      {flare > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: g.radius,
            border: `${Math.max(1.5, 4 * g.s)}px solid ${col}`,
            boxShadow: `0 0 ${34 * g.s}px ${col}, inset 0 0 ${40 * g.s}px ${col}88`,
            opacity: flare,
          }}
        />
      )}
      {/* tier letter tile */}
      <div
        style={{
          position: "absolute",
          left: tileInset,
          top: tileInset,
          width: g.tileW - tileInset,
          height: g.rowH - tileInset * 2,
          borderRadius: g.radius * 0.7,
          background: "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(0,0,0,0.35))",
          boxShadow: `inset 0 0 ${30 * g.s}px ${col}aa, inset 0 1px 0 rgba(255,255,255,0.4), 0 0 ${12 * g.s}px ${col}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: g.rowH * 0.6,
            lineHeight: 1,
            background: `linear-gradient(180deg, #ffffff 0%, ${col} 52%, ${col}99 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 ${2 * g.s}px ${6 * g.s}px ${col}99)`,
            paddingRight: g.rowH * 0.06,
          }}
        >
          {tier}
        </div>
      </div>
      {/* chips */}
      {placed.slice(0, 2).map(({ ing, a }) => {
        const slot = slotIndex(ing);
        const cx = slotCenterX(g, slot) - g.rowX;
        return (
          <div
            key={ing.id}
            style={{
              position: "absolute",
              left: cx - chipW / 2,
              top: (g.rowH - chipH) / 2,
            }}
          >
            <RowChip ing={ing} w={chipW} h={chipH} s={g.s} appear={a} />
          </div>
        );
      })}
      {placed.length > 2 && (
        <div
          style={{
            position: "absolute",
            right: 10 * g.s,
            top: (g.rowH - chipH) / 2,
          }}
        >
          <OverflowChip n={placed.length - 2} h={chipH} />
        </div>
      )}
    </div>
  );
};

// ───────────────────────── chart ─────────────────────────
const Chart: React.FC<{ g: Geo; f: number }> = ({ g, f }) => {
  const { rect, p, t } = g;
  const panelR = lerp(44, 22, t) * g.z;
  // slow drifting light blobs (inside the chart only)
  const blobs = [
    { c: "255,201,74", x: 0.2 + 0.18 * Math.sin(f / 170), y: 0.25 + 0.12 * Math.cos(f / 130), r: 0.7 },
    { c: "70,255,122", x: 0.8 + 0.14 * Math.cos(f / 150), y: 0.62 + 0.16 * Math.sin(f / 190), r: 0.62 },
    { c: "255,201,74", x: 0.5 + 0.2 * Math.sin(f / 210 + 2), y: 0.92 + 0.06 * Math.cos(f / 160), r: 0.55 },
  ];
  // very subtle idle shimmer once the final corner state is reached
  const shimmerOn = f >= 3517 + 14;
  const sh = shimmerOn ? ((f - 3531) % 240) / 240 : -1;
  const titleSize = g.headerH * 0.33;
  const subOp = 1 - smooth(t * 2);
  return (
    <div style={{ opacity: p.vis < 1 ? p.vis : undefined }}>
      <div
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          borderRadius: panelR,
          overflow: "hidden",
          background: "rgba(8,10,14,0.34)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        {blobs.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(b.x - b.r / 2) * 100}%`,
              top: `${(b.y - b.r / 2) * 100}%`,
              width: `${b.r * 100}%`,
              height: `${b.r * 100 * (rect.w / rect.h)}%`,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${b.c},0.34) 0%, rgba(${b.c},0) 68%)`,
            }}
          />
        ))}
        {sh >= 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "28%",
              left: `${lerp(-40, 120, sh)}%`,
              background:
                "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,230,160,0.07) 50%, rgba(255,255,255,0) 100%)",
              transform: "skewX(-18deg)",
            }}
          />
        )}
      </div>
      <SpecularFrame g={g} radius={panelR} />
      {/* header */}
      <div
        style={{
          position: "absolute",
          left: rect.x + g.pad + 6 * g.z,
          top: rect.y + g.pad,
          height: g.headerH,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {subOp > 0.02 && (
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: titleSize * 0.5,
              color: GOLD,
              letterSpacing: 4,
              opacity: subOp,
              marginBottom: titleSize * 0.12 * subOp,
              height: titleSize * 0.5 * subOp * 1.1,
              overflow: "hidden",
            }}
          >
            SHELL SHOCK
          </div>
        )}
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: titleSize,
            lineHeight: 1,
            color: "#fff",
            letterSpacing: 1,
            textShadow: `0 0 ${14 * g.z}px rgba(255,201,74,0.4)`,
            whiteSpace: "nowrap",
          }}
        >
          INGREDIENT TIER LIST
        </div>
      </div>
      {TIERS.map((tier, i) => (
        <TierRow key={tier} tier={tier} i={i} g={g} f={f} />
      ))}
      {INGREDIENTS.map((ing) => {
        const o = deckPillAt(ing, f, g);
        if (o <= 0) return null;
        return (
          <OnDeckPill
            key={ing.id}
            ing={ing}
            frame={f}
            cx={g.pill.cx}
            cy={g.pill.cy}
            w={g.pill.w}
            h={g.pill.h}
            opacity={o}
          />
        );
      })}
    </div>
  );
};

const SpecularFrame: React.FC<{ g: Geo; radius: number }> = ({ g, radius }) => (
  <div
    style={{
      position: "absolute",
      left: g.rect.x,
      top: g.rect.y,
      width: g.rect.w,
      height: g.rect.h,
      pointerEvents: "none",
    }}
  >
    <SpecularBorder radius={radius} width={Math.max(1, 2 * g.z)} top={0.3} bottom={0.06} />
  </div>
);

// ───────────────────────── hook (creatine fake-out) ─────────────────────────
const SPLIT_R = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";
const SPLIT_G = "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0";
const SPLIT_B = "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0";

const HookCard: React.FC<{ g: Geo; f: number }> = ({ g, f }) => {
  const ing = ING_BY_ID.creatine;
  const land = HOOK.chartIn + 10;
  const vanish = HOOK.reject + HOOK.glitchFrames;
  if (f < HOOK.chartIn || f >= vanish) return null;
  const tgt = { x: g.areaX + g.areaW / 2, y: rowCenterY(g, 0) };
  const sp = prog(f, HOOK.chartIn, 10);
  const at = (k: number) => easeIn(clamp(sp - k));
  const mk = (k: number) => ({
    x: lerp(CENTER_BOTTOM.x, tgt.x, at(k)),
    y: lerp(CENTER_BOTTOM.y, tgt.y, at(k)),
  });
  const main = mk(0);
  const sc = g.cardScale * (f >= land ? 1 + 0.18 * (1 - easeOut(prog(f, land, 6))) : 0.9);
  const glitching = f >= HOOK.reject;
  const gAge = f - HOOK.reject;
  const flash = glitching ? 0.5 * (1 - gAge / HOOK.glitchFrames) : 0;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="split-r"><feColorMatrix type="matrix" values={SPLIT_R} /></filter>
          <filter id="split-g"><feColorMatrix type="matrix" values={SPLIT_G} /></filter>
          <filter id="split-b"><feColorMatrix type="matrix" values={SPLIT_B} /></filter>
        </defs>
      </svg>
      {sp < 1 &&
        [3, 2, 1].map((k) => {
          const q = mk(k * 0.07);
          return (
            <div key={k} style={{ position: "absolute", inset: 0, opacity: 0.2 * (4 - k) * 0.5 }}>
              <IngredientCard ing={ing} frame={f} x={q.x} y={q.y} scale={g.cardScale * 0.9} glass={false} />
            </div>
          );
        })}
      {!glitching && (
        <IngredientCard ing={ing} frame={f} x={main.x} y={main.y} scale={sc} aura={1} />
      )}
      {glitching && (
        <>
          {[
            { id: "split-r", dx: -12, dy: 0, slice: false },
            { id: "split-g", dx: 0, dy: 0, slice: false },
            { id: "split-b", dx: 12, dy: 0, slice: false },
            { id: "", dx: 0, dy: 0, slice: true },
          ].map((c, i) => {
            const jx = c.slice ? (random(`gl-x-${f}`) - 0.5) * 70 : (random(`gl-j-${f}-${i}`) - 0.5) * 8;
            const a = random(`gl-a-${f}`) * 60;
            const b = 100 - a - (10 + random(`gl-b-${f}`) * 22);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  filter: c.id ? `url(#${c.id})` : undefined,
                  mixBlendMode: "screen",
                  clipPath: c.slice ? `inset(${a}% 0 ${b}% 0)` : undefined,
                  opacity: 1 - (gAge / (HOOK.glitchFrames + 1)) * 0.8,
                }}
              >
                <IngredientCard
                  ing={ing}
                  frame={f}
                  x={main.x + c.dx * (1 + gAge * 0.35) + jx}
                  y={main.y + c.dy}
                  scale={sc}
                  aura={0}
                  glass={false}
                />
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: g.rect.x,
              top: g.rect.y,
              width: g.rect.w,
              height: g.rect.h,
              background: `rgba(255,40,60,${flash})`,
              mixBlendMode: "screen",
            }}
          />
        </>
      )}
    </>
  );
};

// ───────────────────────── debug zones ─────────────────────────
const overlapOf = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? { w, h } : null;
};

const Debug: React.FC<{ g: Geo; f: number }> = ({ g, f }) => {
  const ov = g.p.vis > 0 && g.t > 0.98 ? overlapOf(g.rect, FACE_ZONE) : null;
  const box = (
    r: { x: number; y: number; w: number; h: number },
    c: string,
    label: string,
  ) => (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        border: `2px dashed ${c}`,
        background: `${c}14`,
        color: c,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 22,
        padding: 6,
        boxSizing: "border-box",
      }}
    >
      {label}
    </div>
  );
  return (
    <>
      {box(FACE_ZONE, "#00E5FF", "FACE ZONE")}
      {box(TUB_ZONE, "#FF4DFF", "PRODUCT TUB ZONE")}
      <div
        style={{
          position: "absolute",
          left: 20,
          bottom: 20,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 24,
          color: ov ? "#FF4D4D" : "#7CFF7C",
          background: "rgba(0,0,0,0.55)",
          padding: "6px 12px",
        }}
      >
        f{f} · chart {Math.round(g.rect.x)},{Math.round(g.rect.y)} {Math.round(g.rect.w)}×{Math.round(g.rect.h)} ·{" "}
        {ov ? `OVERLAPS FACE ZONE by ${Math.round(ov.w)}×${Math.round(ov.h)}px` : "clear of face zone"}
      </div>
    </>
  );
};

// ───────────────────────── composition ─────────────────────────
export const TierOverlay: React.FC<TierOverlayProps> = ({ DEBUG = false }) => {
  const f = useCurrentFrame();
  const g = geoAt(f);
  const { p } = g;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* scrim — only in the full state; the ONLY thing allowed to cover the video */}
      {p.scrim > 0.001 && (
        <AbsoluteFill
          style={{
            background: "rgba(4,5,8,0.5)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            opacity: p.scrim,
          }}
        />
      )}

      {p.vis > 0.001 && <Chart g={g} f={f} />}

      {/* slam burst + ring (behind cards) */}
      {INGREDIENTS.map((ing) => {
        const age = f - ing.slam;
        if (age < 0 || age >= FX.rowFlare) return null;
        const t = targetOf(g, ing);
        return <SlamGlow key={`g-${ing.id}`} ing={ing} age={age} cx={t.x} cy={t.y} u={g.u} />;
      })}
      {f >= HOOK.chartIn + 10 && f < HOOK.chartIn + 10 + FX.burst && (
        <SlamGlow
          ing={ING_BY_ID.creatine}
          age={f - (HOOK.chartIn + 10)}
          cx={g.areaX + g.areaW / 2}
          cy={rowCenterY(g, 0)}
          u={g.u}
          intensity={0.55}
        />
      )}

      {/* F-tier red tint */}
      {INGREDIENTS.filter((i) => i.tier === "F").map((ing) => {
        const a = redTint(f - ing.slam);
        return a > 0 ? (
          <div
            key={`t-${ing.id}`}
            style={{
              position: "absolute",
              left: g.rect.x,
              top: g.rect.y,
              width: g.rect.w,
              height: g.rect.h,
              borderRadius: 22 * g.z,
              background: `rgba(255,40,60,${a})`,
              mixBlendMode: "screen",
            }}
          />
        ) : null;
      })}

      {/* hook */}
      {f >= HOOK.chartIn && f < HOOK.chartFadeStart + HOOK.chartFadeFrames && p.vis > 0 && (
        <HookCard g={g} f={f} />
      )}

      {/* ingredient cards */}
      {INGREDIENTS.map((ing) => {
        const s = cardStateAt(ing, f, g);
        if (!s) return null;
        return (
          <IngredientCard
            key={ing.id}
            ing={ing}
            frame={f}
            x={s.x + s.vib.x}
            y={s.y + s.vib.y}
            scale={s.scale}
            opacity={s.opacity}
            aura={s.aura}
            ghost={s.ghost}
          />
        );
      })}

      {/* sparks / cracks (above cards) */}
      {INGREDIENTS.map((ing) => {
        const age = f - ing.slam;
        if (age < 0 || age >= FX.sparks + 1) return null;
        const t = targetOf(g, ing);
        return (
          <SlamSparks
            key={`s-${ing.id}`}
            ing={ing}
            age={age}
            cx={t.x}
            cy={t.y}
            u={g.u}
            f={ing.tier === "F"}
            rowW={g.rowW}
            rowH={g.rowH}
          />
        );
      })}

      {DEBUG && <Debug g={g} f={f} />}
    </AbsoluteFill>
  );
};
void CARD_H;
void CARD_W;
void NEON;
