import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, HOOK } from "./config";
import { Easing } from "remotion";
import { enterSpring, ramp } from "./ease";
import { HEAD, MONO } from "./fonts";
import { PandaGrid } from "./components/PandaGrid";
import { ReelStart, useCueFrame } from "./time";

const CX = 540;
const BIG_CY = 410;
const BIG_SIZE = 400;
const OFF_CY = 655;
const CHIP_CY = 848;
const TAG_CY = 956;
const PCT_W = 300; // advance width of "%" at BIG_SIZE (tuned from stills)

const SHAKE: [number, number, number][] = [
  [-16, 10, -0.6],
  [13, -11, 0.5],
  [-7, 6, -0.3],
  [3, -2, 0.1],
];

const MASK_BORDER: React.CSSProperties = {
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
};

const bump = (f: number, amp: number) => (f < 0 ? 0 : Math.exp(-f / 5) * Math.sin(f * 0.85) * amp);

const HookInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cue = useCueFrame();
  const c = HOOK.cues;

  const slam = cue(c.slam);
  const fly = cue(c.fly);
  const chip = cue(c.chip);
  const pct = cue(c.percent);
  const off = cue(c.off);
  const tag = cue(c.tag);
  // exits are clamped so the last frame is always clean alpha, even with a big AUDIO_OFFSET
  const exitBase = Math.min(cue(c.exit), durationInFrames - 18);
  const exitP = (delay: number) => ramp(frame, exitBase + delay, exitBase + delay + 12, Easing.bezier(0.5, 0, 0.9, 0.5));

  // ---- camera shake (3 frames after the slam)
  const sk = frame - slam;
  const [sx, sy, sr] = sk >= 0 && sk < SHAKE.length ? SHAKE[sk] : [0, 0, 0];

  // ---- idle pulse (0 -> slam)
  const pulseIn = ramp(frame, 4, 18);
  const pulseOut = 1 - ramp(frame, cue(c.pulseOut) - 8, cue(c.pulseOut));
  const pulsePhase = (frame % 40) / 40;

  // ---- giant "20"
  const slamE = enterSpring(frame, slam, 16, 11);
  const bigScale = interpolate(slamE, [0, 1], [2.5, 1]);
  const bigOpacity = ramp(frame, slam, slam + 3);
  const bigBlur = (1 - ramp(frame, slam, slam + 8)) * 16;
  const landPulse = 1 + bump(frame - (fly + 17), 0.06) + bump(frame - (fly + 31), 0.05);
  const pctE = enterSpring(frame, pct, 18, 10);
  const pctW = Math.max(0, pctE) * PCT_W;
  const bigExit = exitP(0);

  // ---- OFF
  const offE = enterSpring(frame, off, 16, 11);
  const offScale = interpolate(offE, [0, 1], [1.9, 1]);
  const offOp = ramp(frame, off, off + 3) * (1 - exitP(1));
  const offBlur = (1 - ramp(frame, off, off + 8)) * 14;

  // ---- chip
  const chipE = enterSpring(frame, chip, 16, 10);
  const chipY = interpolate(chipE, [0, 1], [-150, 0]);
  const chipOp = ramp(frame, chip, chip + 5) * (1 - exitP(2));
  const chipBlur = (1 - ramp(frame, chip, chip + 9)) * 14;
  const chipSweep = ((frame - chip - 12) % 60) / 60;
  const chipSweepOn = frame - chip >= 12;

  // ---- entire order tag
  const tagE = enterSpring(frame, tag, 16, 12);
  const tagX = interpolate(tagE, [0, 1], [-160, 0]);
  const tagOp = ramp(frame, tag, tag + 6) * (1 - exitP(3));
  const tagBlur = (1 - ramp(frame, tag, tag + 9)) * 12;

  // ---- PANDAS label
  const lblE = enterSpring(frame, cue(c.pandasLabel), 14, 12);
  const lblOut = 1 - ramp(frame, fly, fly + 8);

  const glow = `0 0 46px rgba(57,255,20,0.75), 0 0 130px rgba(57,255,20,0.38), 0 10px 50px rgba(0,0,0,0.55)`;

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)` }}>
      {/* tiny idle pulse so the first 2s doesn't feel dead */}
      {pulseIn * pulseOut > 0.01 ? (
        <div style={{ position: "absolute", left: CX - 40, top: 300 - 40, width: 80, height: 80, opacity: pulseIn * pulseOut }}>
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 28,
              width: 24,
              height: 24,
              borderRadius: 24,
              background: "rgba(10,20,12,0.45)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              boxShadow: "0 0 18px rgba(57,255,20,0.6), inset 0 0 8px rgba(57,255,20,0.6)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 80,
              border: "1.5px solid rgba(57,255,20,0.7)",
              opacity: 1 - pulsePhase,
              transform: `scale(${0.35 + pulsePhase * 0.65})`,
            }}
          />
        </div>
      ) : null}

      {/* giant 20 / 20% */}
      {frame >= slam && bigExit < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: 1080,
            top: BIG_CY - 260,
            height: 520,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: bigOpacity * (1 - bigExit),
            transform: `scale(${bigScale * landPulse * interpolate(pctE, [0, 1], [1, 0.9]) * (1 - 0.1 * bigExit)})`,
            filter: bigBlur > 0.3 ? `blur(${bigBlur}px)` : undefined,
          }}
        >
          <span
            style={{
              fontFamily: HEAD,
              fontWeight: 900,
              fontSize: BIG_SIZE,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: COLORS.neon,
              textShadow: glow,
              display: "inline-block",
              paddingTop: 0,
            }}
          >
            20
          </span>
          <span
            style={{
              display: "inline-block",
              width: pctW,
              opacity: Math.min(1, pctE * 1.4),
              transform: `scale(${Math.max(0, pctE)})`,
              transformOrigin: "0% 60%",
              fontFamily: HEAD,
              fontWeight: 900,
              fontSize: BIG_SIZE,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: COLORS.neon,
              textShadow: glow,
              whiteSpace: "nowrap",
              paddingTop: 0,
            }}
          >
            %
          </span>
        </div>
      ) : null}

      <PandaGrid
        cols={HOOK.panda.cols}
        rows={HOOK.panda.rows}
        size={74}
        gap={12}
        centerX={CX}
        top={606}
        popStart={cue(c.gridStart)}
        popStagger={HOOK.panda.popStaggerFrames}
        flyStart={fly}
        flyStagger={HOOK.panda.flyStaggerFrames}
        target={{ x: CX, y: BIG_CY }}
      />

      {lblE > 0.01 && lblOut > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: 1080,
            top: 950,
            textAlign: "center",
            fontFamily: HEAD,
            fontWeight: 800,
            fontSize: 38,
            letterSpacing: "0.34em",
            paddingLeft: "0.34em",
            color: COLORS.text,
            opacity: Math.min(1, lblE) * lblOut,
            transform: `translateY(${(1 - lblE) * 18}px)`,
            textShadow: "0 4px 24px rgba(0,0,0,0.7)",
          }}
        >
          PANDAS
        </div>
      ) : null}

      {/* OFF */}
      {frame >= off && offOp > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: 1080,
            top: OFF_CY - 150,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: offOp,
            transform: `scale(${offScale * (1 - 0.1 * exitP(1))})`,
            filter: offBlur > 0.3 ? `blur(${offBlur}px)` : undefined,
          }}
        >
          <span
            style={{
              fontFamily: HEAD,
              fontWeight: 900,
              fontSize: 250,
              lineHeight: 1,
              letterSpacing: "0.02em",
              color: COLORS.text,
              textShadow: "0 8px 50px rgba(0,0,0,0.6), 0 0 60px rgba(255,255,255,0.18)",
              paddingTop: 28,
            }}
          >
            OFF
          </span>
        </div>
      ) : null}

      {/* CODE chip */}
      {frame >= chip && chipOp > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: CX - 300,
            width: 600,
            top: CHIP_CY - 56,
            height: 112,
            opacity: chipOp,
            transform: `translateY(${chipY}px) scale(${1 - 0.1 * exitP(2)})`,
            filter: chipBlur > 0.3 ? `blur(${chipBlur}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 30,
              overflow: "hidden",
              background: "linear-gradient(165deg, rgba(18,34,22,0.92), rgba(6,14,9,0.9))",
              boxShadow:
                "inset 0 1.5px 0 rgba(255,255,255,0.3), 0 0 60px rgba(57,255,20,0.28), 0 24px 60px rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px) saturate(160%)",
            }}
          >
            {chipSweepOn ? (
              <div
                style={{
                  position: "absolute",
                  top: "-30%",
                  bottom: "-30%",
                  width: "40%",
                  left: `${interpolate(chipSweep, [0, 1], [-50, 130])}%`,
                  transform: "skewX(-18deg)",
                  background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0))",
                }}
              />
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 30,
              padding: 1.5,
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.55), rgba(255,255,255,0.1) 40%, rgba(57,255,20,0.55) 100%)",
              ...MASK_BORDER,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 54,
              letterSpacing: "0.02em",
              color: COLORS.neon,
              textShadow: "0 0 24px rgba(57,255,20,0.65)",
              whiteSpace: "nowrap",
            }}
          >
            CODE:&nbsp;SHOCK20
          </div>
        </div>
      ) : null}

      {/* ENTIRE ORDER */}
      {frame >= tag && tagOp > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: CX - 210,
            width: 420,
            top: TAG_CY - 33,
            height: 66,
            opacity: tagOp,
            transform: `translateX(${tagX}px) scale(${1 - 0.1 * exitP(3)})`,
            filter: tagBlur > 0.3 ? `blur(${tagBlur}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 33,
              background: "linear-gradient(165deg, rgba(18,34,22,0.7), rgba(6,14,9,0.62))",
              boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.26), 0 0 36px rgba(57,255,20,0.2), 0 14px 36px rgba(0,0,0,0.45)",
              border: "1.5px solid rgba(255,255,255,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              fontFamily: HEAD,
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: "0.22em",
              color: COLORS.text,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 10, background: COLORS.neon, boxShadow: "0 0 14px #39FF14" }} />
            <span style={{ paddingLeft: "0.22em" }}>ENTIRE ORDER</span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Transparent overlay. NO background anywhere in this tree. */
export const HookOverlay: React.FC = () => (
  <ReelStart sec={HOOK.startSec}>
    <HookInner />
  </ReelStart>
);

