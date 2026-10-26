import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Badge } from "./TrainerLaunch"; // also registers Bebas Neue / DM Sans / Robot Reavers

/**
 * "EVERYTHING INSIDE" v2 — 25.0s, 9:16, 30fps. Script: promo/everything-inside-script.md
 *
 * Premium-launch treatment: aurora backgrounds, a 3D phone on a moving camera,
 * translucent glass UI bubbles built from real in-app labels, per-beat text
 * layouts, and real transitions between beats. Phone screens play
 * public/clips/<clipId>.mp4 when the `clips` prop says it exists (see
 * scripts/render-inside.mjs); otherwise a ghost-UI slot is shown.
 */

const f = (s: number) => Math.round(s * 30);

const DISPLAY = "'Bebas Neue', Impact, sans-serif";
const BODY = "'DM Sans', system-ui, sans-serif";
const LOGO = "'Robot Reavers', 'Bebas Neue', Impact, sans-serif";

const YELLOW = "#FACC15";
const CYAN = "#00CFFF";
const ORANGE = YELLOW; // brand: yellow + cyan only
const VIOLET = CYAN;
const RED = "#FF3B1A";
const INK = "#07070B";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ez = Easing.bezier(0.22, 1, 0.36, 1);
const ezIO = Easing.bezier(0.65, 0, 0.35, 1);

const pop = (frame: number, delay: number, damping = 13, stiffness = 150) =>
  spring({ frame: frame - delay, fps: 30, config: { damping, stiffness } });

/* ───────────────────────── types ───────────────────────── */

type Trans = "flash" | "push-left" | "push-up" | "zoom" | "circle" | "wipe" | "glitch";
type Cam = { x: number; y: number; s: number; rx: number; ry: number; rz: number };
const C = (x = 0, y = 0, s = 1, rx = 0, ry = 0, rz = 0): Cam => ({ x, y, s, rx, ry, rz });

type Orb = { x: number; y: number; r: number; c: string; a?: number };
type Bg = { orbs: Orb[]; rays?: string; light?: boolean; base?: string; grid?: string; scan?: boolean };

type TitleSpec = {
  lines: string[];
  pos: "top" | "left" | "bottom";
  size?: number;
  delays?: number[];
  plate?: boolean;
  dark?: boolean;
};
type Bub = { at: number; x: number; y: number; rot?: number; node: React.ReactNode };
type Tap = { at: number; x: number; y: number }; // x,y = 0..1 of the screen

type PhoneBeat = {
  kind: "phone";
  id: string;
  from: number;
  dur: number;
  trans: Trans;
  accent: string;
  bg: Bg;
  title: TitleSpec;
  title2?: { at: number; spec: TitleSpec };
  cam0: Cam;
  cam1: Cam;
  clip: string;
  startSec: number;
  rec: number;
  slot: string;
  action: string;
  bubbles: Bub[];
  taps?: Tap[];
  loop: number; // -1 none
  phoneOpacity?: number;
  burst?: boolean;
};
type CardBeat = { kind: "bored" | "offer" | "turnA" | "turnB" | "cta"; id: string; from: number; dur: number; trans: Trans };
type Beat = PhoneBeat | CardBeat;

/* ───────────────────────── glass UI toolkit ───────────────────────── */

const Glass: React.FC<{
  w?: number;
  pad?: number;
  tint?: string;
  radius?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ w, pad = 30, tint, radius = 40, children, style }) => (
  <div
    style={{
      width: w,
      padding: pad,
      borderRadius: radius,
      background: `linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))${
        tint ? `, ${tint}` : ""
      }`,
      border: "1.5px solid rgba(255,255,255,0.30)",
      backdropFilter: "blur(26px) saturate(1.5)",
      WebkitBackdropFilter: "blur(26px) saturate(1.5)",
      boxShadow:
        "0 30px 80px rgba(0,0,0,0.45), inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -20px 40px rgba(255,255,255,0.03)",
      color: "#fff",
      ...style,
    }}
  >
    {children}
  </div>
);

const Icon: React.FC<{ name: "bolt" | "check" | "video" | "ring" | "flame"; color: string; size?: number }> = ({
  name,
  color,
  size = 34,
}) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (name === "bolt") return <svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill={color} /></svg>;
  if (name === "check") return <svg {...p}><path d="m5 12.5 4.5 4.5L19 7" /></svg>;
  if (name === "video") return <svg {...p}><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 6-3v10l-6-3z" fill={color} /></svg>;
  if (name === "flame") return <svg {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" fill={color} /></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>;
};

const Chip: React.FC<{ text: string; icon?: "bolt" | "check" | "video" | "flame"; color?: string; big?: boolean }> = ({
  text,
  icon,
  color = YELLOW,
  big,
}) => (
  <Glass pad={big ? 26 : 20} radius={999} style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
    {icon ? <Icon name={icon} color={color} size={big ? 48 : 40} /> : (
      <span style={{ width: 16, height: 16, borderRadius: 8, background: color, boxShadow: `0 0 18px ${color}` }} />
    )}
    <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: big ? 48 : 38, letterSpacing: 3, whiteSpace: "nowrap" }}>{text}</span>
  </Glass>
);

const Seg: React.FC<{ options: string[]; to: number; at: number; accent: string; w: number }> = ({ options, to, at, accent, w }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 10], [0, 1], { ...cl, easing: ez });
  const cell = (w - 16) / options.length;
  return (
    <Glass pad={8} radius={999} w={w}>
      <div style={{ position: "relative", display: "flex" }}>
        <div
          style={{
            position: "absolute", top: 0, bottom: 0, left: cell * (to * p), width: cell,
            borderRadius: 999, background: accent, boxShadow: `0 0 30px ${accent}99`,
          }}
        />
        {options.map((o, i) => (
          <div
            key={o}
            style={{
              position: "relative", width: cell, textAlign: "center", padding: "20px 0",
              fontFamily: DISPLAY, fontSize: 52, letterSpacing: 3,
              color: Math.round(to * p) === i ? "#0A0A0A" : "#fff",
            }}
          >
            {o}
          </div>
        ))}
      </div>
    </Glass>
  );
};

