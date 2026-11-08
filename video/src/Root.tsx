import "./index.css";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { DURATION, FPS, H, W } from "./brand/theme";
import { Explainer, explainerSchema } from "./templates/Explainer";
import { parseMedia } from "@remotion/media-parser";
import { CallOnVideo, callOnVideoSchema, type CallOnVideoProps } from "./templates/CallOnVideo";
import { CallOverlay, callOverlaySchema, type CallOverlayProps } from "./templates/CallOverlay";
import { FullReel, EXPLAINER_FRAMES, fullReelSchema, type FullReelProps } from "./templates/FullReel";
import { NumberedList, numberedListSchema, type NumberedListProps } from "./templates/NumberedList";

// The hook ends right after you stop talking; its length is a prop, so the total length follows it.
const hookMeta: CalculateMetadataFunction<NumberedListProps> = ({ props }) => ({ durationInFrames: props.endFrame });
const reelMeta: CalculateMetadataFunction<FullReelProps> = ({ props }) => ({
  durationInFrames: props.hook.endFrame + EXPLAINER_FRAMES,
});

const callMeta: CalculateMetadataFunction<CallOverlayProps> = ({ props }) => ({
  durationInFrames: Math.round(props.seconds * FPS),
});

// The call-on-video length follows the video file itself, so swapping in the full-length clip just works.
const callOnVideoMeta: CalculateMetadataFunction<CallOnVideoProps> = async ({ props }) => {
  try {
    const { durationInSeconds } = await parseMedia({
      src: staticFile(props.videoSrc),
      fields: { durationInSeconds: true },
      acknowledgeRemotionLicense: true,
    });
    if (durationInSeconds) return { durationInFrames: Math.round(durationInSeconds * FPS) };
  } catch {
    // fall through to the `seconds` prop
  }
  return { durationInFrames: Math.round(props.seconds * FPS) };
};

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
      <Composition
        id="NumberedList"
        component={NumberedList}
        schema={numberedListSchema}
        durationInFrames={156}
        calculateMetadata={hookMeta}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          mediaSrc: "media/peter-hook-1080.mp4",
          endFrame: 156,
          buildFrame: 3,
          teaser: "The 4th one will shock you",
          teaserAfter: "Wait for number 4",
          title1: "4 Signs Your Pre-Workout",
          title2: "Is Killing Your *Gains*",
          items: [
            { label: "Caffeine crash", ping: 48 },
            { label: "Lack of focus", ping: 72 },
            { label: "Tastes like battery acid", ping: 102 },
            { label: "Taking too much", ping: 130 },
          ],
          unblurOnPing: false,
          shockLast: true,
        }}
      />
      <Composition
        id="FullReel"
        component={FullReel}
        schema={fullReelSchema}
        durationInFrames={156 + EXPLAINER_FRAMES}
        calculateMetadata={reelMeta}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          explainerSrc: "media/explainer.mp4",
          voiceoverSrc: "media/voiceover.mp3",
          voiceoverDelayFrames: 1,
          explainerVolume: 0,
          explainerFit: "lowered",
          explainerShift: 120,
          explainerScale: 0.8,
          explainerTop: 126,
          hook: {
            mediaSrc: "media/peter-hook-1080.mp4",
            endFrame: 156,
          buildFrame: 3,
            teaser: "The 4th one will shock you",
            teaserAfter: "Wait for number 4",
            title1: "4 Signs Your Pre-Workout",
            title2: "Is Killing Your *Gains*",
            items: [
              { label: "Caffeine crash", ping: 48 },
              { label: "Lack of focus", ping: 72 },
              { label: "Tastes like battery acid", ping: 102 },
              { label: "Taking too much", ping: 130 },
            ],
            unblurOnPing: false,
            shockLast: true,
          },
        }}
      />
      <Composition
        id="CallOverlay"
        component={CallOverlay}
        schema={callOverlaySchema}
        durationInFrames={1590}
        calculateMetadata={callMeta}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          callerName: "Gym Scene",
          status: "On call",
          logoSrc: "brand/gym-scene-logo.png",
          seconds: 53,
          loopFrames: 265,
          timerStartSeconds: 17,
          y: 172,
          showButtons: true,
          pickupFrame: -1,
          hangupFrame: -1,
          afterHangup: "stay",
        }}
      />
      <Composition
        id="CallOnVideo"
        component={CallOnVideo}
        schema={callOnVideoSchema}
        durationInFrames={647}
        calculateMetadata={callOnVideoMeta}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          videoSrc: "media/gym-call.mp4",
          callerName: "Gym Scene",
          status: "On call",
          logoSrc: "brand/gym-scene-logo.png",
          seconds: 21.57,
          loopFrames: 265,
          timerStartSeconds: 17,
          y: 172,
          showButtons: true,
          pickupFrame: -1,
          hangupFrame: -1,
          afterHangup: "stay",
        }}
      />
      <Composition
        id="CallOnVideoFirstHalf"
        component={CallOnVideo}
        schema={callOnVideoSchema}
        durationInFrames={910}
        calculateMetadata={callOnVideoMeta}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          videoSrc: "media/gym-call-first-half.mp4",
          callerName: "Gym Scene",
          status: "On call",
          logoSrc: "brand/gym-scene-logo.png",
          seconds: 30.33,
          loopFrames: 265,
          timerStartSeconds: 0,
          y: 172,
          showButtons: true,
          pickupFrame: 30,
          hangupFrame: 456,
          afterHangup: "stay",
        }}
      />
    </>
  );
};
