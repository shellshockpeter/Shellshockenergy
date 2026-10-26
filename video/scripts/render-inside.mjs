#!/usr/bin/env node
/**
 * Renders EverythingInside with whichever recordings exist in public/clips.
 *   public/clips/clip01.mp4 … clip12.mp4  (names from promo/everything-inside-script.md)
 * Missing clips show a labeled slot, so you can render at any point.
 *
 *   node scripts/render-inside.mjs [out/everything-inside.mp4]
 */
import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] ?? "out/everything-inside.mp4";
const clips = {};
for (let i = 1; i <= 12; i++) {
  const id = `clip${String(i).padStart(2, "0")}`;
  clips[id] = existsSync(resolve(root, "public/clips", `${id}.mp4`));
}
const have = Object.entries(clips).filter(([, v]) => v).map(([k]) => k);
console.log(`clips found: ${have.length}/12 ${have.join(" ")}`);

mkdirSync(resolve(root, "out"), { recursive: true });
const args = [
  "remotion", "render", "EverythingInside", out,
  "--codec=h264", "--crf=16",
  `--props=${JSON.stringify({ clips })}`,
];
if (process.env.REMOTION_BROWSER) args.push(`--browser-executable=${process.env.REMOTION_BROWSER}`);
const r = spawnSync("npx", args, { cwd: root, stdio: "inherit" });
process.exit(r.status ?? 1);
