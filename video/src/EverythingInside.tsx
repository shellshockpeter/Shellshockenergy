import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Background, Badge } from "./TrainerLaunch";

/**
 * "EVERYTHING INSIDE" — 25.0s, 9:16, 30fps, hard cuts on a 120 bpm grid
 * (15 frames = 1 beat). Script: promo/everything-inside-script.md
 *
 * Phone screens play real recordings from public/clips/<clipId>.mp4 when the
 * `clips` prop says the file exists (see scripts/render-inside.mjs); otherwise
 * they show a labeled slot so the cut still renders as an animatic.
 */

const YELLOW = "#FACC15";
const CYAN = "#00CFFF";
const DISPLAY = "'Bebas Neue', Impact, sans-serif";
const BODY = "'DM Sans', system-ui, sans-serif";
const LOGO = "'Robot Reavers', 'Bebas Neue', Impact, sans-serif";

const f = (sec: number) => Math.round(sec * 30);
export const INSIDE_DURATION = f(25);

const LOOP = ["TRAIN", "TRACK", "FUEL", "COMMUNITY", "CHALLENGE"] as const;

type PhoneBeat = {
  kind: "phone";
  id: string;
  from: number;
  dur: number;
  lines: string[];
  /** second overlay phase (beat 7A only) */
  lines2?: { at: number; lines: string[] };
  clip: string;
  startSec: number;
  rec: number;
  slot: string;
  action: string;
  /** index into LOOP, or -1 for none */
  loop: number;
  punch?: { to: number; origin: string };
  badge?: string;
};
type CardBeat = {
  kind: "turnA" | "turnB" | "cta";
  id: string;
  from: number;
  dur: number;
};
type Beat = PhoneBeat | CardBeat;

