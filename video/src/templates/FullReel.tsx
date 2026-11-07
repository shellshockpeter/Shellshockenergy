import { AbsoluteFill, OffthreadVideo, Series, staticFile } from "remotion";
import { z } from "zod";
import { NumberedList, numberedListSchema } from "./NumberedList";

/** The explainer (with its voiceover built in) is 70.77 s at 30 fps. */
export const EXPLAINER_FRAMES = 2123;

export const fullReelSchema = z.object({
  hook: numberedListSchema,
  explainerSrc: z.string().describe("the explainer video in video/public/media/ (its own audio plays)"),
  explainerVolume: z.number().min(0).max(2).describe("1 = as exported. 1.2 matches it to the hook's loudness"),
  explainerFit: z
    .enum(["safe", "full"])
    .describe("safe = shrink the explainer so its top text clears Instagram's header (blurred fill at the sides); full = original full-bleed"),
  explainerScale: z.number().min(0.6).max(1).describe("safe fit: size of the explainer (0.8 = 80%)"),
  explainerTop: z.number().describe("safe fit: y position of the explainer's top edge (720×1280 space)"),
});

export type FullReelProps = z.infer<typeof fullReelSchema>;

/** Hook (you + the numbered list) → hard cut → the explainer (voiceover is built into the video). */
export const FullReel: React.FC<FullReelProps> = ({ hook, explainerSrc, explainerVolume, explainerFit, explainerScale, explainerTop }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Series>
      <Series.Sequence durationInFrames={hook.endFrame}>
        <NumberedList {...hook} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={EXPLAINER_FRAMES}>
        {explainerFit === "full" ? (
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
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
