import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import "../brand/fonts";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { GlassCard } from "../components/GlassCard";
import { Headline } from "../components/Headline";
import { Line } from "../components/Line";
import { MediaSlot } from "../components/MediaSlot";
import { AccentPill } from "../components/Pill";
import { Num, centerStyle } from "../components/Text";
import { NUMERAL_FONT, accentFill, accentGradient, color, font } from "../brand/theme";
import { blurIn, easeInOut, lerp, prog } from "../lib/anim";

const cue = z.object({
  from: z.number().describe("first frame this caption shows"),
  to: z.number().describe("last frame this caption shows"),
  text: z.string().describe("wrap one word in *stars* to set it in the accent font, e.g. get no *clients.*"),
});

/** Everything editable in Remotion Studio's props panel. Timings (cuts, animations) live in code. */
export const explainerSchema = z.object({
  mediaSrc: z
    .string()
    .describe("your footage: put the file in video/public/media/ and enter media/yourclip.mp4. Empty = placeholder"),
  hook: z.object({
    line1: z.string(),
    lead: z.string().describe("plain words before the accent keyword on line 2"),
    accent: z.string().describe("accent keyword (Robot Reavers, gold)"),
    tail: z.string(),
    cards: z.array(z.string()).length(3),
    counterValue: z.string(),
    counterLabel: z.string(),
    captions: z.array(cue),
  }),
  problem: z.object({ captions: z.array(cue) }),
  steps: z.object({
    number: z.string(),
    title: z.string(),
    names: z.array(z.string()).length(3),
    captions: z.array(cue),
  }),
  proof: z.object({
    line1: z.string(),
    accent: z.string(),
    tail: z.string(),
    dayLabel: z.string(),
    resultPrefix: z.string(),
    result: z.number().describe("final number the counter counts up to"),
    resultLabel: z.string(),
    captions: z.array(cue),
  }),
});

export type ExplainerProps = z.infer<typeof explainerSchema>;

const Mono: React.FC<{ children: React.ReactNode; size: number; style?: React.CSSProperties }> = ({
  children,
  size,
  style,
}) => (
  <div
    style={{
      fontFamily: font.sans,
      fontWeight: 600,
      fontSize: size,
      lineHeight: 1,
      color: color.text,
      ...style,
    }}
  >
    {children}
  </div>
);

const PersonGlyph: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stopColor={color.accent} />
        <stop offset="1" stopColor={color.accentHi} />
      </linearGradient>
    </defs>
    <circle cx="12" cy="8" r="4.2" fill="url(#g)" />
    <path d="M3.5 21c0-4.6 3.8-7.4 8.5-7.4s8.5 2.8 8.5 7.4z" fill="url(#g)" />
  </svg>
);

const ImageGlyph: React.FC = () => (
  <svg width={38} height={32} viewBox="0 0 38 32" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
    <rect x="1" y="1" width="36" height="30" rx="4" />
    <circle cx="11" cy="10" r="3" />
    <path d="M2 27l10-9 7 6 6-5 11 8" />
  </svg>
);

// ───────────────────────── Scene A: hook graphic (0–103)
const CARD_X = [153, 360, 567];
const CARD_START = [24, 32, 42];

const SceneA: React.FC<{ c: ExplainerProps }> = ({ c }) => {
  const f = useCurrentFrame();
  const dotted = prog(f, 62, 6, (t) => t);
  const pulse = prog(f, 83, 7, (t) => t);
  return (
    <>
      <Headline
        line1={c.hook.line1}
        line2={{ lead: c.hook.lead, accent: c.hook.accent, tail: c.hook.tail }}
        t={{ l1: [1, 8], l2: [9, 18], ul: [10, 14] }}
      />
      {/* hub */}
      <div style={{ position: "absolute", left: 322, top: 309, width: 76, height: 76, ...blurIn(f, 4, 5) }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.85)",
            boxShadow: `0 0 24px ${color.glow}, inset 0 0 18px ${color.glow}`,
            background: "radial-gradient(circle, rgba(255,183,0,0.22), rgba(255,183,0,0.05))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PersonGlyph size={38} />
        </div>
      </div>
      {CARD_X.map((cx, k) => {
        const s = CARD_START[k];
        return (
          <div key={cx}>
            <Line x1={360} y1={385} x2={cx} y2={445} p={prog(f, s, 8, (t) => t)} dot />
            <div style={blurIn(f, s, 7)}>
              <GlassCard x={cx - 70} y={454} w={140} h={152}>
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 9,
                    fontFamily: font.sans,
                    fontWeight: 500,
                    fontSize: 15,
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: 999,
                    padding: "2px 9px 3px",
                    lineHeight: 1,
                  }}
                >
                  {c.hook.cards[k]}
                </div>
                <div style={{ position: "absolute", left: 51, top: 62 }}>
                  <ImageGlyph />
                </div>
              </GlassCard>
            </div>
          </div>
        );
      })}
      {/* dotted converge */}
      {[
        [153, 308],
        [360, 360],
        [567, 412],
      ].map(([x1, x2]) => (
        <Line key={x1} x1={x1} y1={610} x2={x2} y2={676} p={dotted} dashed stroke="rgba(255,255,255,0.7)" width={2} />
      ))}
      {/* counter box */}
      <div style={{ position: "absolute", left: 276, top: 681, width: 168, height: 76, ...blurIn(f, 67, 4) }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            border: "2px solid rgba(255,255,255,0.9)",
            opacity: 1 - pulse,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000",
            border: `2px solid ${color.accent}`,
            boxShadow: `0 0 22px ${color.glow}`,
            opacity: pulse,
          }}
        />
        <div style={{ position: "absolute", left: 18, top: 8 }}>
          <Num size={58}>{c.hook.counterValue}</Num>
        </div>
        <Mono size={27} style={{ position: "absolute", left: 76, top: 14, width: 84, lineHeight: 0.85 }}>
          {c.hook.counterLabel}
        </Mono>
      </div>
      <Caption cues={c.hook.captions} y={810} />
    </>
  );
};

