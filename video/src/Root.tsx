import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { TrainerLaunch, TRAINER_DURATION } from "./TrainerLaunch";
import { EverythingInside, INSIDE_DURATION } from "./EverythingInside";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="TrainerLaunch"
        component={TrainerLaunch}
        durationInFrames={TRAINER_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="EverythingInside"
        component={EverythingInside}
        durationInFrames={INSIDE_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ clips: {} as Record<string, boolean> }}
      />
    </>
  );
};
