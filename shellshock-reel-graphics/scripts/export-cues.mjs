// Prints the SFX cue timeline (with AUDIO_OFFSET applied) as JSON. Used by make_sfx.py.
import { sfxTimeline, AMBIENT, REEL_DURATION_SEC, AUDIO_OFFSET, FPS } from "../src/config.ts";

console.log(JSON.stringify({ fps: FPS, audioOffset: AUDIO_OFFSET, reelDuration: REEL_DURATION_SEC, ambient: AMBIENT, cues: sfxTimeline() }));