// ───────────────────────── Scene C: steps (210–344)
const ROW_Y = [346, 424, 503];
const STEP_T = [240, 284, 328];
const NODE_START = [236, 280, 324];
const NODE_X = [160, 360, 560];

const barBg = "linear-gradient(90deg, #111113, #2C2C2F)";

const SceneC: React.FC<{ c: ExplainerProps }> = ({ c }) => {
  const f = useCurrentFrame();
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 117,
          top: 187,
          width: 486,
          height: 71,
          background: barBg,
          border: "1px solid rgba(255,255,255,0.28)",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 10, height: "100%", background: color.accent }} />
        <div style={{ position: "absolute", left: 40, top: 14 }}>
          <Num size={46}>{c.steps.number}</Num>
        </div>
        <Mono size={38} style={{ position: "absolute", left: 0, width: 486, top: 14, textAlign: "center", paddingLeft: 36 }}>
          {c.steps.title}
        </Mono>
      </div>
      <div style={blurIn(f, 211, 5)}>
        {ROW_Y.map((y, i) => {
          const on = prog(f, STEP_T[i], 4);
          const off = i < 2 ? prog(f, STEP_T[i + 1], 4) : 0;
          const pill = on * (1 - off);
          return (
            <div key={y}>
              <div
                style={{
                  position: "absolute",
                  left: 147,
                  top: y - 31.5,
                  width: 426,
                  height: 63,
                  background: barBg,
                  border: "1px solid rgba(255,255,255,0.28)",
                  opacity: pill,
                }}
              >
                <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: "100%", background: color.accent }} />
              </div>
              <Mono size={40} style={{ position: "absolute", left: 160, width: 64, textAlign: "center", top: y - 22 }}>
                0{i + 1}
              </Mono>
              <Mono
                size={40}
                style={{
                  position: "absolute",
                  left: 260,
                  width: 250,
                  textAlign: "center",
                  top: y - 22,
                  filter: `blur(${(1 - on) * 8}px)`,
                  opacity: 0.55 + 0.45 * on,
                }}
              >
                {c.steps.names[i]}
              </Mono>
            </div>
          );
        })}
      </div>
      {NODE_X.map((nx, i) => {
        const glow = f >= NODE_START[i] && (i === 2 || f < NODE_START[i + 1]);
        return (
          <div key={nx}>
            {i > 0 && (
              <Line
                x1={NODE_X[i - 1] + 32}
                y1={640}
                x2={nx - 32}
                y2={640}
                p={prog(f, NODE_START[i] - 4, 4, (t) => t)}
                stroke="rgba(255,255,255,0.6)"
              />
            )}
            <div style={blurIn(f, NODE_START[i], 4)}>
              <div
                style={{
                  position: "absolute",
                  left: nx - 32,
                  top: 608,
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.85)",
                  background: "#0A0A0B",
                  boxShadow: glow ? `0 0 22px ${color.glow}, inset 0 0 14px ${color.glow}` : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Num size={42} style={{ opacity: glow ? 1 : 0.5 }}>{String(i + 1)}</Num>
              </div>
              <div style={{ position: "absolute", left: nx - 40, width: 80, top: 690, display: "flex", justifyContent: "center" }}>
                <AccentPill size={22}>{c.steps.names[i]}</AccentPill>
              </div>
            </div>
          </div>
        );
      })}
      <Caption cues={c.steps.captions} y={810} />
    </>
  );
};