export const BEATS: Beat[] = [
  // 1 HOOK 0:00–0:02.0
  {
    kind: "phone", id: "1A", from: f(0), dur: f(2),
    lines: ["NOT JUST A RANK.", "HERE'S WHAT'S INSIDE."],
    clip: "clip01", startSec: 0, rec: 10,
    slot: "LOG A PERSONAL RECORD → RANK UP",
    action: "Tap LOG IT. Flash → NEW PR burst → RANK UP overlay.",
    loop: -1, punch: { to: 1.15, origin: "50% 45%" }, badge: "legendary",
  },
  // 2 TRAIN 0:02.0–0:06.5
  {
    kind: "phone", id: "2A", from: f(2), dur: f(1.5),
    lines: ["LOG EVERY LIFT.", "70+ EXERCISES."],
    clip: "clip04", startSec: 0, rec: 40,
    slot: "ACTIVE WORKOUT → ADD EXERCISE",
    action: "Tap + → pick exercise → weight/reps → LOG SET.",
    loop: 0, punch: { to: 1.2, origin: "50% 85%" },
  },
  {
    kind: "phone", id: "2B", from: f(3.5), dur: f(1.5),
    lines: ["PRE-BUILT SPLITS.", "OR BUILD YOURS."],
    clip: "clip03", startSec: 0, rec: 15,
    slot: "ROUTINES → CREATE SPLIT → NEW SPLIT",
    action: "START FROM A TEMPLATE / BUILD YOUR OWN → SPLIT TEMPLATES.",
    loop: 0,
  },
  {
    kind: "phone", id: "2C", from: f(5), dur: f(1.5),
    lines: ["A/B WEEKS FLIP", "AUTOMATICALLY."],
    clip: "clip03", startSec: 8, rec: 15,
    slot: "ROUTINES → THIS WEEK",
    action: "Tap WEEK A, then WEEK B.",
    loop: 0, punch: { to: 1.2, origin: "50% 30%" },
  },
  // 3 TRACK 0:06.5–0:10.0
  {
    kind: "phone", id: "3A", from: f(6.5), dur: f(1.5),
    lines: ["6 MUSCLE GROUPS.", "6 RANKS."],
    clip: "clip05", startSec: 0, rec: 15,
    slot: "FITNESS → MAP: YOUR STRENGTH MAP",
    action: "Tap chest, then legs.",
    loop: 1, punch: { to: 1.2, origin: "50% 50%" },
  },
  {
    kind: "phone", id: "3B", from: f(8), dur: f(2),
    lines: ["BIG JUMP?", "VIDEO PROOF REQUIRED."],
    clip: "clip02", startSec: 0, rec: 12,
    slot: "LOG A PERSONAL RECORD → VERIFICATION REQUIRED",
    action: "180 × 5 → ESTIMATED 1RM 210 → >15% jump → LOG IT.",
    loop: 1,
  },
  // 4 FUEL 0:10.0–0:13.0
  {
    kind: "phone", id: "4A", from: f(10), dur: f(1),
    lines: ["SET YOUR GOAL."],
    clip: "clip06", startSec: 0, rec: 30,
    slot: "NUTRITION → GOALS",
    action: "Tap GOAL: LOSE → TARGET appears.",
    loop: 2, punch: { to: 1.2, origin: "50% 60%" },
  },
  {
    kind: "phone", id: "4B", from: f(11), dur: f(1),
    lines: ["TRACK YOUR MACROS."],
    clip: "clip06", startSec: 15, rec: 30,
    slot: "NUTRITION → DIARY",
    action: "ADD FOOD → CALORIES REMAINING + PROTEIN / CARBS / FAT.",
    loop: 2,
  },
  {
    kind: "phone", id: "4C", from: f(12), dur: f(1),
    lines: ["HIT YOUR GOAL."],
    clip: "clip07", startSec: 0, rec: 12,
    slot: "LOG A WEIGH-IN → GOAL REACHED",
    action: "Header pill → LOG A WEIGH-IN → SAVE → GOAL REACHED / YOU DID IT.",
    loop: 2,
  },
  // 5 COMMUNITY 0:13.0–0:17.5
  {
    kind: "phone", id: "5A", from: f(13), dur: f(1.5),
    lines: ["YOUR WORKOUTS", "HIT THE FEED."],
    clip: "clip08", startSec: 0, rec: 10,
    slot: "SOCIAL → SHELLSHOCK ACADEMY",
    action: "Workout recap post → tap one reaction.",
    loop: 3, punch: { to: 1.15, origin: "50% 60%" },
  },
  {
    kind: "phone", id: "5B", from: f(14.5), dur: f(1),
    lines: ["PUBLIC PROFILES."],
    clip: "clip09", startSec: 0, rec: 10,
    slot: "PUBLIC PROFILE",
    action: "Slow scroll: cover, badge, THIS WEEK'S LIFTS, MUSCLE RANKS.",
    loop: 3,
  },
  {
    kind: "phone", id: "5C", from: f(15.5), dur: f(1),
    lines: ["JOIN COMMUNITY", "CHALLENGES."],
    clip: "clip10", startSec: 0, rec: 8,
    slot: "CHALLENGES",
    action: "Tap JOIN CHALLENGE.",
    loop: 4,
  },
  {
    kind: "phone", id: "5D", from: f(16.5), dur: f(1),
    lines: ["ADD FRIENDS.", "SEND DMS."],
    clip: "clip11", startSec: 0, rec: 12,
    slot: "FRIEND PROFILE → MESSAGE → DM",
    action: "Tap MESSAGE → type + send.",
    loop: 3, punch: { to: 1.15, origin: "50% 90%" },
  },
  // 6 THE TURN 0:17.5–0:20.5
  { kind: "turnA", id: "6A", from: f(17.5), dur: f(1.5) },
  { kind: "turnB", id: "6B", from: f(19), dur: f(1.5) },
  // 7 PERK + OUTRO 0:20.5–0:25.0
  {
    kind: "phone", id: "7A", from: f(20.5), dur: f(2.5),
    lines: ["REACH LEGENDARY", "PANTHEON."],
    lines2: { at: f(1), lines: ["FREE TUB.", "25% OFF FOR LIFE."] },
    clip: "clip12", startSec: 0, rec: 8,
    slot: "RANKINGS → BRAND REWARDS",
    action: "Scroll so the LEGENDARY PANTHEON card is centered.",
    loop: -1, punch: { to: 1.2, origin: "50% 55%" }, badge: "legendary",
  },
  { kind: "cta", id: "7B", from: f(23), dur: f(2) },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ───────── shared bits ───────── */

const OverlayText: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(132, 980 / (longest * 0.43));
  const slam = interpolate(frame, [0, 3], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        left: 0,
        right: 0,
        height: 250,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        transform: `translateY(${slam * 26}px)`,
        opacity: interpolate(frame, [0, 2], [0, 1], clamp),
      }}
    >
      {lines.map((l, i) => (
        <div
          key={l}
          style={{
            fontFamily: DISPLAY,
            fontSize: size,
            lineHeight: 0.96,
            letterSpacing: 2,
            whiteSpace: "nowrap",
            color: i === lines.length - 1 && lines.length > 1 ? YELLOW : "#fff",
            textShadow:
              i === lines.length - 1 && lines.length > 1
                ? `0 0 40px ${YELLOW}88`
                : "0 4px 24px #000",
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
};

const LoopBar: React.FC<{ active: number }> = ({ active }) => (
  <div
    style={{
      position: "absolute",
      top: 1540,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      gap: 14,
    }}
  >
    {LOOP.map((s, i) => {
      const on = i === active;
      return (
        <div
          key={s}
          style={{
            fontFamily: DISPLAY,
            fontSize: 38,
            letterSpacing: 4,
            padding: "8px 18px",
            borderRadius: 10,
            color: on ? "#0A0A0A" : "#8a8a8a",
            background: on ? YELLOW : "rgba(255,255,255,0.06)",
            border: `2px solid ${on ? YELLOW : "#333"}`,
            boxShadow: on ? `0 0 24px ${YELLOW}88` : "none",
          }}
        >
          {s}
        </div>
      );
    })}
  </div>
);

const PHONE_W = 520;
const PHONE_H = 1126;
const BEZEL = 12;

const SlotCard: React.FC<{ beat: PhoneBeat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 8) % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at 50% 30%, #1d1a08 0%, #0b0b0b 70%)",
        padding: "92px 34px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 20,
      }}
    >
      {beat.badge ? (
        <div style={{ marginTop: 10 }}>
          <Badge img={beat.badge} glow="#ff3b1a" size={170} />
        </div>
      ) : (
        <div style={{ height: 90 }} />
      )}
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 54,
          letterSpacing: 4,
          color: YELLOW,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: blink ? "#ff2a2a" : "#551010",
            display: "inline-block",
          }}
        />
        RECORD {beat.clip.toUpperCase().replace("CLIP", "CLIP ")}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 50,
          lineHeight: 1,
          letterSpacing: 2,
          color: "#fff",
        }}
      >
        {beat.slot}
      </div>
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 27,
          lineHeight: 1.3,
          color: "#bdbdbd",
        }}
      >
        {beat.action}
      </div>
      <div
        style={{
          marginTop: "auto",
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 4,
          color: CYAN,
        }}
      >
        FILM ~{beat.rec}s · SHOWN {(beat.dur / 30).toFixed(1)}s
      </div>
    </div>
  );
};

