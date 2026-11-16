import React from "react";
import { AbsoluteFill, getStaticFiles, interpolateColors, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BG_BLUR_PX,
  BG_TINT_OPACITY,
  BG_TRANSITION_FRAMES,
  BLOBS_OPACITY,
  FOOTAGE_DIM,
  FOOTAGE_FILE,
  OVERLAY_BG_OPACITY,
  RUNDOWN,
  secToFrames,
} from "../config";
import { easeInOut, ramp } from "../ease";
import { Grain, LiquidBlobs, Vignette } from "./LiquidBackground";

/** True if `name` exists in ./public (works in Studio and in renders). */
export const hasStaticFile = (name: string) => getStaticFiles().some((f) => f.name === name);

/**
 * 0 -> 1 over BG_TRANSITION_FRAMES at the start of the rundown (18.6s),
 * 1 -> 0 over BG_TRANSITION_FRAMES at the end (58.0s).
 * Drives blur, dim, tint, blobs, vignette and grain together.
 */
export const useBackdropVisibility = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const T = BG_TRANSITION_FRAMES;
  return ramp(frame, 0, T, easeInOut) * (1 - ramp(frame, durationInFrames - T, durationInFrames, easeInOut));
};

/**
 * Background layers, bottom -> top:
 *  1. footage (OffthreadVideo, blurred + dimmed)            [mode "footage"]
 *  2. dark-green gradient tint (warms toward champagne in the finale)
 *  3. liquid blobs + feTurbulence warp, blended "screen"
 *  4. vignette + grain
 * mode "overlay": same layers, no footage, no blend, whole group at OVERLAY_BG_OPACITY (alpha render).
 */
export const FootageBackdrop: React.FC<{ mode: "footage" | "overlay"; goldMix: number; audio: boolean }> = ({ mode, goldMix, audio }) => {
  const bg = useBackdropVisibility();
  const footage = mode === "footage";

  const top = interpolateColors(goldMix, [0, 1], ["rgb(4,46,29)", "rgb(74,55,16)"]);
  const bottom = interpolateColors(goldMix, [0, 1], ["rgb(3,12,8)", "rgb(16,17,10)"]);

  const layers = (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`, opacity: (footage ? BG_TINT_OPACITY : 1) * bg }} />
      <AbsoluteFill style={{ opacity: (footage ? BLOBS_OPACITY : 1) * bg, mixBlendMode: footage ? "screen" : "normal" }}>
        <LiquidBlobs goldMix={goldMix} id="rb" />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: bg }}>
        <Vignette />
        <Grain id="rb" />
      </AbsoluteFill>
    </>
  );

  return (
    <AbsoluteFill>
      {footage ? (
        <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
          <OffthreadVideo
            src={staticFile(FOOTAGE_FILE)}
            startFrom={secToFrames(RUNDOWN.startSec)}
            muted={!audio}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              // sharp footage "melts" into frosted glass; scale hides the soft blurred edges
              transform: `scale(${1 + 0.08 * bg})`,
              filter: `blur(${BG_BLUR_PX * bg}px) brightness(${1 - (1 - FOOTAGE_DIM) * bg}) saturate(${1 + 0.25 * bg})`,
            }}
          />
        </AbsoluteFill>
      ) : null}
      {footage ? layers : <AbsoluteFill style={{ opacity: OVERLAY_BG_OPACITY }}>{layers}</AbsoluteFill>}
    </AbsoluteFill>
  );
};
