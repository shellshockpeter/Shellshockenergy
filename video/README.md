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

## Commands

- `npm run dev`: preview and edit
- `npm run render:explainer`: render to `out/explainer.mp4`

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