// ───────────────────────── Scene D: 30-day proof (345–449)
const GX = 85;
const GY = 313;
const CELL = 46;
const PITCH = 56;

const bez = (t: number): [number, number] => {
  const p = [
    [85, 746],
    [300, 742],
    [470, 690],
    [627, 553],
  ];
  const u = 1 - t;
  const b = (k: number) =>
    u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k];
  return [b(0), b(1)];
};
const CURVE = Array.from({ length: 121 }, (_, i) => bez(i / 120));

const SceneD: React.FC<{ c: ExplainerProps }> = ({ c }) => {
  const f = useCurrentFrame();
  const fill = interpolate(f, [365, 397], [0, 30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const day = Math.floor(fill);
  const dim = prog(f, 401, 8, (t) => t);
  const drawP = prog(f, 405, 33, easeInOut);
  const n = Math.max(2, Math.round(drawP * (CURVE.length - 1)) + 1);
  const pts = CURVE.slice(0, n);
  const tip = pts[pts.length - 1];
  const countP = prog(f, 413, 24);
  const tint = prog(f, 438, 7, (t) => t);
  const plus = Math.round(c.proof.result * countP);
  return (
    <>
      <Headline
        line1={c.proof.line1}
        line2={{ accent: c.proof.accent, tail: c.proof.tail }}
        t={{ l1: [346, 356], l2: [357, 365], ul: [357, 361] }}
      />
      <div style={blurIn(f, 346, 7)}>
        {Array.from({ length: 30 }, (_, i) => {
          const col = i % 10;
          const row = Math.floor(i / 10);
          const lit = Math.min(1, Math.max(0, fill - i));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: GX + col * PITCH,
                top: GY + row * PITCH,
                width: CELL,
                height: CELL,
                borderRadius: 2,
                background: color.bg,
                border: "1px solid rgba(255,255,255,0.38)",
              }}
            >
              <div style={{ position: "absolute", inset: -1, background: accentFill(5), opacity: lit * (1 - dim) }} />
              <div style={{ position: "absolute", inset: -1, background: color.accentDim, opacity: lit * dim }} />
            </div>
          );
        })}
      </div>
      {f >= 361 && (
        <Mono
          size={32}
          style={{
            ...centerStyle(500),
            fontWeight: 500,
            color: dim > 0 ? lerpGrey(dim) : color.text,
          }}
        >
          {c.proof.dayLabel} {day}
        </Mono>
      )}
      {f >= 405 && (
        <svg width={720} height={1280} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id="cv" x1="0" x2="1">
              <stop offset="0" stopColor={color.accent} />
              <stop offset="1" stopColor={color.accentHi} />
            </linearGradient>
          </defs>
          <line x1={85} y1={760} x2={635} y2={760} stroke="#888" strokeWidth={2} />
          <polyline
            points={pts.map((q) => q.join(",")).join(" ")}
            fill="none"
            stroke="url(#cv)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${color.glow})` }}
          />
          {drawP >= 0.99 && (
            <circle cx={tip[0]} cy={tip[1]} r={7} fill={color.accentHi} stroke="#fff" strokeWidth={2} />
          )}
        </svg>
      )}
      {f >= 413 && (
        <div style={{ position: "absolute", left: 132, top: 560, ...blurIn(f, 413, 4) }}>
          <div style={{ position: "relative", fontFamily: NUMERAL_FONT, fontWeight: 700, fontSize: 84, lineHeight: 1 }}>
            <span style={{ color: color.text, opacity: 1 - tint }}>{c.proof.resultPrefix}{plus}</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                backgroundImage: accentGradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                opacity: tint,
              }}
            >
              {c.proof.resultPrefix}{plus}
            </span>
          </div>
        </div>
      )}
      {f >= 421 && (
        <div style={{ position: "absolute", left: 141, top: 646, ...blurIn(f, 421, 4) }}>
          <AccentPill size={24}>{c.proof.resultLabel}</AccentPill>
        </div>
      )}
      <Caption cues={c.proof.captions} y={810} />
    </>
  );
};

const lerpGrey = (p: number): string => {
  const v = Math.round(lerp(255, 83, p));
  return `rgb(${v},${v},${v})`;
};

export const Explainer: React.FC<ExplainerProps> = (c) => {
  const f = useCurrentFrame();
  const full = f >= 104 && f < 210;
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      {!full && <Backdrop />}
      <MediaSlot
        src={c.mediaSrc || undefined}
        layout={full ? "full" : "panel"}
        scale={f >= 104 && f < 162 ? 1.1 : 1}
      />
      {f < 104 && <SceneA c={c} />}
      {full && <Caption cues={c.problem.captions} y={806} />}
      {f >= 210 && f < 345 && <SceneC c={c} />}
      {f >= 345 && <SceneD c={c} />}
    </AbsoluteFill>
  );
};
