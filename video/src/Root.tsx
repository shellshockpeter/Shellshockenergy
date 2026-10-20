import "./index.css";
import { Composition } from "remotion";
import { DURATION, FPS, H, W } from "./brand/theme";
import { Explainer } from "./templates/Explainer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Explainer"
        component={Explainer}
        durationInFrames={DURATION}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{}}
      />
    </>
  );
};
