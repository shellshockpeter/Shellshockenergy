import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FOOTAGE_FILE, FPS, HOOK, RUNDOWN, SAFE, SFX_STEM_FILE, secToFrames } from "./config";
import { findFootage, hasStaticFile } from "./components/FootageBackdrop";
import { HEAD, MONO } from "./fonts";
import { HookOverlay } from "./HookOverlay";
import { IngredientRundown } from "./IngredientRundown";

const tc = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
};

/** Sync preview ONLY: hook + rundown at their absolute reel times over a dark placeholder. */
export const FullPreview: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => {
  const frame = useCurrentFrame();
  const footageFile = findFootage();
  const footage = footageFile !== null;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #2b302d 0%, #171b19 55%, #0f1211 100%)" }}>
      {footage ? (
        <OffthreadVideo src={staticFile(footageFile ?? FOOTAGE_FILE)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
      {hasStaticFile(SFX_STEM_FILE) ? <Audio src={staticFile(SFX_STEM_FILE)} /> : null}
      {footage ? null : <div
        style={{
          position: "absolute",
          left: 0,
          width: 1080,
          top: 1150,
          textAlign: "center",
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.12)",
        }}
      >
        PLACEHOLDER FOOTAGE
      </div>}

      <Sequence from={secToFrames(HOOK.startSec)} durationInFrames={secToFrames(HOOK.durationSec)} layout="none">
        <HookOverlay />
      </Sequence>
      <Sequence from={secToFrames(RUNDOWN.startSec)} durationInFrames={secToFrames(RUNDOWN.endSec - RUNDOWN.startSec)} layout="none">
        <IngredientRundown audio={false} />
      </Sequence>

      {showGuides ? (
        <div
          style={{
            position: "absolute",
            left: SAFE.left,
            top: SAFE.top,
            width: SAFE.right - SAFE.left,
            height: SAFE.bottom - SAFE.top,
            border: "2px dashed rgba(255,60,60,0.8)",
          }}
        />
      ) : null}

      <div style={{ position: "absolute", left: 0, width: 1080, top: 1760, textAlign: "center", fontFamily: MONO, fontSize: 30, color: "rgba(255,255,255,0.55)" }}>
        REEL {tc(frame / FPS)} / 01:01.5
      </div>
    </AbsoluteFill>
  );
};
