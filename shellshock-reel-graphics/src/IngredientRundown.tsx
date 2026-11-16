import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig, random } from "remotion";
import { AUDIO_OFFSET, BEATS, BG_TRANSITION_FRAMES, Beat, COLORS, FOOTAGE_FILE, FPS, GOLD_SHIFT, Item, RUNDOWN, SFX_STEM_FILE, secToFrames } from "./config";
import { easeInOut, enterSpring, ramp } from "./ease";
import { HEAD, MONO } from "./fonts";
import { CountUp } from "./components/CountUp";
import { GlassCard } from "./components/GlassCard";
import { GoldFoilText } from "./components/GoldFoilText";
import { FootageBackdrop, hasStaticFile } from "./components/FootageBackdrop";
import { LiquidBackground } from "./components/LiquidBackground";
import { NeonCheck } from "./components/NeonCheck";
import { DotSpec, ProgressDots } from "./components/ProgressDots";
import { ReelStart, useCueFrame, useReelTime } from "./time";

/* ---- layout (frame space 1080x1920; safe zone x 60-960, y 260-1500) ---- */
const CX = 525; // slightly left of frame center so the 1.15x finale card still fits x<=960
const CY = 900;
const CARD_W = 756;
const CARD_H = 820;
const PAD = 56;
const CONTENT_W = CARD_W - PAD * 2; // 644
const AREA_TOP = 128;
const AREA_BOT = CARD_H - 150;
const AREA_MID = (AREA_TOP + AREA_BOT) / 2;
const SLOT1 = AREA_TOP + (AREA_BOT - AREA_TOP) * 0.26;
const SLOT2 = AREA_TOP + (AREA_BOT - AREA_TOP) * 0.74;
const EXIT_FRAMES = 12;

const Row: React.FC<{
  item: Item;
  beat: Beat;
  index: number;
  yCenter: number;
  compact: boolean;
  gold: boolean;
  checkId: string;
}> = ({ item, beat, index, yCenter, compact, gold, checkId }) => {
  const frame = useCurrentFrame();
  const cue = useCueFrame();
  const inF = cue(item.inAt);
  const own = item.inAt > beat.start + 0.05; // later rows animate themselves; first row rides the card
  const e = own ? enterSpring(frame, inF, 18, 13) : 1;
  const op = own ? ramp(frame, inF, inF + 8) : 1;
  const blur = own ? (1 - ramp(frame, inF, inF + 14)) * 14 : 0;
  if (own && frame < inF) return null;

  const numSize = compact ? 124 : 172;
  const nameSize = compact ? 40 : 46;
  const checkSize = compact ? 84 : 96;
  const rowH = compact ? 216 : 290;
  const leftW = CONTENT_W - checkSize - 24;
  const nameStyle: React.CSSProperties = {
    fontFamily: HEAD,
    fontWeight: 800,
    fontSize: nameSize,
    letterSpacing: "0.05em",
    lineHeight: 1.08,
    textTransform: "uppercase",
    color: "rgba(244,255,246,0.95)",
    width: leftW,
  };
  // keep hyphenated words (BETA-ALANINE, L-CITRULLINE) from breaking mid-word
  const words = item.name.split(" ").map((w, i, arr) => (
    <React.Fragment key={i}>
      <span style={{ whiteSpace: "nowrap" }}>{w}</span>
      {i < arr.length - 1 ? " " : null}
    </React.Fragment>
  ));
  const numberEl = (
    <span style={{ display: "inline-flex", alignItems: "baseline", lineHeight: 1 }}>
      <CountUp
        to={item.value}
        decimals={item.decimals ?? 0}
        start={inF + 3}
        duration={12}
        style={{ fontSize: numSize, letterSpacing: "-0.04em", color: gold ? undefined : COLORS.text }}
      />
      <span
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: numSize * 0.34,
          marginLeft: numSize * 0.1,
          color: gold ? undefined : COLORS.neon,
          textShadow: gold ? undefined : "0 0 22px rgba(57,255,20,0.55)",
        }}
      >
        {item.unit}
      </span>
    </span>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: PAD,
        width: CONTENT_W,
        top: yCenter - rowH / 2 + (1 - e) * 34,
        height: rowH,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: compact ? 8 : 14,
        opacity: op,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      }}
    >
      <div style={{ height: numSize, lineHeight: 1 }}>{gold ? <GoldFoilText>{numberEl}</GoldFoilText> : numberEl}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={nameStyle}>{gold ? <GoldFoilText style={{ lineHeight: 1.08 }}>{words}</GoldFoilText> : words}</div>
        <NeonCheck
          id={`${checkId}-${index}`}
          start={cue(item.checkAt)}
          size={gold ? checkSize + 10 : checkSize}
          variant={gold ? "gold" : "green"}
        />
      </div>
    </div>
  );
};

