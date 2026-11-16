# shellshock-reel-graphics

Remotion (React + TypeScript) motion graphics for the Shell Shock Energy "Tropical Blitz" reel.
All output is **1080x1920 @ 30fps**.

| Composition | Length | Reel time | Notes |
|---|---|---|---|
| `HookOverlay` | 8.6s (258f) | 0.0 - 8.6s | **Transparent**. Layer over your packaging footage. |
| `IngredientRundown` | 39.4s (1182f) | 18.6 - 58.0s | Opaque, own liquid-glass background. **Frame 0 = reel 18.6s**. |
| `FullPreview` | 61.5s (1845f) | 0 - 61.5s | Hook + rundown at absolute times on a dark placeholder. Sync preview only. |

## Commands

```bash
npm install
npm run preview            # Remotion Studio
npm run render:hook        # out/hook-overlay.webm   (VP9 + alpha)
npm run render:hook:prores # out/hook-overlay.mov    (ProRes 4444 + alpha, if your editor dislikes WebM)
npm run render:rundown     # out/ingredient-rundown.mp4 (H.264, CRF 16)
npm run render:preview     # out/full-preview.mp4
npm run render:all         # hook + rundown + preview
npm run stills             # the 9 QA stills -> out/stills/ (reel times 2.5 4.5 6.5 21 27 33 40 46 55)
node scripts/stills.mjs --guides 6.5 55   # stills with the safe-zone box drawn
```

## Syncing to your voiceover

Everything lives in `src/config.ts`, in **absolute seconds from reel start**.
`AUDIO_OFFSET` shifts every cue: `+0.3` = everything lands 0.3s later, `-0.3` = earlier.
Drop the rundown in your editor at **18.6s** with no extra offset.

Two cues were not in your brief, so they are inferred and marked `// inferred` in the config:
Alpha GPC check at **31.3s** and Tongkat Ali check at **55.0s**. Move them to match your voice.

## Notes

- Safe zone: content stays in x 60-960, y 260-1500 (rundown cards are centred at x=525 so the 1.15x finale card fits).
- `HookOverlay` has no background anywhere. `backdrop-filter` can't blur your footage inside an alpha render
  (it only sees the transparent canvas), so hook glass is built from a dense tint + gradient border instead.
- The rundown fades in from the base colour over the first 10 frames and fades out over the last 12 (57.6 - 58.0s).
- Fonts come from `@remotion/google-fonts` (needs network on first render).
- Sandbox/CI: `remotion.config.ts` uses `/opt/pw-browsers/...` Chromium if present, or set `REMOTION_BROWSER=/path/to/chrome`.