const Phone: React.FC<{
  beat: PhoneBeat;
  hasClip: boolean;
  frame: number;
}> = ({ beat, hasClip, frame }) => {
  const pop = interpolate(frame, [0, 4], [1.035, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const punch = beat.punch
    ? 1 +
      (beat.punch.to - 1) *
        interpolate(frame, [4, beat.dur], [0, 1], {
          ...clamp,
          easing: Easing.inOut(Easing.cubic),
        })
    : 1;
  return (
    <div
      style={{
        position: "absolute",
        top: 392,
        left: (1080 - PHONE_W) / 2,
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 70,
        background: "#050505",
        border: "3px solid #3a3a3a",
        boxShadow: `0 0 0 2px #111, 0 30px 90px #000, 0 0 70px ${YELLOW}22`,
        transform: `scale(${pop})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: BEZEL,
          borderRadius: 58,
          overflow: "hidden",
          background: "#000",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${punch})`,
            transformOrigin: beat.punch?.origin ?? "50% 50%",
          }}
        >
          {hasClip ? (
            <OffthreadVideo
              src={staticFile(`clips/${beat.clip}.mp4`)}
              startFrom={Math.round(beat.startSec * 30)}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <SlotCard beat={beat} />
          )}
        </div>
      </div>
      {/* dynamic island */}
      <div
        style={{
          position: "absolute",
          top: BEZEL + 14,
          left: "50%",
          marginLeft: -52,
          width: 104,
          height: 30,
          borderRadius: 15,
          background: "#000",
        }}
      />
    </div>
  );
};

const PhoneBeatView: React.FC<{ beat: PhoneBeat; clips: Record<string, boolean> }> = ({
  beat,
  clips,
}) => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 3], [0.2, 0], clamp);
  const phase2 = beat.lines2 && frame >= beat.lines2.at;
  const lines = phase2 ? beat.lines2!.lines : beat.lines;
  return (
    <AbsoluteFill>
      <OverlayText key={phase2 ? "p2" : "p1"} lines={lines} />
      <Phone beat={beat} hasClip={!!clips[beat.clip]} frame={frame} />
      {beat.loop >= -1 && <LoopBar active={beat.loop} />}
      <AbsoluteFill
        style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }}
      />
    </AbsoluteFill>
  );
};

