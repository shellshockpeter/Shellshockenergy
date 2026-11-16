// Runs before preview/render: (re)builds the sound stem if config.ts is newer, and reports whether footage is present.
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const stem = "public/sfx_stem.wav";
const mtime = (p) => (fs.existsSync(p) ? fs.statSync(p).mtimeMs : 0);
const stale = !fs.existsSync(stem) || mtime("src/config.ts") > mtime(stem) || mtime("scripts/make_sfx.py") > mtime(stem);

if (stale) {
  console.log("[assets] building sound stem (sfx/sfx_stem.wav) ...");
  const r = spawnSync(process.platform === "win32" ? "python" : "python3", ["scripts/make_sfx.py"], { stdio: "inherit" });
  if (r.status !== 0) {
    console.warn("\n[assets] WARNING: sound generation failed (need python3 + `pip install numpy scipy`). Continuing WITHOUT sfx audio.\n");
  }
}
if (!fs.existsSync("public/reel.mp4")) {
  console.warn("[assets] NOTE: public/reel.mp4 not found -> rundown uses its original opaque liquid background (no footage, no voice).");
}
