import { loadFont as loadInter } from "@remotion/google-fonts/InterTight";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const inter = loadInter("normal", { weights: ["600", "800", "900"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

export const HEAD = inter.fontFamily;
export const MONO = mono.fontFamily;
export const fontsReady = Promise.all([inter.waitUntilDone(), mono.waitUntilDone()]);