const RingStat: React.FC<{ pct: number; at: number; label: string; accent: string; size?: number }> = ({ pct, at, label, accent, size = 220 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 22], [0, pct], { ...cl, easing: ez });
  const r = size / 2 - 18;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={22} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={accent} strokeWidth={22} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 14px ${accent})` }}
        />
        <text x="50%" y="56%" textAnchor="middle" fontFamily={DISPLAY} fontSize={size * 0.3} fill="#fff">
          {Math.round(p)}%
        </text>
      </svg>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 4, lineHeight: 1.25 }}>{label}</div>
    </div>
  );
};

const Bar: React.FC<{ label: string; pct: number; at: number; color: string }> = ({ label, pct, at, color }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 20], [0, pct], { ...cl, easing: ez });
  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 4, marginBottom: 8 }}>{label}</div>
      <div style={{ height: 16, borderRadius: 8, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", borderRadius: 8, background: color, boxShadow: `0 0 20px ${color}` }} />
      </div>
    </div>
  );
};

const TIERS = ["rust", "bronze", "silver", "gold", "platinum", "diamond", "mythic", "legendary"];
const TIER_GLOW = ["#b0541f", "#FFB347", CYAN, "#FFD700", CYAN, "#8B00FF", "#d36bff", RED];

const TierRow: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <Glass pad={16} radius={999} style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {TIERS.map((t, i) => {
        const p = pop(frame, at + i * 2.5);
        return (
          <div key={t} style={{ transform: `scale(${p})` }}>
            <Badge img={t} glow={TIER_GLOW[i]} size={78} />
          </div>
        );
      })}
    </Glass>
  );
};

const Orbit: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const items = [
    ["CHEST", YELLOW], ["BACK", CYAN], ["LEGS", YELLOW],
    ["SHOULDERS", CYAN], ["ARMS", YELLOW], ["ABS", CYAN],
  ] as const;
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      {items.map(([name, col], i) => {
        const a = (frame * 0.05 + (i / items.length) * Math.PI * 2);
        const x = Math.cos(a) * 400;
        const y = Math.sin(a) * 120;
        const depth = (Math.sin(a) + 1) / 2; // 0 back → 1 front
        const s = (0.7 + depth * 0.5) * pop(frame, at + i * 3);
        return (
          <div
            key={name}
            style={{
              position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`,
              zIndex: Math.round(depth * 10), opacity: 0.55 + depth * 0.45,
            }}
          >
            <Chip text={name} color={col} />
          </div>
        );
      })}
    </div>
  );
};

const PostCard: React.FC<{ at: number; accent: string }> = ({ at, accent }) => {
  const frame = useCurrentFrame();
  const reacts = ["⚡️", "🔥", "💪🏻", "✅"];
  const plus = interpolate(frame, [at + 14, at + 26], [0, 1], cl);
  return (
    <Glass w={780} pad={34}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: `linear-gradient(135deg, ${accent}, ${YELLOW})`, display: "grid", placeItems: "center", fontFamily: DISPLAY, fontSize: 48, color: "#0A0A0A" }}>S</div>
        <div>
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: accent }}>SHELLSHOCK ACADEMY</div>
          <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,0.65)" }}>just now</div>
        </div>
      </div>
      <div style={{ marginTop: 22, fontFamily: BODY, fontWeight: 700, fontSize: 44, lineHeight: 1.2 }}>🏋️ Just crushed a workout</div>
      <div style={{ marginTop: 6, fontFamily: BODY, fontWeight: 700, fontSize: 36, color: YELLOW }}>🔥 NEW PR</div>
      <div style={{ marginTop: 26, display: "flex", gap: 12, position: "relative" }}>
        {reacts.map((e, i) => (
          <div
            key={e}
            style={{
              fontSize: 40, padding: "8px 18px", borderRadius: 999,
              background: i === 1 ? `${accent}55` : "rgba(255,255,255,0.10)",
              border: `1.5px solid ${i === 1 ? accent : "rgba(255,255,255,0.2)"}`,
              transform: i === 1 ? `scale(${1 + plus * 0.12})` : undefined,
            }}
          >
            {e}
            {i === 1 && <span style={{ fontFamily: DISPLAY, fontSize: 36, marginLeft: 10 }}>{1 + Math.round(plus)}</span>}
          </div>
        ))}
        <div
          style={{
            position: "absolute", left: 130, top: -50 - plus * 30, opacity: plus * (1 - interpolate(frame, [at + 26, at + 36], [0, 1], cl)),
            fontFamily: DISPLAY, fontSize: 56, color: accent,
          }}
        >
          +1
        </div>
      </div>
    </Glass>
  );
};

const JoinCard: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const press = interpolate(frame, [at + 8, at + 12, at + 16], [0, 1, 0], cl);
  const prog = interpolate(frame, [at + 16, at + 30], [0, 62], { ...cl, easing: ez });
  return (
    <Glass w={760} pad={34}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 5, color: "rgba(255,255,255,0.7)" }}>ACTIVE CHALLENGES</div>
      <div
        style={{
          marginTop: 20, padding: "26px 0", textAlign: "center", borderRadius: 22, background: YELLOW, color: "#0A0A0A",
          fontFamily: DISPLAY, fontSize: 64, letterSpacing: 4, transform: `scale(${1 - press * 0.05})`,
          boxShadow: `0 0 ${30 + press * 40}px ${YELLOW}aa`,
        }}
      >
        JOIN CHALLENGE
      </div>
      <div style={{ marginTop: 26, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
        <div style={{ width: `${prog}%`, height: "100%", background: `linear-gradient(90deg, ${YELLOW}, ${CYAN})` }} />
      </div>
      <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 12, fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 3 }}>
        <Icon name="video" color={CYAN} /> UPLOAD PROOF VIDEO
      </div>
    </Glass>
  );
};

