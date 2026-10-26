import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";

// Real fonts and badges pulled from the live Shell Shock Trainer app.
loadFont({
  family: "Bebas Neue",
  url: staticFile("trainer/bebas-neue-latin.woff2"),
  weight: "400",
});
loadFont({
  family: "DM Sans",
  url: staticFile("trainer/dm-sans-latin.woff2"),
  weight: "100 1000",
});
loadFont({
  family: "Robot Reavers",
  url: staticFile("trainer/Robot_Reavers_Italic.woff2"),
  weight: "400",
  style: "italic",
});

const YELLOW = "#FACC15";
const CYAN = "#00CFFF";
const BG = "#000000";
const DISPLAY = "'Bebas Neue', Impact, sans-serif";
const BODY = "'DM Sans', system-ui, sans-serif";
const LOGO = "'Robot Reavers', 'Bebas Neue', Impact, sans-serif";

// Tier names, score ranges and glow colors come straight from the app.
const TIERS = [
  { name: "RUST MORTAL", range: "0–130", img: "rust", glow: "#b0541f" },
  { name: "BRONZE MORTAL", range: "131–260", img: "bronze", glow: "#FFB347" },
  { name: "SILVER HERO", range: "261–391", img: "silver", glow: CYAN },
  { name: "GOLD WARRIOR", range: "392–521", img: "gold", glow: "#FFD700" },
  { name: "PLATINUM DEMIGOD", range: "522–652", img: "platinum", glow: CYAN },
  { name: "DIAMOND TITAN", range: "653–782", img: "diamond", glow: "#8B00FF" },
  { name: "MYTHIC OLYMPIAN", range: "783–913", img: "mythic", glow: "#d36bff" },
  {
    name: "LEGENDARY PANTHEON",
    range: "914–1000",
    img: "legendary",
    glow: "#ff3b1a",
  },
] as const;

// 15 frames = one beat at 120 bpm, so every cut lands on the music grid.
const S1 = 60;
const S2 = 135;
const S3 = 105;
const S4 = 105;
const S5 = 120;
const S6 = 120;
export const TRAINER_DURATION = S1 + S2 + S3 + S4 + S5 + S6; // 645 = 21.5s

const T1 = 0;
const T2 = T1 + S1;
const T3 = T2 + S2;
const T4 = T3 + S3;
const T5 = T4 + S4;
const T6 = T5 + S5;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Fades the scene through black at its edges. */
const Scene: React.FC<{
  from: number;
  duration: number;
  children: React.ReactNode;
}> = ({ from, duration, children }) => (
  <Sequence from={from} durationInFrames={duration} layout="none">
    <SceneInner duration={duration}>{children}</SceneInner>
  </Sequence>
);

