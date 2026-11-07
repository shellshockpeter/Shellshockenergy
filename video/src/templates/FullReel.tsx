import { AbsoluteFill, Audio, OffthreadVideo, Sequence, Series, staticFile } from "remotion";
import { z } from "zod";
import { NumberedList, numberedListSchema } from "./NumberedList";

/** The explainer is 70.77 s at 30 fps (2123 frames). */
export const EXPLAINER_FRAMES = 2123;

export const fullReelSchema = z.object({
  hook: numberedListSchema,
  explainerSrc: z.string().describe("the explainer video in video/public/media/ (its own audio plays)"),
  voiceoverSrc: z.string().describe("your voiceover in video/public/media/ (the voice track for the explainer)"),
  voiceoverDelayFrames: z.number().describe("shifts the voiceover later (30 per second). 1 = in sync with this explainer export"),
  explainerVolume: z
    .number()
    .min(0)
    .max(2)
    .describe("volume of the explainer file's OWN audio. 0 = off (its audio is not your voiceover). Raise it to layer it under the voiceover"),
  explainerFit: z
    .enum(["lowered", "full", "safe"])
    .describe("lowered = move the picture down so its top text clears Instagram's header (stays full-frame); full = exactly as exported; safe = shrink with a blurred fill"),
  explainerShift: z.number().describe("lowered: how far down to move the explainer (720×1280 space; 120 clears the Reels header)"),
  explainerScale: z.number().min(0.6).max(1).describe("safe fit: size of the explainer (0.8 = 80%)"),
  explainerTop: z.number().describe("safe fit: y position of the explainer's top edge (720×1280 space)"),
});

export type FullReelProps = z.infer<typeof fullReelSchema>;

/** Hook (you + the numbered list) → hard cut → the explainer video with your voiceover on top. */
export const FullReel: React.FC<FullReelProps> = ({ hook, explainerSrc, voiceoverSrc, voiceoverDelayFrames, explainerVolume, explainerFit, explainerShift, explainerScale, explainerTop }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Series>
      <Series.Sequence durationInFrames={hook.endFrame}>
        <NumberedList {...hook} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={EXPLAINER_FRAMES}>
        {explainerFit === "lowered" ? (
          <AbsoluteFill style={{ overflow: "hidden" }}>
            {/* the top two rows, stretched upward to fill the strip the shift opens at the top (no blur, still full frame) */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 720,
                height: 2,
                overflow: "hidden",
                transform: `scaleY(${explainerShift / 2})`,
                transformOrigin: "0 0",
              }}
            >
              <OffthreadVideo
                src={staticFile(explainerSrc)}
                muted
                style={{ position: "absolute", left: 0, top: 0, width: 720, height: 1280, objectFit: "cover" }}
              />
            </div>
            <OffthreadVideo
              src={staticFile(explainerSrc)}
              volume={explainerVolume}
              style={{ position: "absolute", left: 0, top: explainerShift, width: 720, height: 1280, objectFit: "cover" }}
            />
          </AbsoluteFill>
        ) : explainerFit === "full" ? (
          <OffthreadVideo src={staticFile(explainerSrc)} volume={explainerVolume} style={{ width: 720, height: 1280, objectFit: "cover" }} />
        ) : (
          <AbsoluteFill>
            {/* blurred, darkened copy fills the space the shrunk video leaves */}
            <OffthreadVideo
              src={staticFile(explainerSrc)}
              muted
              style={{ width: 720, height: 1280, objectFit: "cover", filter: "blur(28px) brightness(0.55)", transform: "scale(1.25)" }}
            />
            <OffthreadVideo
              src={staticFile(explainerSrc)}
              volume={explainerVolume}
              style={{
                position: "absolute",
                left: (720 - 720 * explainerScale) / 2,
                top: explainerTop,
                width: 720 * explainerScale,
                height: 1280 * explainerScale,
                objectFit: "cover",
                borderRadius: 14,
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              }}
            />
          </AbsoluteFill>
        )}
        <Sequence from={voiceoverDelayFrames}>
          <Audio src={staticFile(voiceoverSrc)} />
        </Sequence>
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
