# PlugBeat — ShellShock Energy transparent overlay

1080×1920 (9:16), 30 fps, 240 frames (8 s), **transparent background**.
A glass product card (tub + price + URL) and a `SHOCK20` split-flap coupon chip
that sit on top of live footage. The centre of the frame (~y 580–1290) is left
empty for the money counter.

```bash
npm run studio       # preview / edit props in Remotion Studio
npm run render       # out/plug-beat.mov  (ProRes 4444 + alpha)
npm run render:webm  # out/plug-beat.webm (VP9 + alpha, fallback)
```

Props (editable in Studio): `tubPrice`, `salePrice`, `siteUrl`, `brandName`, `code`,
`discountLabel`, `finePrint`. (`sfx` is auto-detected — leave it.)

## Timeline

| Frames  | What |
| ------- | ---- |
| 30–195  | Tub card: spring in from right (30), breathing glow, exit right (180–195) |
| 105–195 | Coupon chip: slam (scale 1.6→1 + 6-frame shake) at 105, letters flip 3 frames apart, ✓ APPLIED ≈137, 2 glow pulses, exit left (180–195) |

All timings live in `src/theme.ts` (`TIMING`).

## Files

- `src/theme.ts` — colours, canvas/safe zones, timing, fonts (`Robot Reavers` via `@remotion/fonts`, Inter via `@remotion/google-fonts`)
- `src/TubCard.tsx`, `src/CouponChip.tsx`, `src/GlassPanel.tsx`, `src/HexPattern.tsx` — reusable pieces
- `src/useFitFontSize.ts` — keeps long prop text from overflowing
- `src/PlugBeat.tsx` — composition, props schema, sound wiring

## Sound (optional)

Drop your own files in `public/sfx/`:

- `tick.mp3` — one tick per flipping letter
- `stamp.mp3` — cha-ching stamp at frame 105

Missing files are skipped (silent render) and a `TODO` is printed.

## Notes

- Alpha needs PNG frames; `remotion.config.ts` sets `Config.setVideoImageFormat('png')`.
- If Remotion can't download its own Chrome (offline/proxied machine), add
  `--browser-executable=/path/to/chrome` to the render/still commands.
- Safe zones: 80 px sides, 150 px top, 250 px bottom. Panels are 880 px wide
  (100 px gutter) so the spring overshoot never crosses the 80 px side margin.

---

# Map overlay (liquid-glass route map) — 4 segments

Transparent 1080×1920 @ 30 fps overlays that sit on top of live footage. Cut between them in your editor:

| Composition | Frames | What happens |
| ----------- | ------ | ------------ |
| `MapIntro`  | 120 | Glass map spins in (rotateZ −90°→0, tilt 55°→22°, scale-up + small overshoot), locks to HOME, 3 pending pins drop in (thud), route draws |
| `MapSlam1`  | 90  | Pin 1 (Whole Foods, Avon) slams; 2 + 3 pending |
| `MapSlam2`  | 90  | Pin 1 DONE (static); pin 2 (CVS, Avon) slams; 3 pending |
| `MapSlam3`  | 90  | Pins 1 + 2 DONE (static); pin 3 (Vitamin Shopper, West Hartford) slams |

Slam timing: 0–10 hold · 10–30 push in (1.3×) · **30 SLAM** (pin 1.8→1, 6-frame shake, shockwave, fills gold,
✓ draws, DONE stamps) · 50–70 pull back to the exact HOME view · 70–90 still (clean cut point).

```bash
npm run render:map              # all four -> out/map-intro.mov, map-slam-1.mov, map-slam-2.mov, map-slam-3.mov
npm run render:map-slam-2       # a single segment (also: map-intro, map-slam-1, map-slam-3)
npm run render:map:webm         # VP9 + alpha fallbacks (or render:map-slam-2:webm ...)
```

Props (Studio): `showPending` (default true — dim pins/route visible before each slam; false hides un-slammed pins),
`title`, `subtitle`. `sfx` is auto-detected.

## ⚠️ Replace the placeholder store coordinates

`src/mapConfig.ts` → `STOPS` holds PLACEHOLDER lat/lng that merely sit inside the right towns. Replace them with
the real store coordinates (Google Maps: right-click the store → click the lat,lng to copy). Also set each stop's
`labelSide` / `labelDx` so labels never touch each other or the pins, then run the checks below.

## Consistency rules (why the cuts are clean)

- One shared config (`src/mapConfig.ts`) owns the projection, panel, HOME camera, stops, label sides and colours.
- Every segment starts and ends on the identical HOME camera object; the camera math (`src/camera.ts`) drives both the
  CSS 3D transform of the glass **and** the screen position of pins/labels, so they can't drift apart.
- DONE pins use one code path (`DestinationPin`): solid gold, ✓, DONE stamp, faint steady glow, no pulse, no entrance.
  A slammed pin switches to that exact path 24 frames after impact.
- Pulses and the moving route dashes use a 30-frame loop, so they stay continuous across every cut. No randomness.

## Checks

```bash
npm run layout-check                    # slab inside safe zones? pins 1<->2 >= 150px apart?
npx tsx scripts/place-labels.ts         # finds clear spots for neighbour-town labels (paste into TOWN_LABELS)
npx remotion still MapSlam1 out/map/MapSlam1_89.png --frame=89
npx remotion still MapSlam2 out/map/MapSlam2_0.png  --frame=0
python3 scripts/compare-cuts.py         # done pins pixel-identical across cuts? (needs numpy + pillow)
```

## Geography (read this)

Real boundary downloads (Census TIGER / CT Open Data) were not reachable when this was built, so the town outlines are
**traced from `public/ref/hartford-towns.jpg`** (`scripts/trace_towns.py`: watershed segmentation → smoothed polygons →
affine georeference against approximate town centres, ~1.6 km RMS). They give the right neighbours and relative positions
but are **not survey-accurate**. To use real data, replace `src/geo/townPaths.ts` (see the docstring in `trace_towns.py`).
The map is zoomed so pins 1 and 2 are ≥150 px apart, so only part of the county fits: Simsbury, Canton (sliver), Bloomfield,
Farmington, Newington and New Britain are labelled; Burlington and Hartford fall almost entirely outside the panel.

## Sound (optional, don't ship fake files)

`public/sfx/whoosh.mp3` (intro spin), `thud.mp3` (pins landing in the intro), `stamp.mp3` (frame 30 of each slam).
Missing files are skipped and a `TODO` is printed.
