import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { z } from "zod";
import { CallOverlay, callOverlaySchema } from "./CallOverlay";

/** The call UI baked onto your video (not transparent). The length follows the video file. */
export const callOnVideoSchema = callOverlaySchema.extend({
  videoSrc: z.string().describe("your video in video/public/media/. Replace the file to use the full-length one"),
});

export type CallOnVideoProps = z.infer<typeof callOnVideoSchema>;

export const CallOnVideo: React.FC<CallOnVideoProps> = ({ videoSrc, ...overlay }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <OffthreadVideo src={staticFile(videoSrc)} style={{ width: 720, height: 1280, objectFit: "cover" }} />
    <CallOverlay {...overlay} />
  </AbsoluteFill>
);