const Sparks: React.FC<{ at: number; color: string; n?: number }> = ({ at, color, n = 26 }) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - at);
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const ang = random(`a${i}`) * Math.PI * 2;
        const sp = 220 + random(`s${i}`) * 520;
        const d = interpolate(t, [0, 26], [0, 1], { ...cl, easing: ez });
        const x = Math.cos(ang) * sp * d;
        const y = Math.sin(ang) * sp * d + t * t * 0.9;
        const sz = 8 + random(`z${i}`) * 14;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: sz, height: sz * 2.2, borderRadius: 4, background: i % 3 === 0 ? CYAN : color,
              opacity: interpolate(t, [0, 4, 30], [0, 1, 0], cl), transform: `rotate(${ang * 57 + t * 12}deg)`,
              boxShadow: `0 0 14px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};

const PowerHud: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at + 4, at + 40], [8, 86], { ...cl, easing: ez });
  return (
    <Glass w={470} pad={28}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 5, color: CYAN }}>
        <Icon name="bolt" color={CYAN} size={34} /> POWER LEVEL
      </div>
      <div style={{ marginTop: 16, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", borderRadius: 11, background: `linear-gradient(90deg, ${CYAN}, ${YELLOW})`, boxShadow: `0 0 26px ${CYAN}` }} />
      </div>
    </Glass>
  );
};

/* ───────────────────────── beats ───────────────────────── */

const orbs = (...o: Orb[]): Bg => ({ orbs: o });

export const BEATS: Beat[] = [
  // ───────── 1 HOOK 0:00–0:04.0 — "ARE YOU BORED OF THE GYM?" → "WE TURNED IT INTO A VIDEO GAME."
  { kind: "bored", id: "1A", from: 0, dur: f(2), trans: "flash" },
  {
    kind: "phone", id: "1B", from: 0, dur: f(2), trans: "glitch", accent: YELLOW,
    bg: { orbs: [{ x: 540, y: 520, r: 950, c: "#6a2cff", a: 0.55 }, { x: 150, y: 1500, r: 800, c: CYAN, a: 0.38 }, { x: 980, y: 300, r: 650, c: "#ff2d95", a: 0.38 }] },
    title: { lines: ["WE TURNED IT INTO", "A VIDEO GAME."], pos: "top", delays: [0, 14] },
    cam0: C(0, 170, 0.8, 16, -28, -4), cam1: C(0, 50, 1.08, 0, 0, 0),
    clip: "clip01", startSec: 0, rec: 10, slot: "LOG A PERSONAL RECORD → RANK UP", action: "Tap LOG IT. Flash → NEW PR burst → RANK UP overlay.",
    bubbles: [
      { at: 10, x: 260, y: 880, rot: -5, node: <PowerHud at={10} /> },
      { at: 22, x: 850, y: 470, rot: 6, node: <Chip text="RANK UP" icon="bolt" big /> },
      { at: 30, x: 540, y: 1430, node: <TierRow at={30} /> },
    ],
    loop: -1,
  },
  // ───────── 2 TRAIN 0:02.0–0:06.5
  {
    kind: "phone", id: "2A", from: f(2), dur: f(1.5), trans: "push-left", accent: YELLOW,
    bg: orbs({ x: 200, y: 400, r: 800, c: YELLOW, a: 0.38 }, { x: 900, y: 1300, r: 800, c: ORANGE, a: 0.32 }),
    title: { lines: ["LOG EVERY", "LIFT."], pos: "left", size: 170 },
    cam0: C(250, 140, 0.92, 8, -32, 4), cam1: C(215, 90, 1.0, 4, -18, 2),
    clip: "clip04", startSec: 0, rec: 40, slot: "ACTIVE WORKOUT → ADD EXERCISE", action: "Tap + → pick exercise → weight/reps → LOG SET.",
    taps: [{ at: 24, x: 0.5, y: 0.88 }],
    bubbles: [
      {
        at: 8, x: 285, y: 1010, rot: -4,
        node: (
          <Glass pad={34}>
            <div style={{ fontFamily: DISPLAY, fontSize: 250, lineHeight: 0.82, color: YELLOW, textShadow: `0 0 40px ${YELLOW}77` }}>70+</div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 34, letterSpacing: 6 }}>EXERCISES</div>
          </Glass>
        ),
      },
      { at: 22, x: 290, y: 1290, rot: 3, node: <Chip text="LOG SET" icon="check" /> },
    ],
    loop: 0,
  },
  {
    kind: "phone", id: "2B", from: f(3.5), dur: f(1.5), trans: "push-up", accent: YELLOW,
    bg: orbs({ x: 900, y: 300, r: 800, c: YELLOW, a: 0.34 }, { x: 150, y: 1400, r: 900, c: "#ff6a00", a: 0.3 }),
    title: { lines: ["PRE-BUILT SPLITS.", "OR BUILD YOURS."], pos: "top" },
    cam0: C(0, 300, 0.78, 14, 14, 0), cam1: C(0, 250, 0.84, 6, 4, 0),
    clip: "clip03", startSec: 0, rec: 15, slot: "ROUTINES → CREATE SPLIT → NEW SPLIT", action: "START FROM A TEMPLATE / BUILD YOUR OWN → SPLIT TEMPLATES.",
    bubbles: [
      { at: 8, x: 300, y: 1160, rot: -5, node: <Glass pad={34} w={470}><div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 3, lineHeight: 1.2 }}>START FROM A TEMPLATE</div></Glass> },
      { at: 16, x: 790, y: 1300, rot: 5, node: <Glass pad={34} w={400}><div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 3, lineHeight: 1.2 }}>BUILD YOUR OWN</div></Glass> },
    ],
    loop: 0,
  },
  {
    kind: "phone", id: "2C", from: f(5), dur: f(1.5), trans: "wipe", accent: YELLOW,
    bg: orbs({ x: 540, y: 1700, r: 900, c: YELLOW, a: 0.38 }, { x: 900, y: 200, r: 600, c: ORANGE, a: 0.3 }),
    title: { lines: ["A/B WEEKS FLIP", "AUTOMATICALLY."], pos: "bottom", plate: true },
    cam0: C(0, 430, 1.55, 0, 0, 0), cam1: C(0, 380, 1.68, 0, -7, 1),
    clip: "clip03", startSec: 8, rec: 15, slot: "ROUTINES → THIS WEEK", action: "Tap WEEK A, then WEEK B.",
    taps: [{ at: 20, x: 0.7, y: 0.2 }],
    bubbles: [
      { at: 6, x: 540, y: 380, node: <Seg options={["WEEK A", "WEEK B"]} to={1} at={20} accent={YELLOW} w={660} /> },
      { at: 24, x: 830, y: 560, rot: 4, node: <Chip text="AUTO-ALTERNATES" icon="bolt" /> },
    ],
    loop: 0,
  },
  // ───────── 3 TRACK 0:06.5–0:10.0
  {
    kind: "phone", id: "3A", from: f(6.5), dur: f(1.5), trans: "circle", accent: CYAN,
    bg: orbs({ x: 540, y: 800, r: 900, c: CYAN, a: 0.34 }, { x: 100, y: 1500, r: 700, c: "#0a4cff", a: 0.4 }, { x: 960, y: 200, r: 600, c: "#00ffd0", a: 0.22 }),
    title: { lines: ["6 MUSCLE GROUPS.", "6 RANKS."], pos: "top" },
    cam0: C(0, 150, 0.8, 8, -42, 0), cam1: C(0, 150, 0.86, 8, 42, 0),
    clip: "clip05", startSec: 0, rec: 15, slot: "FITNESS → MAP: YOUR STRENGTH MAP", action: "Tap chest, then legs.",
    bubbles: [{ at: 2, x: 540, y: 840, node: <Orbit at={2} /> }],
    loop: 1,
  },
  {
    kind: "phone", id: "3B", from: f(8), dur: f(2), trans: "push-left", accent: CYAN,
    bg: orbs({ x: 850, y: 900, r: 900, c: CYAN, a: 0.3 }, { x: 100, y: 300, r: 700, c: "#ff2d95", a: 0.2 }),
    title: { lines: ["BIG JUMP?", "VIDEO PROOF REQUIRED."], pos: "top" },
    cam0: C(-215, 230, 0.88, 8, 22, -3), cam1: C(-170, 190, 0.94, 4, 12, -1),
    clip: "clip02", startSec: 0, rec: 12, slot: "LOG A PERSONAL RECORD → VERIFICATION REQUIRED", action: "180 × 5 → ESTIMATED 1RM 210 → >15% jump → LOG IT.",
    bubbles: [
      {
        at: 4, x: 330, y: 1300, rot: -4,
        node: (
          <Glass pad={30} w={440}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: CYAN }}>ESTIMATED 1RM</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 150, lineHeight: 0.95 }}>210 <span style={{ fontSize: 56 }}>lbs</span></div>
            <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 26, color: "rgba(255,255,255,0.7)" }}>180 × 5 · EPLEY</div>
          </Glass>
        ),
      },
      {
        at: 20, x: 730, y: 1090, rot: 4,
        node: (
          <Glass pad={32} w={520} tint="linear-gradient(145deg, rgba(250,204,21,0.22), rgba(255,255,255,0))">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Icon name="video" color={YELLOW} size={44} />
              <div style={{ fontFamily: DISPLAY, fontSize: 52, letterSpacing: 3 }}>VERIFICATION REQUIRED</div>
            </div>
            <div style={{ marginTop: 12, fontFamily: BODY, fontWeight: 600, fontSize: 28, lineHeight: 1.3, color: "rgba(255,255,255,0.85)" }}>Upload a video of the lift.</div>
          </Glass>
        ),
      },
    ],
    loop: 1,
  },
  // ───────── 4 FUEL 0:10.0–0:13.0
  {
    kind: "phone", id: "4A", from: f(10), dur: f(1), trans: "zoom", accent: ORANGE,
    bg: orbs({ x: 200, y: 900, r: 900, c: ORANGE, a: 0.42 }, { x: 950, y: 300, r: 700, c: YELLOW, a: 0.3 }),
    title: { lines: ["SET YOUR", "GOAL."], pos: "left", size: 190 },
    cam0: C(0, 900, 1.0, 22, 0, 0), cam1: C(0, 820, 1.04, 14, 0, 0),
    clip: "clip06", startSec: 0, rec: 30, slot: "NUTRITION → GOALS", action: "Tap GOAL: LOSE → TARGET appears.",
    bubbles: [{ at: 4, x: 540, y: 1080, node: <Seg options={["LOSE", "MAINTAIN", "GAIN"]} to={0} at={8} accent={ORANGE} w={860} /> }],
    loop: 2,
  },
  {
    kind: "phone", id: "4B", from: f(11), dur: f(1), trans: "push-left", accent: ORANGE,
    bg: orbs({ x: 850, y: 800, r: 850, c: ORANGE, a: 0.4 }, { x: 100, y: 1500, r: 700, c: YELLOW, a: 0.28 }),
    title: { lines: ["TRACK YOUR", "MACROS."], pos: "top" },
    cam0: C(0, 320, 0.8, 10, -10, 0), cam1: C(0, 300, 0.84, 6, 8, 0), phoneOpacity: 0.55,
    clip: "clip06", startSec: 15, rec: 30, slot: "NUTRITION → DIARY", action: "ADD FOOD → CALORIES REMAINING + PROTEIN / CARBS / FAT.",
    bubbles: [
      {
        at: 2, x: 540, y: 1010,
        node: (
          <Glass w={820} pad={38}>
            <RingStat pct={72} at={4} label={"CALORIES\nREMAINING"} accent={ORANGE} />
            <div style={{ marginTop: 28, display: "grid", gap: 20 }}>
              <Bar label="PROTEIN" pct={78} at={8} color={YELLOW} />
              <Bar label="CARBS" pct={55} at={11} color={CYAN} />
              <Bar label="FAT" pct={40} at={14} color="#ffffff" />
            </div>
          </Glass>
        ),
      },
    ],
    loop: 2,
  },
  {
    kind: "phone", id: "4C", from: f(12), dur: f(1), trans: "flash", accent: YELLOW,
    bg: orbs({ x: 540, y: 900, r: 950, c: YELLOW, a: 0.5 }, { x: 100, y: 200, r: 600, c: ORANGE, a: 0.4 }),
    title: { lines: ["HIT YOUR", "GOAL."], pos: "top" },
    cam0: C(0, 300, 0.76, 8, 14, 3), cam1: C(0, 280, 0.8, 4, 0, 0), phoneOpacity: 0.5,
    clip: "clip07", startSec: 0, rec: 12, slot: "LOG A WEIGH-IN → GOAL REACHED", action: "Header pill → LOG A WEIGH-IN → SAVE → GOAL REACHED / YOU DID IT.",
    bubbles: [
      {
        at: 3, x: 540, y: 1000,
        node: (
          <Glass w={780} pad={40} tint="linear-gradient(145deg, rgba(250,204,21,0.28), rgba(255,255,255,0))" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 150, lineHeight: 0.9, color: YELLOW, textShadow: `0 0 50px ${YELLOW}88` }}>GOAL REACHED</div>
            <div style={{ marginTop: 8, fontFamily: DISPLAY, fontSize: 70, letterSpacing: 6 }}>YOU DID IT.</div>
          </Glass>
        ),
      },
      { at: 3, x: 540, y: 1000, node: <Sparks at={3} color={YELLOW} /> },
    ],
    loop: 2,
  },
  // ───────── 5 COMMUNITY 0:13.0–0:17.5
  {
    kind: "phone", id: "5A", from: f(13), dur: f(1.5), trans: "push-up", accent: VIOLET,
    bg: orbs({ x: 150, y: 600, r: 850, c: VIOLET, a: 0.42 }, { x: 950, y: 1400, r: 800, c: "#ff2d95", a: 0.28 }),
    title: { lines: ["YOUR WORKOUTS", "HIT THE FEED."], pos: "left", size: 150 },
    cam0: C(360, 260, 0.9, 6, -30, 5), cam1: C(330, 220, 0.96, 4, -18, 3),
    clip: "clip08", startSec: 0, rec: 10, slot: "SOCIAL → SHELLSHOCK ACADEMY", action: "Workout recap post → tap one reaction.",
    bubbles: [{ at: 6, x: 520, y: 1120, rot: -2, node: <PostCard at={6} accent={VIOLET} /> }],
    loop: 3,
  },
  {
    kind: "phone", id: "5B", from: f(14.5), dur: f(1), trans: "wipe", accent: VIOLET,
    bg: orbs({ x: 900, y: 500, r: 850, c: VIOLET, a: 0.4 }, { x: 150, y: 1450, r: 800, c: CYAN, a: 0.26 }),
    title: { lines: ["PUBLIC", "PROFILES."], pos: "top" },
    cam0: C(0, 330, 0.74, 6, 20, 0), cam1: C(0, 300, 0.8, 4, -6, 0), phoneOpacity: 0.7,
    clip: "clip09", startSec: 0, rec: 10, slot: "PUBLIC PROFILE", action: "Slow scroll: cover, badge, THIS WEEK'S LIFTS, MUSCLE RANKS.",
    bubbles: [
      { at: 2, x: 330, y: 980, rot: -5, node: <Chip text="THIS WEEK'S LIFTS" icon="flame" color={VIOLET} /> },
      { at: 7, x: 760, y: 1110, rot: 4, node: <Chip text="MUSCLE RANKS" icon="bolt" color={CYAN} /> },
      { at: 12, x: 400, y: 1250, rot: -3, node: <Chip text="BADGES EARNED" icon="check" color={YELLOW} /> },
    ],
    loop: 3,
  },
  {
    kind: "phone", id: "5C", from: f(15.5), dur: f(1), trans: "circle", accent: YELLOW,
    bg: orbs({ x: 540, y: 1000, r: 900, c: YELLOW, a: 0.36 }, { x: 100, y: 200, r: 700, c: VIOLET, a: 0.34 }),
    title: { lines: ["JOIN COMMUNITY", "CHALLENGES."], pos: "top" },
    cam0: C(0, 330, 0.74, 8, -14, 0), cam1: C(0, 300, 0.8, 4, 6, 0), phoneOpacity: 0.55,
    clip: "clip10", startSec: 0, rec: 8, slot: "CHALLENGES", action: "Tap JOIN CHALLENGE.",
    bubbles: [{ at: 2, x: 540, y: 1050, node: <JoinCard at={2} /> }],
    loop: 4,
  },
  {
    kind: "phone", id: "5D", from: f(16.5), dur: f(1), trans: "push-left", accent: VIOLET,
    bg: orbs({ x: 200, y: 1100, r: 850, c: VIOLET, a: 0.4 }, { x: 900, y: 300, r: 700, c: "#ff2d95", a: 0.3 }),
    title: { lines: ["ADD FRIENDS.", "SEND DMS."], pos: "top" },
    cam0: C(0, 320, 0.76, 6, 18, -3), cam1: C(0, 290, 0.82, 4, 0, 0), phoneOpacity: 0.55,
    clip: "clip11", startSec: 0, rec: 12, slot: "FRIEND PROFILE → MESSAGE → DM", action: "Tap MESSAGE → type + send.",
    bubbles: [
      { at: 2, x: 300, y: 1060, rot: -4, node: <Glass pad={28} radius={999} tint={`linear-gradient(145deg, ${YELLOW}55, ${YELLOW}11)`}><span style={{ fontFamily: DISPLAY, fontSize: 56, letterSpacing: 4 }}>ADD FRIEND</span></Glass> },
      { at: 8, x: 790, y: 1200, rot: 4, node: <Glass pad={28} radius={999}><span style={{ fontFamily: DISPLAY, fontSize: 56, letterSpacing: 4 }}>MESSAGE</span></Glass> },
    ],
    loop: 3,
  },
  // ───────── 6 THE TURN 0:17.5–0:20.5
  { kind: "turnA", id: "6A", from: f(17.5), dur: f(1.5), trans: "zoom" },
  { kind: "turnB", id: "6B", from: f(19), dur: f(1.5), trans: "wipe" },
  // ───────── 7 OFFER + OUTRO — "FIRST 200 MEMBERS: FREE FOR LIFE."
  { kind: "offer", id: "7A", from: 0, dur: f(2.5), trans: "circle" },
  { kind: "cta", id: "7B", from: 0, dur: f(2), trans: "flash" },
];

/** Beats are contiguous: start frames come from the running sum of durations. */
export const TIMELINE: Beat[] = (() => {
  let t = 0;
  return BEATS.map((b) => {
    const nb = { ...b, from: t } as Beat;
    t += b.dur;
    return nb;
  });
})();
export const INSIDE_DURATION = BEATS.reduce((sum, b) => sum + b.dur, 0);

/* ───────────────────────── background / fx ───────────────────────── */

const Backdrop: React.FC<{ bg: Bg; accent?: string }> = ({ bg, accent = YELLOW }) => {
  const frame = useCurrentFrame();
  const primary = accent === CYAN ? CYAN : YELLOW;
  const secondary = primary === CYAN ? YELLOW : CYAN;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #121214 0%, #050506 45%, #000000 100%)", overflow: "hidden" }}>
      {bg.orbs.slice(0, 3).map((o, i) => {
        const dx = Math.sin(frame / 46 + i * 1.7) * 70;
        const dy = Math.cos(frame / 53 + i * 2.3) * 60;
        const c = i === 0 ? primary : secondary;
        const a = (i === 0 ? 0.32 : 0.2);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: o.x + dx - o.r, top: o.y + dy - o.r, width: o.r * 2, height: o.r * 2, borderRadius: "50%",
              background: `radial-gradient(circle, ${c} 0%, ${c}00 66%)`, opacity: a,
            }}
          />
        );
      })}
      {bg.rays && (
        <div
          style={{
            position: "absolute", left: 540 - 1500, top: 780 - 1500, width: 3000, height: 3000, opacity: 0.16,
            background: `repeating-conic-gradient(from ${frame * 1.2}deg, ${YELLOW}aa 0deg 6deg, transparent 6deg 22deg)`,
            maskImage: "radial-gradient(circle, #000 0%, transparent 46%)",
            WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 46%)",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const j = Math.floor(frame / 2) % 7;
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("fx/grain.png")})`, backgroundSize: "384px 384px",
          backgroundPosition: `${j * 61}px ${j * 37}px`, opacity: 0.09, mixBlendMode: "overlay", pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }}
      />
    </>
  );
};

