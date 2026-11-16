# shellshock-reel-graphics

Remotion (React + TypeScript) motion graphics + sound design for the Shell Shock Energy "Tropical Blitz" reel.
All video is **1080x1920 @ 30fps**. Audio is **48 kHz / 24-bit**.

| Composition | Length | Reel time | Notes |
|---|---|---|---|
| `HookOverlay` | 8.6s (258f) | 0.0 - 8.6s | **Transparent**, sharp. Layer over your packaging footage. Nothing is blurred. |
| `IngredientRundown` | 39.4s (1182f) | 18.6 - 58.0s | **Composited**: your footage (frosted-glass blur) + graphics + your voice + sfx. Frame 0 = reel 18.6s. |
| `IngredientRundownOverlay` | 39.4s (1182f) | 18.6 - 58.0s | **Alpha** graphics + liquid layers only (no footage, no audio). For blurring in your editor. |
| `FullPreview` | 61.5s (1845f) | 0 - 61.5s | Footage + hook + rundown at absolute times, with voice + sfx. Sync preview only. |

## Setup

```bash
npm install
pip install numpy scipy        # only for the sound generator
```

Drop your source reel at **`public/reel.mp4`** (it must live in `public/`; change `FOOTAGE_PATH` in `src/config.ts` if you name it differently).
Without it, the rundown falls back to its original opaque liquid-glass background and nothing crashes.

## Commands and outputs

```bash
npm run preview                 # Remotion Studio (builds the sound stem first if needed)
npm run render:hook             # out/hook-overlay.webm         transparent VP9
npm run render:hook:prores      # out/hook-overlay.mov          transparent ProRes 4444
npm run render:rundown          # out/rundown_composited.mp4    footage + glass + graphics + voice + sfx
npm run render:rundown:overlay  # out/rundown_overlay.webm      alpha graphics only (background at 40%)
npm run render:preview          # out/full-preview.mp4          whole 61.5s, voice + sfx
npm run render:all              # hook + composited + overlay + preview
npm run sfx                     # rebuild sfx/*.wav and out/sfx_stem.wav
npm run stills                  # QA stills -> out/stills/   (node scripts/stills.mjs --guides 6.5 55 draws the safe zone)
npm run contrast -- out/stills/FullPreview-21.0s.png   # WCAG text-contrast check
```

Every render script first runs `scripts/ensure-assets.mjs`, which rebuilds the sound stem whenever `src/config.ts` is newer than it,
so changing `AUDIO_OFFSET` or any cue is picked up automatically.
Rendering the composited rundown decodes and blurs video on every frame, so expect it to be the slowest render (roughly 20-25 min on 4 cores).

## 1. Footage behind the rundown

Layers, bottom to top (`src/components/FootageBackdrop.tsx`):

1. your footage via `<OffthreadVideo>`, `startFrom` = 18.6s of reel time so it stays in sync, cover-fit, `blur(BG_BLUR_PX) brightness(FOOTAGE_DIM) saturate(1.25)`, scaled 1.08 to hide soft edges
2. dark-green gradient tint at `BG_TINT_OPACITY` (warms toward champagne gold in the Tongkat Ali finale)
3. liquid blobs + `feTurbulence` warp at `BLOBS_OPACITY`, blend mode `screen`, so your hands and boxes stay readable as moving shapes behind the glass
4. film grain + vignette

Cards, checks, type and dots are untouched.

| Setting (`src/config.ts`) | Default | Meaning |
|---|---|---|
| `FOOTAGE_PATH` | `./public/reel.mp4` | source video |
| `BG_BLUR_PX` | `22` | frosted-glass blur |
| `FOOTAGE_DIM` | `0.45` | footage brightness. **Spec was 0.55**, see "Legibility" |
| `BG_TINT_OPACITY` | `0.50` | green tint. **Spec was 0.40**, see "Legibility" |
| `BLOBS_OPACITY` | `0.35` | liquid layer |
| `OVERLAY_BG_OPACITY` | `0.40` | background group opacity in the alpha version |
| `BG_TRANSITION_FRAMES` | `12` | melt in / out length |

**Transition:** at 18.6s the blur, dim and background animate in over 12 frames (sharp footage melts into frosted glass).
At 58.0s they animate back over 12 frames: blur returns to 0px, the background layers fade out and the finale card fades with them, leaving sharp footage.

**Legibility.** I measured WCAG contrast of the card text against the glass behind it on deliberately bright stand-in footage (beige cardboard + white boxes).
With your 0.55 / 0.40 defaults the small labels fell to about 2.7-3.4:1 and the gold finale text to about 2.8-3.0:1, below the original design (gold was 3.5:1).
Dim 0.45 / tint 0.50 restores the finale to 3.6:1 and lifts the labels to 3.4+:1; white numbers and names are 5-8:1.
If your real footage is darker you can go back to 0.55 / 0.40. Run `npm run contrast` after changing it.

