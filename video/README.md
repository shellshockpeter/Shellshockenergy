# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

# ShellShock reel templates

Remotion templates for ShellShock Energy (9:16, 30 fps, 15 s). Design spec: `../STYLE.md`.

## Editing the text and content

1. `npm run dev`, open http://localhost:3000, pick **Explainer**.
2. Open the **Props** panel (right side). Every word on screen is a field: titles, the accent keyword, card labels, counter, step names, the final number, and every caption.
3. Captions have `from` / `to` (frame numbers, 30 per second) and `text`. Wrap a word in `*stars*` to set it in the gold accent font: `get no *clients.*`.
4. Click **Save** in the Props panel to keep your edits (it writes them into `src/Root.tsx`).
5. **Your footage:** put the video in `public/media/`, then set `mediaSrc` to `media/yourclip.mp4`. Empty shows a placeholder block.

The cuts and animations are timed in code (`src/templates/Explainer.tsx`); the words are not.

## Numbered-list reel (the hook)

Composition **NumberedList** (5.2 s): your clip **full frame** (trimmed to start at your first word) with a liquid-glass numbered chart floating over the top. In the hook the signs stay an **unreadable blur** the whole time (that is the point: keep them watching) while a gold highlight scans down the rows and the last sign gets a shock beat (punch-in, shake, flash, text-scramble).

In the Props panel: **`endFrame`** (the frame the hook ends and cuts to the next clip; set it just after you stop talking, currently 156 = 5.2 s), **`buildFrame`**, the two title lines (`*stars*` mark the gold word), the teaser line, each sign's `label` and `ping` frame (30 per second). **`unblurOnPing`**: leave OFF for the hook. Turn it ON to make the payoff video: each sign decodes into readable text when its highlight lands.

The clip is `public/media/peter-hook-1080.mp4` (1080×1920 copy of the phone video, starting at 3.6 s). To use another clip, drop it in `public/media/` and set `mediaSrc`, and change the composition length in `src/Root.tsx` (`durationInFrames`).

## Full reel (hook + explainer + voiceover)

Composition **FullReel** (75.9 s): the NumberedList hook, a hard cut, then your explainer video (`public/media/explainer.mp4`, 70.8 s) with your voiceover (`public/media/voiceover.mp3`) on top. The explainer file's own audio is **off** (`explainerVolume` 0): analysis showed it is not your voiceover. `voiceoverDelayFrames` = 1 keeps your voiceover in sync with this export (the picture is your first explainer delayed by one frame). The hook's text is editable in the Props panel under `hook`.

`explainerFit` = **lowered** (default) moves the explainer picture down by `explainerShift` (120) so its top text (section titles, the offer) clears Instagram's "Reels / Friends" header; the strip it opens at the top is filled by stretching the picture's top edge, so it stays full-frame with no blur (the bottom 120 px, which Instagram's caption area covers, is cropped). **full** = exactly as exported. **safe** = shrink to 80% with a blurred fill.

## Call overlay (transparent, for your own video)

Composition **CallOverlay**: a phone-call motion graphic with a **transparent background** to overlay on any video. An iPhone-style island rings ("Calling…"), expands into a live call banner (your logo pops in, name, a ticking timer, waveform, call buttons), then collapses back to a pill, and repeats. The timer counts up the whole time. Default length 53 s; one repeat is 265 frames, so 53 s is exactly 6 repeats.

Props: `callerName`, `status`, `logoSrc` (transparent PNG in `public/`), `seconds`, `loopFrames`, `timerStartSeconds`, `y` (vertical position), `showButtons`.

- `npm run render:call`: `out/call-overlay.mov`, ProRes 4444 with alpha, 1080×1920 (works in Final Cut, Premiere, DaVinci, CapCut). Large file (about 800 MB for 53 s).
- `npm run render:call:webm`: `out/call-overlay.webm`, VP9 with alpha, much smaller.
- For 720×1280 (smaller), remove `--scale=1.5` from the script.

## Call UI baked onto your video

Composition **CallOnVideo**: your video (`public/media/gym-call.mp4`) with the call UI on top (not transparent). The call is already in progress at frame 0 (no ringing), the timer starts at **00:17** (`timerStartSeconds`) and counts up, and the video **ends when your clip ends**: the length is read from the video file, so to use the full 53 s version, replace `public/media/gym-call.mp4` with it (same name) and the length and timer follow. `npm run render:call:video` writes `out/gym-call-with-ui.mp4` at 1080×1920 (your clip is 720p, so the UI is sharp and the video is upscaled).

### First half of the call (ring, pickup, hangup)

Composition **CallOnVideoFirstHalf** (`public/media/gym-call-first-half.mp4`, 30.3 s): the island rings and vibrates "Calling…" from frame 0, she picks up at **1.0 s** (`pickupFrame` 30: green "Connected" burst, the island expands into the live banner), the timer starts at 00:00 on pickup, and at **15.2 s** (`hangupFrame` 456) the call is hung up. `afterHangup` = **fade** (default for this half): the hangup animation plays (end button pulses, "Call ended", timer frozen at 00:14) and the whole call UI is completely gone by **16.0 s** (`uiEndFrame` 480; it fades out in the last 5 frames), leaving your video clean to the end. **leave** collapses it to a red bar then slides it away; **stay** keeps the red bar to the end. `npm run render:call:first` makes `out/gym-call-first-half-with-ui.mp4`. In the Props panel, `pickupFrame` / `hangupFrame` are frames (30 per second); `-1` for both = no ring and no hangup (the second half of the call).

## Commands

- `npm run dev`: preview and edit
- `npm run render:explainer`: render to `out/explainer.mp4`
- `npm run render:reel`: render the full reel to `out/full-reel.mp4` (1080×1920)
- `npm run render:numbered`: render the numbered-list reel to `out/numbered-list.mp4` at **1080×1920** (the layout is 720×1280, rendered at 1.5× for sharpness)

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