/* ───────────────────────── phone ───────────────────────── */

const PW = 560;
const PH = 1212;

const GhostScreen: React.FC<{ beat: PhoneBeat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #14110a 0%, #0a0a0c 60%)", padding: "96px 34px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
      {[0.8, 1, 0.65, 0.9, 0.55].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? 70 : 90, width: `${w * 100}%`, borderRadius: 22, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }} />
      ))}
      <div style={{ marginTop: "auto", textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 46, letterSpacing: 4, color: beat.accent, display: "inline-flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: blink ? "#ff2a2a" : "#551010", display: "inline-block" }} />
          RECORD {beat.clip.toUpperCase().replace("CLIP", "CLIP ")}
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 40, lineHeight: 1.02, letterSpacing: 2, marginTop: 10 }}>{beat.slot}</div>
        <div style={{ fontFamily: BODY, fontSize: 23, color: "#aaa", marginTop: 10, lineHeight: 1.3 }}>{beat.action}</div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 21, letterSpacing: 4, color: CYAN, marginTop: 12 }}>FILM ~{beat.rec}s</div>
      </div>
    </div>
  );
};

const Phone: React.FC<{ beat: PhoneBeat; frame: number; hasClip: boolean }> = ({ beat, frame, hasClip }) => {
  const p = interpolate(frame, [0, beat.dur], [0, 1], { ...cl, easing: ezIO });
  const L = (a: number, b: number) => a + (b - a) * p;
  const c = beat.cam0, d = beat.cam1;
  const fl = Math.sin(frame / 14) * 7;
  const sheen = interpolate(L(c.ry, d.ry), [-45, 45], [-60, 160]);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1900, perspectiveOrigin: "50% 42%", opacity: beat.phoneOpacity ?? 1 }}>
      <div
        style={{
          position: "absolute", left: 540 - PW / 2, top: 780 - PH / 2, width: PW, height: PH, borderRadius: 78,
          transform: `translate3d(${L(c.x, d.x)}px, ${L(c.y, d.y) + fl}px, 0) rotateX(${L(c.rx, d.rx)}deg) rotateY(${L(c.ry, d.ry)}deg) rotateZ(${L(c.rz, d.rz)}deg) scale(${L(c.s, d.s)})`,
          background: "linear-gradient(145deg, #4a4a52, #0b0b0e 45%, #2a2a30)", padding: 5,
          boxShadow: `0 60px 120px rgba(0,0,0,0.7), 0 0 90px ${beat.accent}30, inset 0 0 0 2px rgba(255,255,255,0.18)`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 73, overflow: "hidden", background: "#000", border: "9px solid #050505" }}>
          {hasClip ? (
            <OffthreadVideo src={staticFile(`clips/${beat.clip}.mp4`)} startFrom={Math.round(beat.startSec * 30)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <GhostScreen beat={beat} />
          )}
          {(beat.taps ?? []).map((t, i) => {
            const k = frame - t.at;
            if (k < 0 || k > 14) return null;
            const q = k / 14;
            return (
              <div key={i} style={{ position: "absolute", left: `${t.x * 100}%`, top: `${t.y * 100}%`, width: 0, height: 0 }}>
                <div style={{ position: "absolute", left: -90 * q - 18, top: -90 * q - 18, width: 180 * q + 36, height: 180 * q + 36, borderRadius: "50%", border: "5px solid rgba(255,255,255,0.85)", opacity: 1 - q }} />
                <div style={{ position: "absolute", left: -26, top: -26, width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.55)", transform: `scale(${1 - q * 0.4})`, opacity: 1 - q * 0.6 }} />
              </div>
            );
          })}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${sheen - 22}%, rgba(255,255,255,0.14) ${sheen}%, transparent ${sheen + 22}%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 16, left: "50%", marginLeft: -56, width: 112, height: 32, borderRadius: 16, background: "#000" }} />
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── titles / bubbles / loop ───────────────────────── */

