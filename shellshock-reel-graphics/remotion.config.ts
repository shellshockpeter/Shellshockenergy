import { Config } from "@remotion/cli/config";
import fs from "node:fs";

Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");

// Sandbox/CI: use a pre-installed Chromium if present (Remotion otherwise downloads its own).
const local = [
  process.env.REMOTION_BROWSER,
  "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome",
].find((p) => p && fs.existsSync(p));
if (local) Config.setBrowserExecutable(local);
