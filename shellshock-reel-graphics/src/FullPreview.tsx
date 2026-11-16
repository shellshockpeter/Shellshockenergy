import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { FPS, HOOK, RUNDOWN, SAFE, secToFrames } from "./config";
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
  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #2b302d 0%, #171b19 55%, #0f1211 100%)" }}>
      <div
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
      </div>

      <Sequence from={secToFrames(HOOK.startSec)} durationInFrames={secToFrames(HOOK.durationSec)} layout="none">
        <HookOverlay />
      </Sequence>
      <Sequence from={secToFrames(RUNDOWN.startSec)} durationInFrames={secToFrames(RUNDOWN.endSec - RUNDOWN.startSec)} layout="none">
        <IngredientRundown />
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
