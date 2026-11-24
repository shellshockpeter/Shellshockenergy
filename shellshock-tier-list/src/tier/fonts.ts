import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Display font: Robot Reavers (public/fonts). No fallback substitution on purpose.
export const DISPLAY = "Robot Reavers";
// Inter is only for tiny dose chips + the FDA disclaimer.
export const SANS = "Inter";

loadFont({
  family: DISPLAY,
  url: staticFile("fonts/RobotReavers-Italic.otf"),
  weight: "400",
});
loadFont({
  family: SANS,
  url: staticFile("fonts/Inter-700.woff2"),
  weight: "700",
});

// Measured advance of the display font ≈ 0.75em per glyph (caps == lowercase).
export const DISPLAY_ADV = 0.8; // 0.75 advance + letter-spacing allowance
export const fitSize = (text: string, width: number, max: number) =>
  Math.min(max, width / (text.length * DISPLAY_ADV));