### Alpha overlay version (`rundown_overlay.webm`)

Graphics + liquid layers only, no footage, background group at 40% opacity so your footage shows through. No audio.
In your editor:

1. Put your footage on the lower track.
2. Put `rundown_overlay.webm` on the track above it, starting at **18.6s**.
3. On your **footage track, from 18.6s to 58.0s, add a Gaussian Blur** (about 22px at 1080x1920; editors scale blur differently, so judge by eye).
   Keyframe it 0 -> 22 over the first 12 frames and 22 -> 0 over the last 12 to match the composited version. Optionally drop brightness to about 45%.
4. The overlay's blobs use normal blending (not `screen`), because blend modes don't survive an alpha export.

## 2. Sound design

Everything is synthesised in `scripts/make_sfx.py` (numpy + scipy). Style: Apple / Stripe / Linear UI sound design. Soft, glassy, short.
Every sound is low-passed at 9 kHz, faded in/out (at least 3 ms, so no clicks), and high-passed at 120 Hz except `slam`, the gold sub swell and `whoosh`.

| File | Used for | Recipe | Peak |
|---|---|---|---|
| `check.wav`, `check_1..7.wav` | every neon check | 2.4 kHz sine + 3.6 kHz overtone, ~90 ms decay, 400 ms plate tail at 12% wet. **+1 semitone per beat** (7 beats = 7 dots) | -18 dBFS |
| `slam.wav` | "20" slam, "OFF" slam (-4 dB) | sine sweep 110 -> 45 Hz in 180 ms + 2-4 kHz noise transient (30 ms) | -10 dBFS |
| `pop.wav` | each panda | sine glide 500 -> 850 Hz, 45 ms, low-passed | -26 dBFS |
| `whoosh.wav` | card transitions, pandas flying into the 20, row 2 entrances (-9 dB), hook exit (-8 dB) | filtered noise sweep 400 Hz -> 5 kHz over 280 ms, soft attack/release, decorrelated stereo | -18 dBFS |
| `chip.wav` | SHOCK20 chip landing | 4 kHz glass click (20 ms) over 80 Hz thud (120 ms) | -16 dBFS |
| `tick.wav` | number count-ups | 1.8 kHz, 15 ms, one per 2 frames while counting | -30 dBFS |
| `tag.wav` | each keyword tag | airy swish + soft 220 Hz tone, 150 ms | -20 dBFS |
| `gold.wav` | Tongkat Ali finale only | A major add9 glass-harmonica chord (A4 C#5 E5 B5) with slow shimmer, ~2 s hall tail, 26 rising 5-8 kHz sparkle chimes for the gold dust, 55 Hz sub swell rising over 1.2 s | -10 dBFS |
| `ambient.wav` | under the rundown | warm A add9 pad, fades in at 18.6s and out by 58.0s | -32 dBFS |

Two honest notes: the chip's 80 Hz thud sits below the 120 Hz high-pass your spec asks for, so I added a 160 Hz body to the thud so it stays audible.
The check pitch climbs per **beat** (7 levels, matching the 7 progress dots), so the two checks inside beats 1 and 3 share a pitch.

**Mix.** Voiceover is the priority: all effects peak between -30 and -16 dBFS, except slam and gold at -10 dBFS as specified.
Every sound fires **2 frames (small) or 3 frames (big) before its visual hit** (`SFX_LEAD_FRAMES`).
Cues are built in `src/config.ts` (`SFX`, `sfxTimeline()`) from the same beat timings as the visuals, so they follow `AUDIO_OFFSET`.
The full cue table (105 cues: name, time, file) is in **`sfx/CUES.md`**.

**Outputs**
- `sfx/*.wav` - the individual effects
- `sfx/sfx_stem.wav` (also copied to `out/`) - all effects + ambient bed at reel length, 61.5s, **no voice**: drop it under your own audio
- `rundown_composited.mp4` and `full-preview.mp4` - your voice from `public/reel.mp4` mixed with the stem
- `rundown_overlay.webm` - silent

## Syncing

All times are absolute seconds from reel start in `src/config.ts`. `AUDIO_OFFSET` shifts every visual and sound cue
(`+0.3` = everything 0.3s later). Two cues were not in the original brief and are marked `// inferred`:
Alpha GPC check at 31.3s and Tongkat Ali check at 55.0s.

## Notes

- Safe zone: content stays in x 60-960, y 260-1500 (rundown cards are centred at x=525 so the 1.15x finale card fits).
- `HookOverlay` has no background and no blur. `backdrop-filter` cannot see your footage inside an alpha render, so hook glass is a dense tint + gradient border.
- Fonts come from `@remotion/google-fonts` (needs network on first render).
- Sandbox/CI: `remotion.config.ts` uses `/opt/pw-browsers/...` Chromium if present, or set `REMOTION_BROWSER=/path/to/chrome`.