const BeatCard: React.FC<{ beat: Beat; index: number; next?: Beat; finaleExitAt?: number }> = ({ beat, index, next, finaleExitAt }) => {
  const frame = useCurrentFrame();
  const cue = useCueFrame();
  const gold = !!beat.finale;
  const enterAt = cue(beat.start);
  const exitStart = beat.finale ? finaleExitAt : cue(beat.exitAt ?? (next ? next.start - 0.1 : beat.end));
  const exitEnd = exitStart !== undefined ? exitStart + EXIT_FRAMES : undefined;
  const two = beat.items.length > 1;

  // card "breathe" on long beats so it never feels frozen
  let boost = 0;
  if (beat.breatheFrom !== undefined) {
    const b = cue(beat.breatheFrom);
    boost = ramp(frame, b, b + 24) * (0.5 + 0.5 * Math.sin(((frame - b) / FPS) * ((Math.PI * 2) / 2.8)));
  } else if (gold) {
    boost = 0.5 + 0.5 * Math.sin((frame / FPS) * ((Math.PI * 2) / 3.4));
  }

  // row 1 glides from centre to its slot as row 2 enters
  const row2In = two ? cue(beat.items[1].inAt) : 0;
  const g = two ? enterSpring(frame, row2In, 22, 14) : 0;
  const y0 = two ? interpolate(g, [0, 1], [AREA_MID, SLOT1]) : AREA_MID;

  const tagF = beat.tag ? cue(beat.tag.at) : 0;
  const tagE = beat.tag ? enterSpring(frame, tagF, 16, 12) : 0;
  const tagOp = beat.tag ? ramp(frame, tagF, tagF + 6) : 0;
  const tagBlur = beat.tag ? (1 - ramp(frame, tagF, tagF + 10)) * 10 : 0;

  return (
    <GlassCard
      cx={CX}
      cy={CY}
      width={CARD_W}
      height={CARD_H}
      enterAt={enterAt}
      enterDur={gold ? 32 : 20}
      exitStart={exitStart}
      exitEnd={exitEnd}
      scale={gold ? 1.15 : 1}
      variant={gold ? "gold" : "green"}
      glowBoost={boost}
    >
      {/* label + index */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          right: PAD,
          top: 52,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 14, color: gold ? COLORS.champagne : "rgba(244,255,246,0.66)" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 10,
              background: gold ? COLORS.gold : COLORS.neon,
              boxShadow: `0 0 14px ${gold ? COLORS.gold : COLORS.neon}`,
            }}
          />
          {beat.label}
        </span>
        <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: "0.04em", color: "rgba(244,255,246,0.38)" }}>
          {String(index + 1).padStart(2, "0")} / {String(BEATS.length).padStart(2, "0")}
        </span>
      </div>

      {beat.items.map((item, i) => (
        <Row
          key={item.name}
          item={item}
          beat={beat}
          index={i}
          compact={two}
          gold={gold}
          checkId={beat.id}
          yCenter={i === 0 ? y0 : SLOT2}
        />
      ))}

      {beat.tag && frame >= tagF ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: CARD_H - 150 + 24,
            display: "flex",
            justifyContent: "center",
            opacity: tagOp,
            transform: `translateY(${(1 - tagE) * 22}px) scale(${0.86 + 0.14 * tagE})`,
            filter: tagBlur > 0.3 ? `blur(${tagBlur}px)` : undefined,
          }}
        >
          <div
            style={{
              height: 78,
              padding: "0 40px",
              borderRadius: 40,
              display: "flex",
              alignItems: "center",
              fontFamily: HEAD,
              fontWeight: 900,
              fontSize: 34,
              letterSpacing: "0.12em",
              color: gold ? COLORS.goldLight : COLORS.neon,
              background: gold ? "linear-gradient(165deg, rgba(232,194,106,0.16), rgba(232,194,106,0.05))" : "rgba(57,255,20,0.09)",
              border: gold ? `2px solid ${COLORS.gold}` : "1.5px solid rgba(57,255,20,0.7)",
              boxShadow: gold
                ? "0 0 34px rgba(232,194,106,0.4), inset 0 1.5px 0 rgba(255,241,194,0.4)"
                : "0 0 30px rgba(57,255,20,0.3), inset 0 1.5px 0 rgba(255,255,255,0.22)",
              textShadow: gold ? "0 0 20px rgba(232,194,106,0.55)" : "0 0 20px rgba(57,255,20,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ paddingLeft: "0.12em" }}>{beat.tag.text}</span>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
};

/** ~36 tiny gold dust motes drifting upward (finale only). */
const GoldDust: React.FC<{ fadeStart: number; endFade?: number }> = ({ fadeStart, endFade = 1 }) => {
  const frame = useCurrentFrame();
  const master = ramp(frame, fadeStart, fadeStart + 36) * endFade;
  if (master <= 0) return null;
  const N = 38;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: master }}>
      {Array.from({ length: N }, (_, i) => {
        const x0 = 90 + random(`dx${i}`) * 900;
        const y0 = random(`dy${i}`) * 1700;
        const sp = 0.55 + random(`ds${i}`) * 1.1;
        const sway = 14 + random(`dw${i}`) * 34;
        const ph = random(`dp${i}`) * 6.28;
        const size = 3.5 + random(`dz${i}`) * 5.5;
        const y = 1780 - ((y0 + (frame - fadeStart) * sp * 1.2) % 1700);
        const x = x0 + Math.sin(frame * 0.025 + ph) * sway;
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.05 + ph * 2));
        const edge = interpolate(y, [180, 420, 1500, 1700], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              background: i % 3 === 0 ? COLORS.goldLight : COLORS.gold,
              boxShadow: `0 0 ${size * 3}px ${COLORS.gold}`,
              opacity: tw * edge * 0.9,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const RundownInner: React.FC<{ overlay: boolean; audio: boolean }> = ({ overlay, audio }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cue = useCueFrame();
  const t = useReelTime();

  // plain = original opaque liquid background (no footage in ./public); footage = blurred footage; overlay = alpha graphics
  const mode: "plain" | "footage" | "overlay" = overlay ? "overlay" : hasStaticFile(FOOTAGE_FILE) ? "footage" : "plain";
  const withBackdrop = mode !== "plain";

  const goldMix = ramp(t, GOLD_SHIFT.from + AUDIO_OFFSET, GOLD_SHIFT.to + AUDIO_OFFSET, easeInOut);

  const dots: DotSpec[] = BEATS.map((b, i) => ({
    halfAt: b.items.length > 1 ? cue(b.items[0].checkAt) : undefined,
    fillAt: cue(b.items[b.items.length - 1].checkAt),
    activeAt: cue(b.start),
    activeUntil: BEATS[i + 1] ? cue(BEATS[i + 1].start) : durationInFrames + 60,
    gold: !!b.finale,
  }));

  const finale = BEATS[BEATS.length - 1];
  const fadeIn = 1 - ramp(frame, 0, 10);
  const fadeOut = ramp(frame, durationInFrames - Math.round(RUNDOWN.fadeOutSec * FPS), durationInFrames - 1, Easing.linear);
  const veil = Math.max(fadeIn, fadeOut);
  // with a footage/alpha backdrop the graphics fade out themselves (no base-colour veil over the footage)
  const finaleExitAt = withBackdrop ? durationInFrames - BG_TRANSITION_FRAMES : undefined;
  const dustFade = withBackdrop ? 1 - ramp(frame, durationInFrames - BG_TRANSITION_FRAMES, durationInFrames) : 1;

  return (
    <AbsoluteFill style={{ background: withBackdrop ? undefined : COLORS.base }}>
      {withBackdrop ? <FootageBackdrop mode={mode === "overlay" ? "overlay" : "footage"} goldMix={goldMix} audio={audio} /> : <LiquidBackground goldMix={goldMix} />}
      <GoldDust fadeStart={cue(finale.start)} endFade={dustFade} />
      <ProgressDots dots={dots} cx={CX} y={300} appearAt={cue(BEATS[0].start) - 6} fadeOutAt={durationInFrames - 14} />
      {BEATS.map((b, i) => (
        <BeatCard key={b.id} beat={b} index={i} next={BEATS[i + 1]} finaleExitAt={finaleExitAt} />
      ))}
      {withBackdrop ? null : <AbsoluteFill style={{ background: COLORS.base, opacity: veil, pointerEvents: "none" }} />}
      {audio && mode !== "overlay" && hasStaticFile(SFX_STEM_FILE) ? (
        <Audio src={staticFile(SFX_STEM_FILE)} startFrom={secToFrames(RUNDOWN.startSec)} />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Frame 0 == reel time 18.6s, so drop it at 18.6s in your editor with no offset.
 * Default = "composited": footage (blurred) + glass + graphics + voice + sfx.
 * `overlay` = alpha graphics + liquid layers only (no footage, no audio).
 * `audio={false}` mutes footage + sfx (FullPreview supplies its own audio).
 */
export const IngredientRundown: React.FC<{ overlay?: boolean; audio?: boolean }> = ({ overlay = false, audio = true }) => (
  <ReelStart sec={RUNDOWN.startSec}>
    <RundownInner overlay={overlay} audio={audio} />
  </ReelStart>
);

export const IngredientRundownOverlay: React.FC = () => <IngredientRundown overlay audio={false} />;