const TurnA: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [33, 41], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          fontFamily: DISPLAY,
          fontSize: 190,
          lineHeight: 0.95,
          textAlign: "center",
          color: "#fff",
          letterSpacing: 2,
        }}
      >
        OTHER APPS
        <br />
        LOG YOUR
        <br />
        LIFTS.
        <div
          style={{
            position: "absolute",
            left: -30,
            top: "52%",
            height: 16,
            width: `${strike * 112}%`,
            background: YELLOW,
            boxShadow: `0 0 30px ${YELLOW}`,
            transform: "rotate(-4deg)",
            transformOrigin: "left center",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const TurnB: React.FC = () => {
  const frame = useCurrentFrame();
  const slam = interpolate(frame, [0, 5], [1.12, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 200,
          lineHeight: 0.95,
          textAlign: "center",
          color: YELLOW,
          letterSpacing: 2,
          textShadow: `0 0 60px ${YELLOW}88`,
          transform: `scale(${slam})`,
        }}
      >
        THIS ONE
        <br />
        MAKES THEM
        <br />
        COUNT.
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 6], [1.08, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const glow = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          transform: `scale(${pop})`,
        }}
      >
        <Badge img="legendary" glow="#ff3b1a" size={420} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 880,
          width: "100%",
          textAlign: "center",
          whiteSpace: "nowrap",
          transform: `scale(${pop})`,
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
          top: 1180,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: YELLOW,
            color: "#0A0A0A",
            fontFamily: DISPLAY,
            fontSize: 88,
            letterSpacing: 4,
            padding: "26px 64px",
            borderRadius: 26,
            boxShadow: `0 0 ${40 + glow * 40}px ${YELLOW}aa`,
          }}
        >
          DOWNLOAD FREE
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1345,
          width: "100%",
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 60,
          letterSpacing: 10,
          color: "#fff",
        }}
      >
        ON THE APP STORE
      </div>
    </AbsoluteFill>
  );
};

export type InsideProps = { clips: Record<string, boolean> };

export const EverythingInside: React.FC<InsideProps> = ({ clips }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Background />
    {BEATS.map((b) => (
      <Sequence key={b.id} from={b.from} durationInFrames={b.dur} layout="none">
        {b.kind === "phone" ? (
          <PhoneBeatView beat={b} clips={clips} />
        ) : b.kind === "turnA" ? (
          <TurnA />
        ) : b.kind === "turnB" ? (
          <TurnB />
        ) : (
          <Cta />
        )}
      </Sequence>
    ))}
    <Audio src={staticFile("audio/inside-music.wav")} />
  </AbsoluteFill>
);
