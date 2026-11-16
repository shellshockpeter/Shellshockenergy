import React, { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import { AUDIO_OFFSET, FPS } from "./config";

/** Reel time (seconds) at local frame 0 of the enclosing composition/sequence. */
const StartCtx = createContext(0);
export const ReelStart: React.FC<{ sec: number; children: React.ReactNode }> = ({ sec, children }) => (
  <StartCtx.Provider value={sec}>{children}</StartCtx.Provider>
);

/** Local frame at which a cue (absolute reel seconds, + AUDIO_OFFSET) fires. */
export const useCueFrame = () => {
  const start = useContext(StartCtx);
  return (sec: number) => Math.round((sec + AUDIO_OFFSET - start) * FPS);
};

/** Current reel time in seconds (no offset). */
export const useReelTime = () => {
  const start = useContext(StartCtx);
  return start + useCurrentFrame() / FPS;
};