const Title: React.FC<{ spec: TitleSpec; accent: string; start?: number }> = ({ spec, accent, start = 0 }) => {
  const frame = useCurrentFrame() - start;
  const longest = Math.max(...spec.lines.map((l) => l.length));
  const auto = Math.min(150, 940 / (longest * 0.42));
  const size = spec.size ?? auto;
  const left = spec.pos === "left";
  const top = spec.pos === "top" ? 130 : spec.pos === "left" ? 330 : 1190;
  const lineH = size * 0.95;
  const total = lineH * spec.lines.length;
  return (
    <div
      style={{
        position: "absolute", top, left: left ? 64 : 0, right: left ? undefined : 0,
        display: "flex", flexDirection: "column", alignItems: left ? "flex-start" : "center", gap: 0,
      }}
    >
      {spec.plate && (
        <div
          style={{
            position: "absolute", left: 40, right: 40, top: -20, height: total + 40, borderRadius: 46,
            background: "linear-gradient(145deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25))", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1.5px solid rgba(255,255,255,0.22)", opacity: interpolate(frame, [0, 6], [0, 1], cl),
          }}
        />
      )}
      {spec.lines.map((line, li) => {
        const delay = (spec.delays?.[li] ?? 0) + li * 4;
        const words = line.split(" ");
        const last = li === spec.lines.length - 1 && spec.lines.length > 1;
        return (
          <div key={li} style={{ display: "flex", gap: size * 0.22, position: "relative", height: lineH, alignItems: "center" }}>
            {words.map((w, wi) => {
              const k = pop(frame, delay + wi * 3, 12, 170);
              return (
                <span
                  key={wi}
                  style={{
                    display: "inline-block", fontFamily: DISPLAY, fontSize: size, lineHeight: 1, letterSpacing: 2, whiteSpace: "nowrap",
                    color: last ? accent : "#fff", opacity: Math.min(1, k * 1.4),
                    transform: `translateY(${(1 - k) * 60}px) scale(${0.85 + k * 0.15})`,
                    textShadow: last ? `0 0 50px ${accent}99, 0 6px 30px #000` : "0 6px 30px rgba(0,0,0,0.7)",
                  }}
                >
                  {w}
                </span>
              );
            })}
            {last && (
              <div
                style={{
                  position: "absolute", left: 0, bottom: -2, height: 10, borderRadius: 5, background: accent, boxShadow: `0 0 24px ${accent}`,
                  width: `${interpolate(frame, [delay + 8, delay + 22], [0, 100], { ...cl, easing: ez })}%`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const BubbleView: React.FC<{ b: Bub }> = ({ b }) => {
  const frame = useCurrentFrame();
  const k = pop(frame, b.at, 12, 140);
  if (frame < b.at) return null;
  const seed = b.x * 0.013 + b.y * 0.007;
  const bob = Math.sin(frame / 16 + seed) * 8;
  return (
    <div
      style={{
        position: "absolute", left: b.x, top: b.y + bob,
        transform: `translate(-50%, -50%) translateY(${(1 - k) * 70}px) rotate(${(b.rot ?? 0) * (0.4 + 0.6 * k)}deg) scale(${0.6 + 0.4 * k})`,
        opacity: Math.min(1, k * 1.5),
      }}
    >
      {b.node}
    </div>
  );
};

const LoopTracker: React.FC<{ active: number; accent: string }> = ({ active, accent }) => {
  const names = ["TRAIN", "TRACK", "FUEL", "COMMUNITY", "CHALLENGE"];
  return (
    <div style={{ position: "absolute", top: 1480, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 12 }}>
      {names.map((n, i) => {
        const on = i === active;
        return (
          <div
            key={n}
            style={{
              height: 44, minWidth: on ? 0 : 44, padding: on ? "0 24px" : 0, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center",
              background: on ? accent : "rgba(255,255,255,0.12)", border: `1.5px solid ${on ? accent : "rgba(255,255,255,0.2)"}`,
              boxShadow: on ? `0 0 28px ${accent}aa` : "none", fontFamily: DISPLAY, fontSize: 30, letterSpacing: 4, color: "#0A0A0A",
            }}
          >
            {on ? n : ""}
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────── beat views ───────────────────────── */

const PhoneBeatView: React.FC<{ beat: PhoneBeat; clips: Record<string, boolean> }> = ({ beat, clips }) => {
  const frame = useCurrentFrame();
  const t2 = beat.title2 && frame >= beat.title2.at;
  return (
    <AbsoluteFill>
      <Backdrop bg={beat.bg} accent={beat.accent} />
      <Phone beat={beat} frame={frame} hasClip={!!clips[beat.clip]} />
      {beat.bubbles.map((b, i) => (
        <BubbleView key={i} b={b} />
      ))}
      {t2 ? (
        <Title key="t2" spec={beat.title2!.spec} accent={beat.accent} start={beat.title2!.at} />
      ) : (
        <Title key="t1" spec={beat.title} accent={beat.accent} />
      )}
      {beat.loop >= 0 && <LoopTracker active={beat.loop} accent={beat.accent} />}
    </AbsoluteFill>
  );
};

const Word: React.FC<{ w: string; frame: number; at: number; size: number; color: string }> = ({ w, frame, at, size, color }) => {
  const k = pop(frame, at, 11, 180);
  return (
    <span style={{ display: "inline-block", fontFamily: DISPLAY, fontSize: size, lineHeight: 0.92, letterSpacing: 2, color, opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * 90}px) scale(${0.8 + k * 0.2})` }}>
      {w}
    </span>
  );
};

const TurnA: React.FC = () => {
  const frame = useCurrentFrame();
  const words = ["OTHER", "APPS", "LOG", "YOUR", "LIFTS."];
  const strike = interpolate(frame, [33, 43], [0, 1], { ...cl, easing: ez });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #131315 0%, #000000 100%)" }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 80% 85%, rgba(0,207,255,0.14) 0%, rgba(0,0,0,0) 55%)" }} />
      <div style={{ position: "absolute", left: 80, top: 520, right: 80, display: "flex", flexWrap: "wrap", gap: "0 34px" }}>
        {words.map((w, i) => (
          <Word key={w} w={w} frame={frame} at={i * 3} size={230} color="#ffffff" />
        ))}
        <div style={{ position: "absolute", left: -20, top: "56%", height: 26, width: `${strike * 108}%`, background: YELLOW, transform: "rotate(-3deg)", transformOrigin: "left center", boxShadow: `0 0 36px ${YELLOW}` }} />
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

const TurnB: React.FC = () => {
  const frame = useCurrentFrame();
  const words = ["THIS", "ONE", "MAKES", "THEM", "COUNT."];
  const rise = pop(frame, 10, 14, 90);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #FFE15A, ${YELLOW} 55%, #E0A800)` }}>
      <div style={{ position: "absolute", left: 540 - 300, top: 1180 + (1 - rise) * 600, width: 600, height: 600, opacity: 0.95 }}>
        <Badge img="legendary" glow={RED} size={600} />
      </div>
      <div style={{ position: "absolute", left: 80, top: 330, right: 80, display: "flex", flexWrap: "wrap", gap: "0 34px" }}>
        {words.map((w, i) => (
          <Word key={w} w={w} frame={frame} at={i * 3} size={235} color="#0A0A0A" />
        ))}
      </div>
      <Finish />
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const k = pop(frame, 0, 12, 120);
  const glow = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <AbsoluteFill>
      <Backdrop bg={{ orbs: [{ x: 540, y: 700, r: 1000, c: YELLOW, a: 0.55 }, { x: 100, y: 1600, r: 800, c: ORANGE, a: 0.4 }, { x: 980, y: 200, r: 700, c: RED, a: 0.3 }], rays: YELLOW }} accent={YELLOW} />
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 0, transform: `scale(${0.7 + 0.3 * k})`, opacity: k }}>
        {TIERS.map((t, i) => (
          <div key={t} style={{ marginLeft: i ? -40 : 0, transform: `translateY(${Math.sin(frame / 12 + i) * 10}px)` }}>
            <Badge img={t} glow={TIER_GLOW[i]} size={i === 7 ? 190 : 150} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 760, width: "100%", textAlign: "center", whiteSpace: "nowrap", transform: `scale(${0.85 + 0.15 * k})`, opacity: k }}>
        <div style={{ fontFamily: LOGO, fontStyle: "italic", fontSize: 112, letterSpacing: 3, lineHeight: 1, color: "#fff", textShadow: "0 10px 50px rgba(0,0,0,0.6)" }}>SHELL SHOCK</div>
        <div style={{ fontFamily: LOGO, fontStyle: "italic", fontSize: 60, letterSpacing: 32, marginTop: 12, marginRight: -32, color: YELLOW }}>trainer</div>
      </div>
      <div style={{ position: "absolute", top: 1090, width: "100%", display: "flex", justifyContent: "center", transform: `translateY(${(1 - pop(frame, 8, 12, 140)) * 80}px)`, opacity: pop(frame, 8, 12, 140) }}>
        <Glass pad={0} radius={36} style={{ background: YELLOW, border: "none", boxShadow: `0 0 ${50 + glow * 50}px ${YELLOW}aa, 0 30px 70px rgba(0,0,0,0.5)` }}>
          <div style={{ padding: "28px 80px", fontFamily: DISPLAY, fontSize: 96, letterSpacing: 5, color: "#0A0A0A" }}>DOWNLOAD FREE</div>
        </Glass>
      </div>
      <div style={{ position: "absolute", top: 1275, width: "100%", textAlign: "center", fontFamily: DISPLAY, fontSize: 66, letterSpacing: 12, color: "#fff", opacity: pop(frame, 14, 12, 140) }}>ON THE APP STORE</div>
      <Finish />
    </AbsoluteFill>
  );
};

/* ───────────────────────── hook + offer ───────────────────────── */

/** 1A — the boring gym: flat, muted, sluggish. Cuts away on a glitch. */
const Bored: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [["ARE", "YOU", "BORED"], ["OF", "THE", "GYM?"]];
  const drift = 1 + frame * 0.0006;
  const draw = interpolate(frame, [4, 44], [0, 1080], { ...cl });
  const blip = interpolate(frame, [46, 50, 54, 58], [0, 1, -1, 0], cl);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #17181b 0%, #000000 100%)" }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.05), rgba(0,0,0,0) 60%)" }} />
      <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${drift})` }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 40 }}>
            {row.map((w, wi) => {
              const k = pop(frame, 4 + (ri * 3 + wi) * 6, 26, 55); // slow, heavy
              return (
                <span
                  key={w}
                  style={{
                    fontFamily: DISPLAY, fontSize: 230, lineHeight: 0.98, letterSpacing: 2, color: ri === 1 ? "#9aa0aa" : "#cfd3da",
                    opacity: Math.min(1, k * 1.2), transform: `translateY(${(1 - k) * 30}px)`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <svg width="1080" height="240" style={{ position: "absolute", top: 1180, left: 0 }}>
        <defs>
          <clipPath id="fl"><rect x="0" y="0" width={draw} height="240" /></clipPath>
        </defs>
        <path
          clipPath="url(#fl)"
          d={`M0 120 L430 120 L470 ${120 - 20 * blip} L500 ${120 + 38 * blip} L530 120 L1080 120`}
          fill="none" stroke="#6b7078" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <Finish />
    </AbsoluteFill>
  );
};

const DotGrid: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const cols = 20, rows = 10, d = 34, gap = 14;
  return (
    <div style={{ position: "absolute", left: (1080 - (cols * d + (cols - 1) * gap)) / 2, top: 900, display: "grid", gridTemplateColumns: `repeat(${cols}, ${d}px)`, gap }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const k = pop(frame, at + i * 0.22, 14, 200);
        return (
          <div
            key={i}
            style={{
              width: d, height: d, borderRadius: d / 2, transform: `scale(${k})`, opacity: Math.min(1, k * 1.5),
              background: `radial-gradient(circle at 35% 30%, #fff, ${YELLOW} 55%, #E0A800)`, boxShadow: `0 0 16px ${YELLOW}99`,
            }}
          />
        );
      })}
    </div>
  );
};

/** 7A — the offer: FIRST 200 MEMBERS: FREE FOR LIFE. */
const Offer: React.FC = () => {
  const frame = useCurrentFrame();
  const k = pop(frame, 2, 12, 120);
  return (
    <AbsoluteFill>
      <Backdrop bg={{ orbs: [{ x: 540, y: 800, r: 1000, c: YELLOW, a: 0.5 }, { x: 100, y: 1600, r: 800, c: ORANGE, a: 0.42 }, { x: 980, y: 250, r: 700, c: RED, a: 0.3 }], rays: YELLOW }} accent={YELLOW} />
      <Title spec={{ lines: ["FIRST 200 MEMBERS", "FREE FOR LIFE."], pos: "top" }} accent={YELLOW} />
      <div
        style={{
          position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: DISPLAY, fontSize: 380, lineHeight: 1, letterSpacing: 6,
          background: `linear-gradient(180deg, #fff, ${YELLOW} 70%)`, WebkitBackgroundClip: "text", color: "transparent",
          filter: `drop-shadow(0 0 50px ${YELLOW}aa)`, transform: `scale(${0.7 + 0.3 * k})`, opacity: k,
        }}
      >
        200
      </div>
      <DotGrid at={10} />
      <Finish />
    </AbsoluteFill>
  );
};

/* ───────────────────────── transitions ───────────────────────── */

const N = 9; // transition length in frames

const Stage: React.FC<{ enter: Trans; exit: Trans | null; dur: number; children: React.ReactNode }> = ({ enter, exit, dur, children }) => {
  const frame = useCurrentFrame();
  const pin = interpolate(frame, [0, N], [0, 1], { ...cl, easing: ezIO });
  const pout = exit ? interpolate(frame, [dur, dur + N], [0, 1], { ...cl, easing: ezIO }) : 0;
  const t: string[] = [];
  const fl: string[] = [];
  let clip: string | undefined;
  let opacity = 1;
  let overlay: React.ReactNode = null;

  // incoming
  if (pin < 1) {
    const q = 1 - pin;
    if (enter === "push-left") { t.push(`translateX(${q * 1080}px)`); fl.push(`blur(${q * 14}px)`); }
    if (enter === "push-up") { t.push(`translateY(${q * 1920}px)`); fl.push(`blur(${q * 14}px)`); }
    if (enter === "zoom") { t.push(`scale(${0.78 + pin * 0.22})`); opacity = Math.min(1, pin * 1.6); fl.push(`blur(${q * 10}px)`); }
    if (enter === "circle") clip = `circle(${pin * 1700}px at 50% 55%)`;
    if (enter === "wipe") {
      const X = pin * 150 - 20;
      clip = `polygon(0 0, ${X + 18}% 0, ${X - 6}% 100%, 0 100%)`;
      overlay = (
        <div style={{ position: "absolute", top: -100, bottom: -100, left: `${X - 4}%`, width: 70, background: `linear-gradient(90deg, transparent, ${YELLOW}, #fff)`, transform: "skewX(-14deg)", filter: "blur(2px)", opacity: pin < 1 ? 1 : 0 }} />
      );
    }
    if (enter === "flash") { fl.push(`brightness(${1 + q * 2.4})`); overlay = <AbsoluteFill style={{ background: "#fff", opacity: q * 0.7 }} />; }
    if (enter === "glitch") {
      t.push(`translateX(${Math.sin(frame * 7) * 46 * q}px)`);
      fl.push(`contrast(${1 + q * 0.8}) brightness(${1 + q * 0.5})`);
      overlay = (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: 0, right: 0, top: `${(i * 23 + (frame * 17) % 37) % 100}%`, height: `${3 + ((i * 7) % 4) * 5}%`,
                background: i % 2 ? CYAN : YELLOW, opacity: q * 0.6, mixBlendMode: "screen", transform: `translateX(${(i % 2 ? -1 : 1) * q * 120}px)`,
              }}
            />
          ))}
        </>
      );
    }
  }
  // outgoing (driven by the next beat's transition)
  if (exit && pout > 0) {
    if (exit === "push-left") { t.push(`translateX(${-pout * 280}px) scale(${1 - pout * 0.05})`); fl.push(`blur(${pout * 6}px) brightness(${1 - pout * 0.45})`); }
    if (exit === "push-up") { t.push(`translateY(${-pout * 360}px) scale(${1 - pout * 0.05})`); fl.push(`blur(${pout * 6}px) brightness(${1 - pout * 0.45})`); }
    if (exit === "zoom") { t.push(`scale(${1 + pout * 0.45})`); opacity = 1 - pout; fl.push(`blur(${pout * 12}px)`); }
    if (exit === "circle" || exit === "wipe") { t.push(`scale(${1 - pout * 0.06})`); fl.push(`brightness(${1 - pout * 0.5})`); }
    if (exit === "flash") fl.push(`brightness(${1 + pout * 1.2})`);
    if (exit === "glitch") { t.push(`translateX(${Math.sin(frame * 9) * 36 * pout}px)`); fl.push(`contrast(${1 + pout * 1.2}) brightness(${1 + pout * 0.4})`); }
  }
  return (
    <AbsoluteFill style={{ transform: t.join(" ") || undefined, filter: fl.join(" ") || undefined, clipPath: clip, opacity }}>
      {children}
      {overlay}
    </AbsoluteFill>
  );
};

/* ───────────────────────── composition ───────────────────────── */

export type InsideProps = { clips: Record<string, boolean> };

export const EverythingInside: React.FC<InsideProps> = ({ clips }) => (
  <AbsoluteFill style={{ background: INK }}>
    {TIMELINE.map((b, i) => {
      const next = TIMELINE[i + 1];
      const hasNext = !!next;
      return (
        <Sequence key={b.id} from={b.from} durationInFrames={b.dur + (hasNext ? N : 0)} layout="none">
          <Stage enter={b.trans} exit={next ? next.trans : null} dur={b.dur}>
            {b.kind === "phone" ? <><PhoneBeatView beat={b} clips={clips} /><Finish /></> : b.kind === "bored" ? <Bored /> : b.kind === "offer" ? <Offer /> : b.kind === "turnA" ? <TurnA /> : b.kind === "turnB" ? <TurnB /> : <Cta />}
          </Stage>
        </Sequence>
      );
    })}
    <Audio src={staticFile("audio/inside-music.wav")} />
  </AbsoluteFill>
);
