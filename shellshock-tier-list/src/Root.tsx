import { Composition } from "remotion";
import { TierOverlay } from "./tier/TierOverlay";
import { TierWithVideo } from "./tier/TierWithVideo";
import { FPS, H, TOTAL_FRAMES, W } from "./tier/data";

export const RemotionRoot: React.FC = () => (
  <>
    {/* Transparent overlay only — add your video as a layer in Studio. */}
    <Composition
      id="TierOverlay"
      component={TierOverlay}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={TOTAL_FRAMES}
      defaultProps={{ DEBUG: false }}
    />
    {/* Drop lower_res.mp4 into public/ — shows a gray placeholder until then. */}
    <Composition
      id="TierWithVideo"
      component={TierWithVideo}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={TOTAL_FRAMES}
      defaultProps={{ DEBUG: false }}
    />
  </>
);