const SceneInner: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 5, duration - 6, duration - 1], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const sparks = Array.from({ length: 34 }, (_, i) => {
    const x = random(`x${i}`) * 1080;
    const speed = 0.8 + random(`s${i}`) * 2.2;
    const size = 3 + random(`z${i}`) * 7;
    const phase = random(`p${i}`) * 2200;
    const y = 2100 - ((f * speed * 3 + phase) % 2300);
    const o = 0.15 + random(`o${i}`) * 0.5;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: "50%",
          background: i % 5 === 0 ? CYAN : YELLOW,
          opacity: o,
          boxShadow: `0 0 ${size * 3}px ${i % 5 === 0 ? CYAN : YELLOW}`,
        }}
      />
    );
  });
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Img
        src={staticFile("trainer/site-bg.webp")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.42,
          transform: `scale(${1.08 + f * 0.00012})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 85%)",
        }}
      />
      {sparks}
    </AbsoluteFill>
  );
};

export const Badge: React.FC<{
  img: string;
  glow: string;
  size: number;
  scale?: number;
  style?: React.CSSProperties;
}> = ({ img, glow, size, scale = 1, style }) => (
  <div
    style={{
      position: "relative",
      width: size,
      height: size,
      transform: `scale(${scale})`,
      filter: `drop-shadow(0 0 ${size * 0.06}px ${glow}) drop-shadow(0 0 ${size * 0.16}px ${glow}77)`,
      ...style,
    }}
  >
    <Img
      src={staticFile(`trainer/${img}.webp`)}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size * 2.15,
        height: size * 2.15,
        maxWidth: "none",
        maxHeight: "none",
        marginLeft: -size * 1.075,
        marginTop: -size * 1.075,
        objectFit: "contain",
      }}
    />
  </div>
);

const Flash: React.FC<{
  at: number;
  color?: string;
  len?: number;
  peak?: number;
}> = ({ at, color = "#fff", len = 9, peak = 0.3 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 2, at + len], [0, peak, 0], clamp);
  return (
    <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen" }} />
  );
};

// ───────────────────────── Scene 1 · Hook ─────────────────────────
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 12, stiffness: 140 } });
  const line1 = interpolate(f, [4, 14], [0, 1], { ...clamp, easing: ease });
  const line2 = interpolate(f, [12, 22], [0, 1], { ...clamp, easing: ease });
  const sub = interpolate(f, [26, 38], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 300, opacity: pop }}>
        <Badge img="rust" glow="#b0541f" size={500} scale={0.6 + pop * 0.4} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 940,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 250,
          lineHeight: 0.9,
          letterSpacing: 4,
          color: "#fff",
        }}
      >
        <div
          style={{
            opacity: line1,
            transform: `translateY(${(1 - line1) * 60}px)`,
          }}
        >
          EARN YOUR
        </div>
        <div
          style={{
            opacity: line2,
            transform: `translateY(${(1 - line2) * 60}px)`,
            color: YELLOW,
            textShadow: `0 0 50px ${YELLOW}88`,
          }}
        >
          RANK.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1480,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 54,
          letterSpacing: 8,
          color: "#fff",
          opacity: sub * 0.85,
        }}
      >
        RUST MORTAL <span style={{ color: YELLOW }}>→</span> LEGENDARY PANTHEON
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 2 · The ladder ─────────────────────────
const PER = 12; // frames per tier for the first seven
const LAST_AT = PER * 7; // legendary lands here and holds
const Ladder: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Math.min(7, Math.floor(f / PER));
  const start = idx === 7 ? LAST_AT : idx * PER;
  const local = f - start;
  const tier = TIERS[idx];
  const pop = spring({
    frame: local,
    fps,
    config: { damping: 11, stiffness: 190 },
  });
  const isLast = idx === 7;
  const nameIn = interpolate(local, [0, 6], [0, 1], clamp);
  const tag = interpolate(local, [10, 22], [0, 1], clamp);
  const progress = interpolate(f, [0, LAST_AT], [0, 7 / 7], clamp);
  const pulse = isLast ? 1 + Math.sin(local / 5) * 0.025 : 1;
  const shake = isLast && local < 8 ? Math.sin(local * 3.1) * (8 - local) * 1.4 : 0;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 210,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 58,
          letterSpacing: 10,
          color: YELLOW,
        }}
      >
        8 TIERS · 3 DIVISIONS EACH
      </div>
      <div
        style={{
          position: "absolute",
          top: 330,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          transform: `translateX(${shake}px)`,
        }}
      >
        <div
          style={{
            width: 860,
            height: 860,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle, ${tier.glow}55 0%, transparent 62%)`,
          }}
        >
          <Badge
            img={tier.img}
            glow={tier.glow}
            size={660}
            scale={(0.72 + pop * 0.28) * pulse}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1230,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: isLast ? 138 : 128,
          letterSpacing: 4,
          lineHeight: 1,
          color: isLast ? tier.glow : "#fff",
          textShadow: `0 0 40px ${tier.glow}99`,
          opacity: nameIn,
          transform: `translateY(${(1 - nameIn) * 24}px)`,
        }}
      >
        {tier.name}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1385,
          width: "100%",
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 38,
          letterSpacing: 6,
          color: "#fff",
          opacity: 0.8,
        }}
      >
        SCORE {tier.range}
      </div>
      {isLast ? (
        <div
          style={{
            position: "absolute",
            top: 1460,
            width: "100%",
            textAlign: "center",
            fontFamily: DISPLAY,
            fontSize: 52,
            letterSpacing: 5,
            color: YELLOW,
            opacity: tag,
          }}
        >
          THE TOP OF THE FOOD CHAIN.
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          top: 1580,
          height: 10,
          borderRadius: 5,
          background: "#262626",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(isLast ? 1 : (idx + local / PER) / 7) * 100 * (progress > 0 ? 1 : 0)}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${YELLOW}, ${CYAN})`,
            boxShadow: `0 0 20px ${YELLOW}`,
          }}
        />
      </div>
      {Array.from({ length: 7 }, (_, i) => (
        <Flash key={i} at={i * PER} color={TIERS[i].glow} len={8} />
      ))}
      <Flash at={LAST_AT} color="#ff7a3a" len={14} peak={0.4} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 3 · Log it → rank ─────────────────────────
const STEPS = [
  "LOG A PERSONAL RECORD",
  "1RM CALCULATED",
  "CATEGORY RANK UPDATES",
  "OVERALL RANK UPDATES",
];
const Mechanic: React.FC = () => {
  const f = useCurrentFrame();
  const head = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: ease });
  const card = interpolate(f, [6, 20], [0, 1], { ...clamp, easing: ease });
  // Epley example from the app's own "How your strength is measured" screen.
  const est = Math.round(interpolate(f, [22, 44], [0, 262], clamp));
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 230,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 130,
          lineHeight: 0.95,
          color: "#fff",
          opacity: head,
          transform: `translateY(${(1 - head) * 40}px)`,
        }}
      >
        JUST LOG WHAT
        <br />
        YOU <span style={{ color: YELLOW }}>ACTUALLY LIFT.</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 90,
          right: 90,
          borderRadius: 28,
          background: "#111111",
          border: `2px solid ${YELLOW}`,
          boxShadow: `0 0 60px ${YELLOW}33`,
          padding: "44px 40px",
          textAlign: "center",
          opacity: card,
          transform: `translateY(${(1 - card) * 50}px)`,
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 8,
            color: "#8a8a8a",
          }}
        >
          INTERMEDIATE
        </div>
        <div
          style={{ fontFamily: DISPLAY, fontSize: 112, letterSpacing: 3, color: "#fff" }}
        >
          225 LBS × 5 REPS
        </div>
        <div style={{ fontSize: 56, color: "#8a8a8a", lineHeight: 1 }}>↓</div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 124,
            letterSpacing: 3,
            color: YELLOW,
            textShadow: `0 0 30px ${YELLOW}77`,
          }}
        >
          EST. 1RM: {est} LBS
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1180,
          left: 90,
          right: 90,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {STEPS.map((s, i) => {
          const at = 30 + i * 15;
          const p = interpolate(f, [at, at + 8], [0, 1], { ...clamp, easing: ease });
          const lit = f >= at + 4;
          return (
            <div
              key={s}
              style={{
                opacity: p,
                transform: `translateX(${(1 - p) * -80}px)`,
                borderRadius: 16,
                padding: "20px 0",
                textAlign: "center",
                fontFamily: DISPLAY,
                fontSize: 60,
                letterSpacing: 8,
                color: "#fff",
                background: lit ? "#1d1a05" : "#111",
                border: `2px solid ${lit ? YELLOW : "#333"}`,
                boxShadow: lit ? `0 0 34px ${YELLOW}44` : "none",
              }}
            >
              {s}
            </div>
          );
        })}
      </div>
      <Flash at={30 + 3 * 15 + 4} color={YELLOW} len={10} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 4 · Public · real · defend ─────────────────────────
const LINES = [
  { t: "YOUR PROGRESS IS PUBLIC.", c: "#fff", at: 0 },
  { t: "YOUR COMPETITION IS REAL.", c: CYAN, at: 24 },
  { t: "YOUR RANK IS YOURS TO DEFEND.", c: YELLOW, at: 48 },
];
const Defend: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const row = interpolate(f, [0, 14], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 34,
          alignItems: "center",
        }}
      >
        {LINES.map((l) => {
          const p = interpolate(f, [l.at, l.at + 9], [0, 1], { ...clamp, easing: ease });
          return (
            <div
              key={l.t}
              style={{
                width: 900,
                textAlign: "center",
                fontFamily: DISPLAY,
                fontSize: 150,
                lineHeight: 0.92,
                letterSpacing: 2,
                color: l.c,
                textShadow: `0 0 40px ${l.c}66`,
                opacity: p,
                transform: `translateX(${(1 - p) * (l.at % 48 === 0 ? -120 : 120)}px)`,
              }}
            >
              {l.t}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1440,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 0,
          opacity: row,
        }}
      >
        {TIERS.map((t, i) => {
          const p = spring({
            frame: f - 6 - i * 3,
            fps,
            config: { damping: 12, stiffness: 160 },
          });
          const last = i === TIERS.length - 1;
          return (
            <div key={t.img} style={{ marginLeft: i === 0 ? 0 : -6 }}>
              <Badge
                img={t.img}
                glow={t.glow}
                size={last ? 130 : 110}
                scale={p * (last ? 1 + Math.sin(f / 5) * 0.04 : 1)}
                style={{ marginTop: last ? -20 : 0 }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 5 · Not a tracker ─────────────────────────
const Turn: React.FC = () => {
  const f = useCurrentFrame();
  const in1 = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: ease });
  const strike = interpolate(f, [46, 54], [0, 1], { ...clamp, easing: ease });
  const dim = interpolate(f, [46, 62], [1, 0.28], clamp);
  const in2 = interpolate(f, [58, 70], [0, 1], { ...clamp, easing: ease });
  const in3 = interpolate(f, [82, 96], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 148,
          lineHeight: 0.95,
          color: "#fff",
          opacity: in1 * dim,
          transform: `translateY(${(1 - in1) * 40}px)`,
        }}
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          THIS ISN'T A
          <br />
          FITNESS TRACKER.
          <div
            style={{
              position: "absolute",
              left: -20,
              top: "54%",
              height: 12,
              width: `${strike * 108}%`,
              background: YELLOW,
              boxShadow: `0 0 24px ${YELLOW}`,
              transform: "rotate(-3deg)",
              transformOrigin: "left center",
            }}
          />
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 790,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 164,
          lineHeight: 0.92,
          color: YELLOW,
          textShadow: `0 0 50px ${YELLOW}77`,
          opacity: in2,
          transform: `scale(${0.9 + in2 * 0.1})`,
        }}
      >
        IT'S A COMPETITIVE
        <br />
        RANKING PLATFORM.
      </div>
      <div
        style={{
          position: "absolute",
          top: 1340,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 76,
          letterSpacing: 5,
          color: "#fff",
          opacity: in3,
        }}
      >
        WITH A LIVING COMMUNITY
        <br />
        BUILT AROUND IT.
      </div>
      <Flash at={58} color={YELLOW} len={10} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Scene 6 · Outro ─────────────────────────
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const badge = spring({ frame: f - 4, fps, config: { damping: 12, stiffness: 130 } });
  const cta = spring({ frame: f - 30, fps, config: { damping: 13, stiffness: 150 } });
  const sub = interpolate(f, [52, 66], [0, 1], clamp);
  const glow = 0.5 + 0.5 * Math.sin(f / 6);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 300, width: "100%", display: "flex", justifyContent: "center" }}>
        <Badge
          img="legendary"
          glow="#ff3b1a"
          size={470}
          scale={0.5 + badge * 0.5}
          style={{ opacity: badge }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 960,
          width: "100%",
          textAlign: "center",
          whiteSpace: "nowrap",
          transform: `scale(${0.8 + logo * 0.2})`,
          opacity: logo,
        }}
      >
        <div
          style={{
            fontFamily: LOGO,
            fontStyle: "italic",
            fontSize: 104,
            letterSpacing: 3,
            lineHeight: 1,
            color: "#fff",
          }}
        >
          SHELL SHOCK
        </div>
        <div
          style={{
            fontFamily: LOGO,
            fontStyle: "italic",
            fontSize: 56,
            letterSpacing: 30,
            marginTop: 12,
            marginRight: -30,
            color: YELLOW,
          }}
        >
          trainer
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1330,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: cta,
          transform: `translateY(${(1 - cta) * 50}px)`,
        }}
      >
        <div
          style={{
            background: YELLOW,
            color: "#0A0A0A",
            fontFamily: DISPLAY,
            fontSize: 92,
            letterSpacing: 4,
            padding: "28px 70px",
            borderRadius: 26,
            boxShadow: `0 0 ${40 + glow * 40}px ${YELLOW}${glow > 0.5 ? "aa" : "77"}`,
          }}
        >
          DOWNLOAD FREE
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1545,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 64,
          letterSpacing: 10,
          color: "#fff",
          opacity: sub,
        }}
      >
        ON THE APP STORE
      </div>
    </AbsoluteFill>
  );
};

export const TrainerLaunch: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <Background />
    <Scene from={T1} duration={S1}>
      <Hook />
    </Scene>
    <Scene from={T2} duration={S2}>
      <Ladder />
    </Scene>
    <Scene from={T3} duration={S3}>
      <Mechanic />
    </Scene>
    <Scene from={T4} duration={S4}>
      <Defend />
    </Scene>
    <Scene from={T5} duration={S5}>
      <Turn />
    </Scene>
    <Scene from={T6} duration={S6}>
      <Outro />
    </Scene>
  </AbsoluteFill>
);
