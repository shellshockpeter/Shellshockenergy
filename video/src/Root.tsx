import "./index.css";
import { Composition } from "remotion";
import { DURATION, FPS, H, W } from "./brand/theme";
import { Explainer, explainerSchema } from "./templates/Explainer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Explainer"
        component={Explainer}
        schema={explainerSchema}
        durationInFrames={DURATION}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          mediaSrc: "",
          hook: {
            line1: "Posting Every Day,",
            lead: "Still ",
            accent: "No Clients",
            tail: "",
            cards: ["MON", "TUE", "WED"],
            counterValue: "0",
            counterLabel: "new clients",
            captions: [
              { from: 8, to: 27, text: "Most people" },
              { from: 28, to: 53, text: "post every day" },
              { from: 54, to: 70, text: "and still" },
              { from: 71, to: 103, text: "get no *clients.*" },
            ],
          },
          problem: {
            captions: [
              { from: 104, to: 127, text: "The problem" },
              { from: 128, to: 161, text: "isn't your content." },
              { from: 162, to: 209, text: "It's your *system.*" },
            ],
          },
          steps: {
            number: "3",
            title: "Steps To Fix It",
            names: ["Hook", "Story", "Offer"],
            captions: [
              { from: 216, to: 238, text: "Step one:" },
              { from: 239, to: 257, text: "*hook.*" },
              { from: 258, to: 279, text: "Step two:" },
              { from: 280, to: 297, text: "*story.*" },
              { from: 298, to: 324, text: "Step three:" },
              { from: 325, to: 344, text: "*offer.*" },
            ],
          },
          proof: {
            line1: "Run It For",
            accent: "Thirty",
            tail: " Days",
            dayLabel: "Day",
            resultPrefix: "+",
            result: 12,
            resultLabel: "new clients",
            captions: [
              { from: 351, to: 365, text: "Do that" },
              { from: 366, to: 398, text: "for *thirty* days," },
              { from: 399, to: 415, text: "and watch" },
              { from: 416, to: 449, text: "what happens." },
            ],
          },
        }}
      />
    </>
  );
};
