import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, HOOK, REEL_DURATION_SEC, RUNDOWN, WIDTH } from "./config";
import { HookOverlay } from "./HookOverlay";
import { IngredientRundown } from "./IngredientRundown";
import { FullPreview } from "./FullPreview";
import "./fonts";

const common = { fps: FPS, width: WIDTH, height: HEIGHT } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="HookOverlay" component={HookOverlay} durationInFrames={Math.round(HOOK.durationSec * FPS)} {...common} />
    <Composition
      id="IngredientRundown"
      component={IngredientRundown}
      durationInFrames={Math.round((RUNDOWN.endSec - RUNDOWN.startSec) * FPS)}
      {...common}
    />
    <Composition
      id="FullPreview"
      component={FullPreview}
      durationInFrames={Math.round(REEL_DURATION_SEC * FPS)}
      defaultProps={{ showGuides: false }}
      {...common}
    />
  </>
);
