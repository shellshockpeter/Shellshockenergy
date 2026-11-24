# Shell Shock tier list overlay

Standalone Remotion project (separate from any other project).

```
npm install
npx remotion studio
```

Compositions: `TierOverlay` (transparent, 1080x1920, 30fps, 4451 frames) and
`TierWithVideo` (puts `public/1123(1).mp4` underneath; gray placeholder if missing).
Toggle `DEBUG` in the Studio Props panel to see the face / tub zones.

All frame timings live in `src/tier/data.ts` (from the cue sheet).

Render:
```
npx remotion render TierWithVideo out/final.mp4
npx remotion render TierOverlay out/overlay.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le
```
