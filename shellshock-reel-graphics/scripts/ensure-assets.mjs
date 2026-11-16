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
const vids = fs.existsSync("public") ? fs.readdirSync("public").filter((n) => /\.(mp4|mov|m4v|webm)$/i.test(n)) : [];
if (vids.length) console.log(`[assets] footage: public/${fs.existsSync("public/reel.mp4") ? "reel.mp4" : vids[0]}`);
else console.warn("[assets] NOTE: no video found in ./public -> rundown uses its original opaque liquid background (no footage, no voice).");
