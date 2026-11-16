// Usage: node scripts/stills.mjs [--guides] [comp] t1 t2 ...   (t = absolute reel seconds)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const browserExecutable = [process.env.REMOTION_BROWSER, "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome"].find((p) => p && fs.existsSync(p)) ?? null;

const args = process.argv.slice(2);
const guides = args.includes("--guides");
if (guides) args.splice(args.indexOf("--guides"), 1);
const comp = args[0] && isNaN(Number(args[0])) ? args.shift() : "FullPreview";
const times = args.length ? args.map(Number) : [2.5, 4.5, 6.5, 21, 27, 33, 40, 46, 55];

const entry = path.resolve("src/index.ts");
const outDir = path.resolve("out/stills");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: entry });
const inputProps = { showGuides: guides };
const composition = await selectComposition({ serveUrl, id: comp, inputProps, browserExecutable });
const offset = comp === "IngredientRundown" ? 18.6 : 0;

for (const t of times) {
  const frame = Math.round((t - offset) * composition.fps);
  const file = path.join(outDir, `${comp}-${t.toFixed(1)}s${guides ? "-guides" : ""}.png`);
  await renderStill({ composition, serveUrl, output: file, frame, inputProps, imageFormat: "png", browserExecutable });
  console.log("wrote", file);
}
