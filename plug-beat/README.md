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

Props (editable in Studio): `tubPrice`, `siteUrl`, `brandName`, `code`,
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
