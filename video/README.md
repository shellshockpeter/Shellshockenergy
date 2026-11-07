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

Composition **NumberedList** (6.6 s): your clip on top (trimmed to start at your first word), a numbered list of signs below. In the hook the signs stay an **unreadable blur** the whole time (that is the point: keep them watching) while a gold highlight scans down the rows and the last sign gets a shock beat (punch-in, shake, flash, text-scramble).

In the Props panel: the two title lines (`*stars*` mark the gold word), the teaser line, each sign's `label` and `ping` frame (30 per second). **`unblurOnPing`**: leave OFF for the hook. Turn it ON to make the payoff video: each sign decodes into readable text when its highlight lands. `mediaFocusY` aims the crop at the face.

The clip is `public/media/peter-hook-1080.mp4` (1080×1920 copy of the phone video, starting at 3.6 s). To use another clip, drop it in `public/media/` and set `mediaSrc`, and change the composition length in `src/Root.tsx` (`durationInFrames`).

## Full reel (hook + explainer + voiceover)

Composition **FullReel** (77.3 s): the NumberedList hook, a hard cut, then your explainer video with the separate voiceover (`public/media/explainer.mp4`, `public/media/voiceover.mp3`; both 70.7 s). The hook's text is editable in the Props panel under `hook`.

`explainerFit` = **full** (default) plays your explainer full-frame, as you made it. **safe** shrinks it to 80% with a blurred fill at the sides so its top text clears Instagram's header (optional). `explainerScale` / `explainerTop` fine-tune it.

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
