# ShellShock Energy — Reel Template Style Spec

> **Brand overrides in §0.1 win.** Sections 1–3 record the reference templates as measured (orange, serif italic, Inter). Take layout, timing and easing from them, and take colour and type from §0.1.

Step 1 of 2: analysis only. No Remotion code is written yet.

## 0. Read this first

### Status and gaps

| Item | State |
|---|---|
| Templates analysed | **7 of 7.** `ranking-format`, `explainer-panel-reel`, `youtube-clips`, `business-short-form-reels_1`, `visual-essay-reel`, `split-reel`, `glass-explainer-reel`. All verified 720×1280 / 30 fps / 450 f. |
| `/reference` and `/brand` | Neither folder exists in this environment. The mp4s came in as chat attachments. There are no brand files (logo, fonts, packaging). |
| Accent colour | **Decided: gold gradient on matte black** (see §0.1). The orange values in §1–§3 are the *reference templates' measurements*; §0.1 overrides them for ShellShock. |
| Source specs | All seven are 720×1280, 30 fps, 450 frames (15.0 s). I verified this with `ffprobe`. |

### Frames and how they were measured

- **Frames:** 30 per video at 0.5 s intervals, plus 1-frame sheets of every transition. Frame *k* in `frames/<template>/f_NNN.jpg` is at `t = (NNN−1)·0.5 s`.
  Location: `/tmp/claude-0/-home-user-Shellshockenergy/75bb84b7-8c46-5b69-8007-f43f380180a4/scratchpad/frames/`
- **Frame numbers in this doc** are absolute (0–449) at 30 fps.
- **Pixel numbers** are measured on the 720×1280 frames. Treat positions as **±6 px** and font sizes as **±10 %**. They are bounding-box estimates, not font metrics.
- **Timing:** where I sampled every frame I give exact frames. Where I sampled every 4–6 frames I mark it `~` (±3 f).
- **Easing curves** are inferred from frame positions. They are not read from a source file, so they are "closest standard curve" and not exact.
- **Step 2 verification:** I will overlay each render on the reference frames and fix drift before trusting any value here.

---

## 0.1 ShellShock overrides (locked, these supersede §1–§3)

The reference measurements in §1–§3 stay as the source of truth for **layout, timing and easing**. Wherever they say orange, serif italic or Inter, apply this table instead.

### Accent: gold gradient on black

```css
/* accent-fill: solid shapes (pills, chips, cells, bars, counter-box fill) */
background:
  linear-gradient(180deg, transparent calc(100% - 5px), #855F00 calc(100% - 5px)),
  linear-gradient(90deg, #FFB700, #FFD466, #FFE299);
```

| Token | Value | Replaces / used for |
|---|---|---|
| `accent-fill` | the two-layer CSS above (5 px dark-gold lip along the bottom, gold sweep on top) | every orange **filled** shape: label pills, step number discs, lit grid cells, "new clients" pill, tag chips, selection-box fill |
| `accent-text` | `linear-gradient(90deg,#FFB700,#FFD466,#FFE299)` via `background-clip:text` (no lip) | every orange **word or numeral**: accent keywords, "0", "12", "30", "+12" |
| `accent` (solid) | `#FFB700` | thin strokes where a gradient is impractical: rings, connectors, chart curve, end dots, underlines, borders |
| `accent-edge` | `#855F00` | the bottom lip, plus 1 px shadow edges |
| `accent-hi` | `#FFE299` | highlights, sheen, doc highlight (replaces `#FBE58A`) |
| `accent-dim` | `#402E00` (accent at 25 % over black) | finished 30-day cells, inactive states (replaces `#43240C`) |
| `glow` | `rgba(255,183,0,.25)`, blurred 80–120 px | all bokeh blobs and top/bottom washes (replace `#522D12`, `#4D250F`, `#4A2B10`) |
| `bg` | **`#0A0A0B` matte black** + the template grain, no gloss | replaces `#000` / `#040404` / `#090906` |
| `on-accent` | **`#0A0A0B` (black)** | text sitting on a gold fill. White on gold fails contrast, so every "white text on orange pill" in the reference becomes black text. |

Lip rule: 5 px on shapes ≥40 px tall, 3 px on 20–40 px, none below 20 px (the lip would dominate). Rings, connectors, the chart curve and underlines use solid `#FFB700`.

Things that stay as-is: the tier-list colours (T1), semantic green `#3A874D` and red `#B12320` (dashboard cells and the "0 enquiries" pill), white UI mock cards, glass greys, `text` white.

**Two collisions to know about:**
- T1's `#FCE33A` yellow captions and card titles are now too close to the gold. Make them `accent-text` and keep verdict phrases white, so gold = the thing to read.
- The 30-day grid goes gold-lit → dark-gold-dim. That is a smaller brightness range than orange→brown, so step 2 may need the dim state a touch darker than `#402E00` to keep the "completed" read.

### Type: Robot Reavers + Teko

| Role (reference) | ShellShock |
|---|---|
| Serif-italic accent word ("*clients*", "*system*", "*thirty*", "*hook*") | **Robot Reavers Italic**, filled with `accent-text` |
| Hero numerals ("0", "12", "30", "+12", step numbers) | **Robot Reavers Italic**, `accent-text` (or white while counting, as in the reference) |
| Captions, titles, UI labels, counters' labels (Inter / Inter Tight) | **Teko** (fallback `sans-serif`) |

```css
@font-face {
  font-family: 'Robot Reavers';
  src: url('/fonts/Robot_Reavers_Italic.woff2?v=3') format('woff2'),
       url('/fonts/Robot_Reavers_Italic.woff?v=3') format('woff');
  font-style: italic;
}
/* usage */ font-family: 'Robot Reavers', sans-serif;
```

Notes that affect the build:
- **Robot Reavers files are in** `video/public/fonts/Robot_Reavers_Italic.woff2` and `.woff` (family "Robot Reavers", Italic, 110 glyphs, 1024 upm). Coverage is full ASCII, digits, `+ £ € ©` and curly quotes, which is everything the templates use. Load with `loadFont` and `staticFile("fonts/Robot_Reavers_Italic.woff2")` rather than the `/fonts/…?v=3` web path.
- **Teko sizing (corrected after measuring):** Teko Semibold needs only about **+15 %** over the reference's Inter size to match both cap height and text width (e.g. 40 px → ~46 px; "Posting Every Day," renders 296 px vs 291 px in the reference). My earlier "+25–30 %" estimate was wrong. In code this is `T = 1.15` in `brand/theme.ts`.
- **Robot Reavers (checked at phone size):** it is monospaced (every glyph 0.75 em, space 0.5 em) and has no real lowercase (a = A), so accent words render about **2× wider** than the serif they replace. They are sized for equal cap height with Teko and the underline now follows the line width. Its **digits are ambiguous**: "1" reads as "I", "0" as a hollow box, "3" as a mirrored "E". So **numerals (counters, step numbers, "+12") use Teko Bold with the gold gradient**, and Robot Reavers is for accent *words* only. This is one constant (`NUMERAL_FONT` in `brand/theme.ts`) if you want to compare.
- Teko has weights 300–700. Use **600–700** for captions to match the reference weight, and 500 for small UI labels.

---

## 1. Global rules (true for all 7)

### Canvas and timing

- 720×1280, 30 fps, 450 f, 9:16. Centre axis is x = 360.
- **Hard cuts, no transitions.** A scene change is a single-frame swap.
  - Five templates (explainer, business, essay, split-reel and glass-explainer) cut at **104 / 210 / 345**. That is four scenes of about 3.5 s, 3.5 s, 4.5 s and 3.5 s. Glass-explainer adds one more cut at **164**.
  - `youtube-clips` cuts at 75 / 112 / 188 / 269 / 372.
  - `ranking-format` is one continuous scene.
- The **script is the same in six of the seven**: hook, "it's your system", 3 steps, 30-day proof. Only the visual metaphor changes. The ranking template is a different format.

### Layout zones (720×1280)

```
y=0    ┌──────────────────────┐
       │ title / hook  y≈205  │  top graphic zone: 0–640 (split layouts)
       │ graphic       200–760│
y≈810  │ CAPTION (centre)     │  ← caption lives at y≈810 in panel layouts,
       │                      │    ≈600–630 in split/essay, ≈785 on full-bleed
y≈938  │ ┌ media panel ─────┐ │  panel layouts: x46–674, top y938, bleeds off bottom
y=1280 └──────────────────────┘
```

| Layout | Used by | Graphic zone | Media zone |
|---|---|---|---|
| **Panel** | explainer | y 0–~800, black | rounded inset x46–674, y938→bleed, radius 22 |
| **Split 50/50** | youtube S3, business S2/S4 | y 0–640 | y 640–1280, full width, no radius |
| **Full-bleed** | all talking-head scenes | none | whole frame |
| **Cut-out** | essay | floating cards y198–620 | subject cut out, bottom-centre, over a warm glow |
| **Board** | ranking | tier board y663–1003 | full-bleed behind it |

Side margins sit at **46–60 px**. Content widths are 600 (cards), 550 (grids) and 486 (header bars).

### Colour (measured)

| Token | Value | Where |
|---|---|---|
| `bg` | `#000000` (explainer), `#040404`–`#0A0A0A` (youtube), `#090906` (essay) | graphic scenes |
| `accent` | **`#D0702C`**, with `#D9772A` on lit cells and `#DC7030` in ranking | the single accent in every template |
| `accent-dim` | `#43240C`, which is accent at about 25 % over black | finished 30-day cells |
| `glow` | accent at 20–30 %, blurred 80–120 px, over black (`#522D12`, `#4D250F`, `#4A2B10`) | bokeh blobs and bottom or top wash |
| `text` | `#FFFFFF` | captions and titles |
| `text-muted` | `#8A8A90`, about 55–60 % white | labels |
| `glass` | `#5C5D64 → #43444B` vertical, with a 1 px border at about 35 % white | cards in explainer |
| `glass-dark` | `#242326`, with a 1 px border at about 8 % white | notification cards |
| `row` | `#1A191C` | tier rows |
| `semantic-green` | `#3A874D` | youtube dashboard cells ("posted") |
| `semantic-red` | `#B12320` | youtube "0 enquiries" pill |
| `highlight-yellow` | `#FCE33A` (ranking captions and card titles), `#FBE58A` (doc highlight) | emphasis |
| Tier colours | S `#FE7E7C`, A `#FDBF82`, B `#FCFB7D`, C `#7BFD7C`, D `#7EBEFE`, E `#7F7EFD`, F `#FE7DFD` | ranking only |

### Type (families identified by eye; sizes are px at 720 wide)

| Role | Face | Size | Notes |
|---|---|---|---|
| Caption | Inter / Inter Tight **Bold** | ~40 | letter-spacing about −0.04 em, centred, soft shadow on busy backgrounds |
| Caption accent word | high-contrast **serif italic** (Instrument Serif or Playfair Italic look) in `accent` | ~46 | one keyword per caption: *clients, system, thirty, hook, story, offer* |
| Title | Inter Bold | ~40 (explainer) to 52 (youtube, business) | |
| Hero numerals | Inter Bold | 48 (counter), 70 (+12), 76 (0), 110 (Day / 0) | |
| White-box line | Helvetica / Arial Bold, black on `#FFF` box | 52 | youtube S2, business S1 |
| UI labels | Inter Regular / Semibold | 15–24 | |
| Ranking | **heavy bold-italic caps** (title and captions, ~38–42), plus a **chunky display face** for card art (~50, `#FCE33A`) | | looks like Montserrat ExtraBold Italic and Lilita One |
| Slot chip | caps, ~14, tracking 0.1 em, dashed border | | "YOUR VIDEO" / "YOUR IMAGE": **placeholder only, never in production** |

### Animation vocabulary (shared across all 7)

| Name | Behaviour | Duration | Closest standard curve |
|---|---|---|---|
| `blurIn` | opacity 0→1, blur ~10 px→0, optional translate 12 px / scale 0.85→1 | 6–8 f | ease-out cubic |
| `popIn` | scale 0.6→1.03→1.0, opacity 0→1 over the first 4 f | ~8 f | spring {damping ≈12, stiffness ≈200, mass ≈0.6}, ~3 % overshoot |
| `wipe` (typed text) | clip-path reveal left to right | ~2.3 chars/f, 18 chars in ~8 f | linear |
| `drawLine` | stroke draws start to end, end dot lands last | 5–8 f | ease-in-out |
| `countUp` | number ticks to target | 22–30 f | **ease-in-out** for Day 0→30 (slow, fast, slow). Ease-out for +12 and the essay 0→12. |
| `sheen` | white highlight sweeps across a pill | ~12 f | linear |
| `glowPulse` | orange border and glow rise over about 7 f | ~7 f | sine |
| `caption swap` | hard swap, with a 2–3 f `blurIn` of the new phrase | 0–3 f | none |
| `cut` | single-frame scene swap | 0 f | none |
| `punchIn` | talking-head layer jumps scale by about ±10 % on a caption beat (explainer f162: head bbox −11 %) | 0 f | none |

The marquee in business S1 scrolls **1 px/frame to the left** (30 px/s) for the whole scene.

---

## 2. Per-template specs

### T1 · `ranking-format` (tier-list)

One continuous scene. The only template without cuts. Three items are ranked, one every 135 f.

**Layout.** Full-bleed media behind everything.

| Element | Position (720×1280) | Style |
|---|---|---|
| Title "CONTENT TACTICS" | centre x360, y≈210 | bold-italic caps, ~42, `#DC7030`, drop shadow, **static for all 450 f** |
| Caption | centre x360, y≈622 | bold-italic caps ~38, white with shadow. Item name in `#FCE33A`, verdict phrases in white. |
| Tier board | x103–617 (w514), y663–1003 (h340) | 7 rows × 48 px. Letter cells 48 px wide in the tier colours, letters black bold ~22. Row fill `#1A191C`, 4 px black border, soft drop shadow. |
| Item card | x167–553 (w386), y724–942 (h218), centred on the board | art on a dark tinted bg (e.g. `#2F4A62`), 2 px light border, ~50 px `#FCE33A` display title |
| Tier thumb | ~72×42 at x≈159 inside the row, row centre y = 689 + 48·k | final resting size of the card |

**Per-item timeline.** `t0 = 9 + 135·i` for i = 0, 1, 2. That gives 9, 144 and 279, with the item order Daily Posting (B), Trending Audio (F), Carousels (S).

| Frames | Event |
|---|---|
| `t0` | caption item name appears (yellow) |
| `t0+1 → t0+8` | card `popIn`: scale 0.62→1.03→1.0, opacity 0→1 |
| `t0+9 → t0+109` | hold. Caption phrases swap about every 30–45 f, so they are voice-over driven. |
| `t0+110 → t0+116` (**119→125** for item 0) | card shrinks to thumb size and travels to its tier row. Slow start, fast middle, soft landing: **ease-in-out cubic, 7 f**. |
| `t0+117 → ~t0+130` (126→~139) | landing flash. The row background goes grey (`~#4A4A4A`) and the tier letter cell scales up about 1.25× and brightens. |
| `402 → 449` | final board hold. Caption "EVERY SINGLE TIME" appears about f420. |

**Behaviour.** The board accumulates. Thumbs stay in their rows and the next item pops in on the same spot. The audience sees the verdict phrase first and the card lands last, which makes the verdict feel earned.

---

### T2 · `explainer-panel-reel`

The most complete system. Four scenes and the richest component set.

**Shared:** pure `#000` bg with a faint **dot grid** (dot about 2–3 px, about 7 % white, **pitch ≈22.5 px**, offset about x11 / y34). Caption at y≈810. Media panel x46–674, top y938, radius 22, 1 px border at about 12 % white.

**Scene map:** A 0–103 hook graphic, B 104–209 full-bleed talking head, C 210–344 steps, D 345–449 30-day proof.

#### Scene A (0–103): "Posting Every Day, Still No Clients"

| Frames | Element | Detail |
|---|---|---|
| 1 → 8 | Title line 1 "Posting Every Day," | `wipe` L→R, centred, y≈208, white Inter Bold ~40, line pitch 45 |
| 9 → 18 | Title line 2 "Still " then "*No Clients*" | "Still" is white sans. "No Clients" is serif italic `accent`, `wipe` f11→18. A 2 px `accent` underline (x240–480, y≈276) draws f10→14. |
| 4 → 9 | Hub icon | Circle Ø76 at (360, 347), 2 px white ring, orange person glyph, 24 px orange glow. `blurIn` from 0. |
| ~12 / 28 / 62 / 71 | Caption swaps | "Most people" → "post every day" → "and still" → "get no *clients.*" (accent word ~46, serif italic) |
| 24 → 31, 32 → 38, 42 → 48 | Cards MON / TUE / WED | Glass cards 140×152 (radius ~10) at x-centres **153 / 360 / 567**, y454–606. `blurIn` plus scale 0.85→1 over 7 f. Stagger **24, 32, 42**. Each has a tiny caps label chip top-left and an image glyph centred. |
| 24 → 31 (and +8, +18) | Connectors hub → card | 2 px line draws 8 f, starting 1 f before the card. Ends in a Ø12 orange dot at card top (y445). |
| 62 → 68 | Dotted connectors card → counter | 3/5 px dashed, about 70 % white, from y606 to y681 |
| 67 → 71 | Counter box | x276–444, y681–757. Black fill, 2 px white border. "0" is ~48 px `accent`. "new / clients" is ~24 px white, 2 lines. `blurIn`. |
| 83 → 90 | Counter box pulse | border white→`accent`, plus outer glow (`glowPulse`) |
| 0 → 103 | Media panel | static |

#### Scene B (104–209): full-bleed talking head, captions only

| Frames | Event |
|---|---|
| 104 | hard cut. Panel scales up to full-bleed. Caption y≈806 over the neck. |
| 104 → 131 | "The problem" |
| ~132 → 161 | "isn't your content." |
| **162** | `punchIn` (head scale −11 %), plus caption "It's your *system.*" (accent word in serif italic) until 209 |

#### Scene C (210–344): "3 Steps To Fix It"

| Element | Position | Style |
|---|---|---|
| Header bar | x117–603 (w486), y187–258, centre y222 | gradient `#111 → #2A2A2A`, 1 px light border, **10 px `accent` left edge**. "3" at x≈167, "Steps To Fix It" ~30 bold centred. **Present at the cut.** |
| List rows 01 / 02 / 03 | centres y **346 / 424 / 503** (pitch 78.5) | "01" ~30 bold at x≈192. Label centred at x≈385. Unrevealed labels are blurred placeholders and sharpen when their step activates. |
| Active row pill | x147–573 (w426), h63 | same gradient and `accent` left edge as the header, light border |
| Node chain | y640, x **160 / 360 / 560**, Ø64 | 2 px white ring, orange number ~26, orange glow when active |
| Node label pill | y≈703 under each node | `accent` fill, white ~18 bold, radius 3 |
| Connector | between nodes, 2 px, about 60 % white | draws L→R |
| Caption | y≈810 | "Step N:" in white sans, then the serif-italic accent word |

Per-step cadence with `T_s = 240 + 44·s` for s = 0, 1, 2:

| Frame | Event |
|---|---|
| 210 | cut. Header already on screen. |
| 211 → 216 | list "01 / 02 / 03" labels `blurIn` |
| `T_s − 26` (**216**, 260, ~300) | caption "Step one:" / "Step two:" / "Step three:" |
| `T_s − 8 → T_s` (236→240, 276→284, ~320→328) | node `blurIn`. For s > 0 the connector draws 4–5 f first. |
| `T_s` | caption → accent word ("*hook.*" / "*story.*" / "*offer.*"). Row pill activates, with a 4 f blur and left-bar slide. Previous pill fades back to a plain row. |
| 344 | end. The step 3 pill, node and caption hold. |

#### Scene D (345–449): "Run It For Thirty Days"

| Frames | Element | Detail |
|---|---|---|
| 345 → 365 | Title | "Run It For" `wipe` 346→~356, then "*Thirty* Days" ~357→365. "Thirty" is serif italic `accent`. 2 px underline x260–460. Same title style as scene A. |
| 346 → 353 | Grid | 10 cols × 3 rows, cell 46×46 radius 2, **pitch 56**, x85–635, y313–471. Empty cells have a 1 px dark outline. `blurIn`. |
| 349 → 368 → 400 | Captions | "Do that" → "for *thirty* days," → "and watch" (401–415) → "what happens." (416–449) |
| 361 → 397 | Day label | "Day N", ~24 semibold muted, centred y500. Counts 0→30. |
| **366 → ~395** | Cell fill | Cells fill `accent` (`#D9772A`) in row-major order. Pace is **ease-in-out**: Day 2 at f373, 6 at 377, 16 at 381, 25 at 385, 29 at 389, 30 at ~393. |
| 401 → 409 | Dim | all cells → `accent-dim` (`#43240C`), label → `#535353`. 8 f. |
| 405 → 440 | Chart | baseline 2 px `#888` at y760, x85–635. Curve is a 3 px `accent` S-curve (slow start, steep end), drawn L→R. End dot Ø14 (orange with a white ring) lands at ~437. |
| 413 → 437 | Counter | "+0 → +12", ~70 semibold. It starts blurred at 413, is white while counting, then tints to orange f438–445. |
| 421 → 425 | Pill | "new clients", `accent` fill, ~20 white bold, small glow |

---

### T3 · `youtube-clips`

Six scenes. Near-black base `#040404`–`#0A0A0A`, with orange bokeh in the middle scenes.

| Scene | Frames | Layout |
|---|---|---|
| S1 | 0–74 | "Long video in. Clips out." plus a fake YouTube card turning into 3 clips |
| S2 | 75–111 | full-bleed media, **white-box headline**, accent caption |
| S3 | 112–187 | split 50/50 dashboard (top) / media (bottom) |
| S4 | 188–268 | full-bleed media, caption only |
| S5 | 269–371 | black plus bokeh, a **numbered pill list** |
| S6 | 372–449 | full-bleed media, a **Day counter** above the head |

**S1 (0–74).**

| Frames | Element |
|---|---|
| 4 → 8 | Title "Long video in. *Clips* out." centred y≈230, Inter Bold ~52, tracking −0.05 em, "Clips" serif italic `accent`. `blurIn`. The YouTube card enters with it. |
| (static) | Card x60–660, y294–752, radius 22, fill `#1A1A1C`. Player y294–631, progress bar y≈630 (x83–638, white fill to x283). Row: ▶ + "15:12 / 42:18" at y659. Title ~24 semibold at y703. Channel ~17, 50 % white, at y731. |
| 30 → 32 | orange playhead segment (x283–347) appears on the progress bar |
| 32 → 36 | **selection box**: 2 px `accent` portrait rectangle x266–454, y294–630, pops in over the player |
| 40 → 52 | box narrows and lifts, and the crop detaches downward |
| 52 → 60 | clip thumbnail drops to **slot 1**. Three portrait slots (about 112 w × 220 h, centres x≈220 / 360 / 500, y≈780–1000, ±15 px) have dark 1 px outlines. |
| 60 → 72 | "Clip 1" (orange fill pill), "Clip 2" and "Clip 3" (grey pills) fade in above the slots |

**S2 (75–111)**: static after the cut.

- Line 1: "Not your content." white, ~52 Arial/Helvetica Bold, y≈222.
- Line 2: "It's your system." is black text on a white box (x140–580, y258–322).
- Lower caption: "It's your *system.*", y≈812.

**S3 (112–187).** Top half is black with an orange bokeh blob at about (200, 215). Bottom half is the media, full-bleed. Captions sit at y≈612.

| Frames | Element |
|---|---|
| 112 → 118 | glass dashboard x74–646, y191–563, radius 24, fill about 12 % white over the glow, 1 px border at about 18 % white. `blurIn`. |
| (static) | "Posts this month" ~24 regular, 55 % white, at (110, 230). Grid 10×3, cell 41×41, radius 8, pitch 51, x111–608, y260–402. "New clients" label ~24 at y441. "0" ~76 bold white at y≈503. |
| ~122 → 151 | cells fill green `#3A874D`, about 1 per frame in row-major order |
| 112 / 135 / 153 / 171 | captions: "Most people" → "post every day" → "and still get" → "no *clients.*" |
| 171 → 177 | "0" turns red (`#B12320`). Pill "0 enquiries" (red fill, ~22 white bold, fully rounded) appears beside it. |

**S4 (188–268).** Caption at y≈805. "The problem isn't" ~190. "your content." **213**. "It's your *system.*" **235**.

**S5 (269–371).**

- Two bokeh blobs at about (200, 470) and (545, 735), r≈110, colour `#522D12`.
- Kicker "Every post, in this order", ~22 muted, left-aligned at x86, y260.
- Pills are **left-aligned at x≈80**, h≈90, fully rounded glass (gradient fill, 1 px border at about 25 % white). Inside each: orange Ø48 number disc at x≈126 (white ~26 bold numeral), label ~36 semibold at x≈169. Pill centres **y≈354 / 505 / 658**.
- A 2 px vertical connector at x≈126 joins the pills at about 30 % white.

| Frames | Event |
|---|---|
| 269 | cut. Bokeh and kicker only. Caption "Step one: hook." appears ~275. |
| 287 → 293 | pill 1 "First three seconds" `blurIn`. `sheen` 293→305. |
| ~299 | caption → "Step two: *story.*" |
| 317 → 323 | connector draws. Pill 2 "Why it matters to them" `blurIn` 321→327. Pill 1 dims (grey disc, 70 % text). |
| ~337 | caption → "Step three: offer." |
| 349 → 355 | pill 3 "What to do next" `blurIn`. `sheen` 359→365. |

**S6 (372–449).**

- "Day" ~22 muted at y≈208. Number ~110 Inter Bold white, y≈285.
- Count: 1 @380, 3 @384, 9 @388, 18 @392, 26 @396, 29 @400, **30 @404**. This is ease-in-out.
- At 404 → 408 the number turns `accent` with a soft glow.
- Captions: "Do that for" 376, "*thirty* days," 396, "and watch" 416, "what happens." 428. Caption y≈805.

---

### T4 · `business-short-form-reels_1`

Four scenes (cuts 104 / 210 / 345). This is the glassiest one, with big blurred orange bokeh.

**S1 (0–103): word-by-word hook.** Full-bleed media.

| Element | Detail |
|---|---|
| Headline | "Posting every day" white ~52 Bold at y≈208, plus "but still no clients?" in black on a white box (x125–595, y245–312). Static for the whole scene. |
| Reel strip | 5+ glass cards, 172×300, radius 18, y397–697, gap 19, "REEL COVER" chip + ▶ disc + bottom bar. **Scrolls left at 1 px/f continuously.** |
| Word caption | one word at a time, ~44 Bold white, centred x360, y≈785, soft shadow. Words: *most* 12, *people* ~18, *post* ~30, *every* ~42, *day* ~48, *and* ~54, *still* ~66, *get* ~72, *no* ~78, ***clients*** ~84 → 103. Last word is serif italic `accent`. |

**S2 (104–209): notification stack.** Split layout, y640 split.

| Element | Detail |
|---|---|
| Top | black with an orange wash at the top edge (radial, about 220 px tall, `#4A2B10`) |
| Notification cards | x60–660 (w600), h≈100, radius 28, fill `#242326`, border about 8 % white. Avatar disc Ø56 at x≈110. Handle ~22 semibold white. Body ~22 regular with **numbers in bold**. "now" ~18, 40 % white, right-aligned. **Pitch 113 px.** Newest on top. |
| 104 | card A "Your reel reached 12,400 views" present at the cut |
| 126 → 139 | card B "86 new likes on your post" drops in from above, pushing A down. `ease-out`, 12 f. |
| 162 → 172 | card C "**0** new client enquiries this week" (the 0 in red) drops in. Stack settles with 3 cards. |
| Captions (y≈600) | "the problem isn't" 104 → "your content" 140 → "it's your system" ~170 |

**S3 (210–344): glass capsule list.** Full black with 3 orange bokeh blobs plus a grey one at about (540, 520), a faint bottom glow, and slow drift.

| Element | Detail |
|---|---|
| Pills | x142–578 (w436), h≈83, fully rounded, orange-tinted glass (gradient about 35 % `accent` → dark), 1.5 px `accent` border at about 50 %, inner glow. Line icon (hook / book / tag) at x≈185. Label ~36 semibold at x≈227. Index "01/02/03" ~22 muted, right-aligned x≈545. **Pitch ≈108**, centres y **≈433 / 541 / 649**. |
| Active vs inactive | active = bright orange glass. Inactive = grey glass. |
| 210 | Hook pill present at the cut. `sheen` ~234 → 242. |
| 250 → 258 | Story pill `blurIn`. Hook goes inactive. |
| 290 → 298 | Offer pill `blurIn`. Story goes inactive. |
| Caption (fixed y≈752) | "step one: hook" 210 → "step two: story" ~252 → "step three: offer" ~300. All lowercase, white, no accent-word styling here. |

**S4 (345–449): doc mock.** Split layout, y640 split.

| Element | Detail |
|---|---|
| Doc card | x60–660, y197–562 (w600, h365), radius 22, fill `#F8F9FC`. Header: doc icon, title "30-Day Content Plan" ~22, menu row ~15 grey, "Share" pill, avatar. Toolbar row. Inset page (w508) with H1 ~30 bold, skeleton lines `#E0E2E6`, sub-heads ~22 bold. |
| 370 → 375 | yellow highlight `#FBE58A` wipes in behind "30-Day" |
| 393 → 417 | page auto-scrolls up about 330 px, **ease-in-out** |
| 411 → 417 | "Day 30: what happened" gets the yellow highlight |
| Captions (y≈600) | "do that for" 345 → "thirty days" ~375 → "and watch" ~399 → "what happens" ~417 |

---

### T5 · `visual-essay-reel`

Four scenes (cuts 104 / 210 / 345) plus internal re-frames at **70, 165, 399**. Background is `#090906` with a warm orange radial glow rising from the bottom (`#4D250F`, fading out about 35 % up the frame) and subtle film grain.

**The subject is a cut-out figure** (transparent bg), bottom-centre, **re-framed in scale and position on most beats**. Captions anchor to the top of the subject.

**S1 (0–103).**

| Frames | Element |
|---|---|
| 0 → 69 | Post card x180–541 (w361), y200–602, radius 14, white, shadow. Label "Sample post, @yourhandle" ~16 muted at y183. Contents: avatar Ø46, name ~20 semibold, handle ~17 grey, body ~22, image block 311×195 radius 8, footer ♡14 ✉0 ↗1 ~17. |
| 0 → 69 | Headline "*Posting* **Daily**": "Posting" white serif italic ~72, "Daily" `accent`. "Still No Clients" ~34 Inter Bold white beneath, overlapping the neck, at y≈965. |
| 12 / 30 / 54 | Captions at y≈630: "Most people" → "post every day" → "and still" |
| **70 → 72** | Headline exits. Card slides left about 147 px (to x33–401). A big "**0**" (~110 Bold `accent`, strong glow) with "new clients" (~30 white) appears at about x540. Subject re-frames. |
| 71 | caption "get no *clients.*" |

**S2 (104–209).**

| Frames | Element |
|---|---|
| 104 → 110 | Article card slides in from the right: x270–650 (w380), y198–552, radius 14, white. "YOUR NEWS SITE" ~16 bold caps, rule, serif-bold headline "Good content is not what wins clients" ~30, byline ~15, image block, skeleton lines. `ease-out`, 7 f. |
| 104 / 128 | captions "The problem" → "isn't your content." (y≈578, under the card) |
| **165** | card exits. Subject re-centres. |
| ~170 → 209 | caption "It's your *system.*" at y≈443, just above the head |

**S3 (210–344): three cards.** Subject centred low. Cards are **fixed at x = 43 / 260 / 477** (w200, h297, y219–516) and never re-centre.

| Frames | Event |
|---|---|
| 218 → 241 | "Step one:" at y≈628 |
| 242 | Hook card `popIn`: video thumb with ▶ Ø46 and a caption bar "First line that stops the scroll". A black **tag chip** "Hook" (~22 semibold, white, 1 px orange border, glow) sits at top-centre. Caption → "*hook.*" |
| 258 | "Step two:" |
| 282 | Story card `popIn` (white doc, "Notes / My story"). Caption → "*story.*" |
| 298 | "Step three:" |
| 330 | Offer card `popIn` ("Your Offer", image, **£497**, black "Book a call" button). Caption → "*offer.*" until 344. |

**S4 (345–449): before / after.**

| Frames | Element |
|---|---|
| 348 → 355 | **Before** card x50–350, y218–503, radius 14, white. Tag chip "Before". "Enquiries · Day 0" ~17 grey, "0" ~110 Bold near-black, flat grey sparkline. `popIn`. |
| 372 → 378 | **After** card x371–669, same size. Tag chip "After". |
| 372 → 394 | After number 0→1→8→12 (`#D9772A`). Ease-out. |
| 375 → 397 | After sparkline draws, 4 px `accent` rising curve |
| 349 / 369 / 399 / 417 | captions: "Do that" (y≈628) → "for *thirty* days," → "and watch" → "what happens." (y≈568) |
| **399** | subject re-frames lower. Captions move up to y≈560–568. |

---

### T6 · `split-reel`

Three layouts in 15 s: **split → full-bleed → split → split**. Cuts at **104 / 210 / 345** (same preset as T2, T4 and T5). It is the inverse of T3/T4's split: **media on top (y0–640), graphics below (y640–1280)**.

**Shared.** Graphic half is matte black with a warm **radial glow rising from the bottom edge** (ellipse centred at y≈1280, about 45 % of the frame tall, accent at about 25 %). There is no dot grid. Media half is full-width, with the subject re-framed (scale and offset) at each cut.

**Type character.** Headlines are **condensed bold caps** (Oswald or Bebas look, ~50 px cap-for-cap), which maps almost one-to-one to Teko. Kickers and card titles are serif italic (→ Robot Reavers).

| Scene | Frames | Layout |
|---|---|---|
| S1 | 0–103 | split. Kicker + 2-line headline + 7 day-chips + "0 new clients" |
| S2 | 104–209 | full-bleed media, **no overlays at all** (3.5 s of pure talking head) |
| S3 | 210–344 | split. Step headline + 3 cards, active card highlighted |
| S4 | 345–449 | split. "30 DAYS" + 30-cell grid + counter + mini chart |

**S1 (0–103): "most people post every day and get no clients".**

| Element | Position | Style |
|---|---|---|
| Kicker "most people" | centre x360, y≈676 | serif italic ~34, `accent` |
| Headline line 1 "POST EVERY DAY" | y≈718 | condensed bold caps ~50, off-white `#F4F1EC` |
| Headline line 2 "AND GET **NO CLIENTS**" | y≈766 (line pitch 48) | same, with "NO CLIENTS" in `accent` and a soft glow |
| Day chips ×7 (M T W T F S S, 1–7) | x67–653, y815–901, **74×86, pitch 85.5 (gap 12)** | radius 12, fill `#2A2A2C → #161617`, 1 px border at about 12 % white. Day letter ~14 grey at top, numeral ~34 bold white. |
| Check badge | Ø26, top-right corner of each chip (about +6 / −10 px offset) | `accent` disc with a black check |
| "0 NEW CLIENTS" | "0" at x≈290, y≈952; label at x≈317, y≈960 | "0" ~54 bold `accent` with glow. Label ~15 caps, tracking 0.2 em, grey. |

| Frames | Event |
|---|---|
| ~12 | kicker `blurIn` |
| 20 → 40 | chips appear one by one, **~3.3 f apart** (`blurIn` + small rise): 1 @20, 2 @24, 4 @28, 5 @32, 6 @36, 7 @40 |
| 28 → 34 | headline line 1 `blurIn` |
| 38 → 60 | check badges pop in sequence, **~3.2 f apart**, 1 @~38 … 7 @~60 |
| 64 → 68 | headline line 2 `blurIn`, "NO CLIENTS" glows |
| 84 → 88 | "0 NEW CLIENTS" `blurIn`. Holds to 103. |

**S3 (210–344): steps.**

| Element | Position | Style |
|---|---|---|
| Kicker "step one / two / three" | y≈676 | serif italic ~34, `accent` |
| Headline "HOOK / STORY / OFFER" | y≈727 | condensed bold caps ~78, `accent`, strong glow (about 20 px) |
| Cards ×3 | x **43 / 263 / 483**, w194, h≈144, y832–973 (pitch 220) | glass-dark, 1 px border. **Active:** 2 px `accent` border plus outer glow. **Inactive:** border at about 12 % white. A 2 px `accent` connector (26 px long) sits between cards at y≈902. |
| Card content | | "01/02/03" ~14 caps tracked grey at top-left (x+18, y855). Title serif italic ~40 white at y≈896. Two grey placeholder bars at y≈928 and 944. |
| Label pill | w≈166, h≈38, overlapping the card bottom (y≈977) | `accent-fill`, black text ~22 bold: "stops the scroll", "builds the trust", "makes the ask" |

| Frames | Event |
|---|---|
| 210 | cut. Kicker "step one", headline "HOOK" and card 1 (active) already on screen. |
| 234 → 240 | label 1 `blurIn` |
| 256 → 262 | headline fades out (dark and blurred) |
| 262 → 270 | card 2 `blurIn`, connector draws. Card 1 goes inactive ~270–276. |
| 264 | kicker → "step two". Headline "STORY" `blurIn` 270 → 276. |
| 288 → 294 | label 2 |
| ~300 | headline fades out |
| 306 → 312 | kicker → "step three". Card 3 `blurIn`. Headline "OFFER" 312 → 318. |
| 330 → 336 | label 3. Hold to 344. |

**S4 (345–449): "do that for 30 DAYS".**

| Element | Position | Style |
|---|---|---|
| Kicker | y≈676 | serif italic ~34 `accent`: "do that for" → "and watch what happens" at ~401 |
| "30 DAYS" | y≈727 | condensed bold caps ~78. "30" in `accent` with glow, "DAYS" white. |
| Grid | **x100–620, y820–915**, 10 cols × 3 rows | cell **40×26**, radius 6, pitch 53.3 × 34.5. Empty = `#1A1A1C`. Lit = `accent-fill`. |
| Counter | "30" ~44 bold white at (100, 960), "/30" ~24 grey, "DAYS POSTED" ~14 caps tracked grey at y≈992 | |
| Mini chart | x376–620, y930–992 | 2 px `accent` S-curve with glow. White Ø10 end dot at (620, 931). A hand-lettered "clients" annotation (white, script) at (433, 944). |

| Frames | Event |
|---|---|
| 345 → 353 | grid (empty cells) and counter `blurIn` |
| **355 → 397** | cells fill row-major at **~0.75 cells/frame** (linear): 3 @357, 6 @361, 9 @365, 11 @369, 14 @373, 17 @377, 20 @381, 23 @385, 25 @389, 28 @393, 30 @397. Counter ticks with it. |
| 401 → 405 | kicker swaps |
| 405 → ~425 | mini-chart curve draws L→R (ease-in-out), end dot lands last |
| 421 → 429 | "clients" annotation `blurIn` |

---

### T7 · `glass-explainer-reel`

The explainer family (T2) re-skinned in **glass cards**: same dot-grid black, same title/underline system, same panel at the bottom, with different content blocks.

**Scenes (cuts 104 / 164 / 210 / 345):**

| Scene | Frames | Layout |
|---|---|---|
| A | 0–103 | panel layout. "Daily Posts, *Zero Clients*", notification stack, 2 stat cards |
| B | 104–163 | full-bleed media + captions |
| C | 164–209 | panel layout. "What Is Actually *Missing*": Content ↔ Clients arc |
| D | 210–344 | panel layout. "Build It In *Three Steps*", 3 cards + progress track |
| E | 345–449 | panel layout. "Then Give It *Thirty Days*", line chart + 2 stat cards |

**Shared with T2.** Black + dot grid (pitch ≈22.5), faint blurred glow blobs (one warm at about (120, 215), one grey at the right), title at y≈208 / 253 (Inter Bold ~40 → Teko; keyword serif italic `accent` with a 2 px underline), caption at y≈810, panel x46–674 / top y938 / radius 22. Hard cut to full-bleed in B.

**Glass card spec (new in T7):** fill vertical gradient `#3A3A3D → #2A2A2C`, 1 px border at about 18 % white, radius 8–24 by size, soft inner top highlight. **Active:** 2 px `accent` border plus ~20 px outer glow, and a **`sheen`** sweep (diagonal white highlight, ~12 f).

**Scene A (0–103).**

| Frames | Element |
|---|---|
| 4 → 10 | "Daily Posts," `wipe` |
| 10 → 17 | "*Zero* Clients" `wipe`, with a 2 px underline (x256–464, y≈276) |
| 8 / 28 / 56 / 72 | captions: "Most people" → "post every day" → "and still" → "get no *clients.*" (y≈810) |
| ~24 → 28, 34 → 40, 42 → 48 | **notification cards ×3**: x74–646 (w572), h82, pitch 92 (y300–382, 392–474, 484–566), glass, radius 24. App icon 50×50 rounded at x93 with a ▶ glyph, "Your App" ~20 semibold, "@yourhandle: Your reel is live" ~19 regular at about 75 % white, "now" ~15 muted right-aligned. Each new card drops in from the top and **pushes the stack down** (newest on top). Settle time ≈6 f. |
| 48 → 52 | left stat card `blurIn`: x74–340 (w266), y594–740 (h146), "Posts this month" ~18 muted, "30" ~72 bold white |
| **56 → 76** | counter 0→30, **ease-in-out**: 0 @56, 2 @60, 11 @64, 24 @68, 29 @72, 30 @76 |
| 66 → 72 | right stat card `blurIn`: x380–646, "New clients", "0" |
| 84 → 88 | right card border → `accent` with glow, "0" → `accent-text` |
| 96 → 100 | `sheen` sweeps across the right card |

**Scene B (104–163).** Caption y≈806. "The problem" ~109 → 128, "isn't your content." ~129 → 163.

**Scene C (164–209).**

| Frames | Element |
|---|---|
| 164 → 169 | cut back to panel layout. Cards `blurIn`. |
| 169 → 183 | title "What Is / Actually *Missing*" `wipe` |
| 169 | caption "It's your *system.*" |
| (static) | **Content card** x47–267 (w220), y534–680 (h146). **Clients card** x453–673, same y. Label ~24 semibold at (+19, 563). Content has 3 grey thumbs (50×64). Clients has 3 grey person glyphs. |
| 179 → 189 | dashed arc (about 40 % white, 3/6 dash) connects Content top-centre (157, 524) to Clients top (562, 519), apex y≈395. Faint at first. |
| 189 | "The system" label pill (`accent-fill`, ~14, glow) `blurIn` at the apex (360, 390) |
| **189 → 200** | arc turns solid `accent` and **draws L→R** (11 f) |
| 200 → 204 | arc lands: Clients card border → `accent` + glow |

**Scene D (210–344).**

| Element | Position | Style |
|---|---|---|
| Title "Build It In / *Three* Steps" | y≈208 / 253 | `wipe` 216 → 226, underline x258–462 |
| Caption | y≈810 | "Step one:" 216–239 → "*hook.*" 240 → "Step two:" 258 → "*story.*" 282 → "Step three:" 300 → "*offer.*" 330–344 |
| Cards ×3 | x **37 / 260 / 483**, w200, h240, y347–587 | glass. Header: title ~26 semibold white + "01/02/03" ~16 muted right. Hook: 164×100 video thumb with ▶ disc and "First 3 seconds" ~19 muted. Story: 4 text-line bars and "Why it matters". Offer: white pill button "Book a call" ~14 bold black and "One clear ask". A 2 px white connector joins cards at y≈467. |
| Progress track | **x46–674 (w628), y639–642 (3 px)** | grey at about 30 % white, `accent` fill |

| Frames | Event |
|---|---|
| 222 | progress track appears (grey) |
| 240 → 246 | card 1 `blurIn`. Active (accent border + glow). |
| 258 | `sheen` across card 1 |
| 276 → 282 | connector + card 2 `blurIn`. Card 1 goes inactive. |
| 300 | `sheen` across card 2 |
| 324 → 330 | card 3 `blurIn` |
| 342 | `sheen` across card 3 |

**Progress-track fill, measured literally (it behaves oddly).** It fills to **x≈465 (~67 %) over 244 → 252**, holds, **drops to x≈255 (~33 %) over 284 → 292**, holds, then **fills to 100 % over 328 → 340**. That is not a clean 33 / 67 / 100. It looks like a template quirk. **Recommendation: build it as a clean 33 % → 67 % → 100 % in step order**, unless you want the literal behaviour.

**Scene E (345–449).**

| Frames | Element |
|---|---|
| 345 → 355 | chart panel `blurIn`: **x87–633 (w546), y313–573 (h260)**, radius 8, glass. 1 px axes in grey, dashed baseline (about 40 % white) at y≈518, "enquiries per week" ~16 muted at the bottom-right. |
| 350 → 362 | title "Then Give It / *Thirty* Days" `wipe` |
| 355 / 370 / 400 / 420 | captions: "Do that" → "for *thirty* days," → "and watch" → "what happens." |
| 365 → 370 | **"Day" card** `blurIn`: x73–340, y600–746. "Day" ~18 muted, number ~72 bold white. |
| **370 → 395** | Day counter 0→30, **ease-in-out**: 0 @370, 2 @375, 10 @380, 23 @385, 29 @390, 30 @395 |
| 370 → ~420 | chart curve: 4 px `accent` S-curve draws L→R, white Ø14 end dot rides the tip. Curve ends at (633, 350). |
| 400 → ~422 | the Day "30" flashes `accent-text`, then returns to white by ~430 |
| 415 → 420 | **"New clients" card** `blurIn`: x380–646, "+0" |
| **420 → 435** | counter "+0 → +12", **ease-out**: +4 @425, +11 @430, +12 @435 |
| 430 → | card gets an `accent` border + glow |
| 440 | `sheen` across the card. **"+12" turns green** (about `#3FBF6F`, "success") by 445. |

Note for the brand: this is the **one place a second colour carries meaning** (green = result achieved). Keep green for that, or use `accent-text` and a sheen. Your call.

---

## 3. Shared components across all seven

All seven share these. The set is consistent enough that these should be built once, with each template composed from them. (T1 = ranking, T2 = explainer-panel, T3 = youtube-clips, T4 = business, T5 = visual-essay, T6 = split-reel, T7 = glass-explainer.)

| # | Component | Variants seen | Used by |
|---|---|---|---|
| 1 | **MediaSlot** (the talking-head layer) | full-bleed, panel, split-top, split-bottom, cut-out, behind-a-board | all 7 |
| 2 | **SceneSequencer** (hard cuts, absolute frames) | **104/210/345** preset (T2, T4, T5, T6, T7), 104/164/210/345 (T7), 75/112/188/269/372 (T3), single-scene (T1) | all 7 |
| 3 | **Backdrop** | black + dot grid, black + bokeh blobs, bottom or top radial wash, grain | T2–T7 |
| 4 | **Caption** (phrase timed, accent-word markup) | line, word-by-word, white-box, italic-caps (T1), **kicker + condensed headline** (T6) | all 7 |
| 5 | **Headline** (sans + accent keyword + underline, `wipe`) | 1–2 lines, condensed caps (T6) | T2–T7 |
| 6 | **GlassCard / Panel** (with `sheen` and active glow) | glass-grey, glass-dark, white UI card, notification | T2–T7 |
| 7 | **Chip / Pill / Tag** | slot chip, label pill, tag chip, step pill, check badge, "0 enquiries" pill | all 7 |
| 8 | **StepList** (numbered pills, nodes or cards, active state) | list + node chain, glass capsules, 3 cards, 3 cards + progress track | T2, T3, T4, T5, T6, T7 |
| 9 | **Counter** (`countUp`, day counter, delta) | "0", Day 0→30, "+12", "12", "30/30" | T2, T3, T5, T6, T7 |
| 10 | **ProgressGrid** (cells fill in sequence) | 10×3 orange, 10×3 green, 10×3 small pills (T6), 7 day-chips (T6) | T2, T3, T6 |
| 11 | **Chart / Sparkline** (`drawLine` + end dot) | line, sparkline, mini-chart, axes + dashed baseline (T7) | T2, T5, T6, T7 |
| 12 | **Connector** (solid / dashed line or arc, end dot) | hub→card, card→counter, node→node, card→card, dashed **arc** (T7) | T2, T6, T7 |
| 13 | **UI Mock card** (fake post / article / notification / doc / video card) | 6 kinds | T3, T4, T5, T7 |
| 14 | **ProgressTrack** (thin bar that fills) | 3 px under the cards | T7 (and a YouTube-style progress bar in T3) |
| 15 | **Animation primitives** | `blurIn`, `popIn`, `wipe`, `drawLine`, `countUp`, `sheen`, `glowPulse` | all 7 |

Only the tier board (T1) is template-specific, as `TierBoard` plus `TierCard`.

---

## 4. ShellShock Energy adaptation

### Brand constraints from the brief

- **Dark matte black base.** The templates use pure `#000`, which is glossy and flat. Use `#0A0A0B` plus the template's film grain to get the matte feel.
- **No stock people.** Every one of the seven templates is built around a talking head, so this is the biggest change. See "MediaSlot" below.
- **One accent system**, defined in §0.1 (gold gradient). Everything glowing, filled, underlined or counted derives from it.

### MediaSlot (replacing the stock talking head)

Three supported fills, none of them stock footage:
1. **Your own footage**, meaning Peter's or an athlete's clip that you supply.
2. **Product hero**: can or tub render, cut out on a rim-lit black. This is the right fill for T5's cut-out layout.
3. **ShellEmblem** (`video/src/ShellEmblem.tsx` already exists). It works as the hub icon in T2 and as an animated fallback.

For development, the slot should show a neutral labelled block ("MEDIA SLOT"). It should not show the template's human silhouette.

### Decisions (resolved and open)

1. **Accent: resolved.** Gold gradient on matte black, per §0.1.
2. **Accent-word font: resolved.** Robot Reavers Italic for accent words and numerals, Teko for everything else, per §0.1.
3. **No stock people: resolved.** The MediaSlot above (your footage, product hero cutout, or `ShellEmblem`).
4. **Robot Reavers files: resolved.** Added to `video/public/fonts/`. Teko is still to be bundled (I can fetch it from Google Fonts in step 2).
5. **Resolved: the two missing templates.** Both are now analysed (T6 and T7).
6. **Neon-green `video/` project: resolved.** Removed (the revenue-counter composition and its render scripts). `video/src/ShellEmblem.tsx` is kept but is still hard-coded neon green, so it needs recolouring to the gold accent before it is used.
7. **Template content.** All seven tell the same coaching story. For ShellShock the same structures fit "ranking pre-workouts", "3 reasons your pre-workout is failing you" and "30 days on Shell Shock". The **ranking tier-list (T1)** transfers most directly ("rank every flavour").

### What happens next (Step 2, not started)

On your approval I would:
1. Set up the shared components in §3 and the animation primitives in §1.
2. Rebuild each template, starting with T2 (the richest), then T1.
3. Overlay every render on the reference frames and correct any drift against §2.

No code has been written. I'm stopping here for your review.


---

## 5. Step 2 progress

| Template | Status |
|---|---|
| T2 `explainer-panel-reel` | **Built and verified** (`video/src/templates/Explainer.tsx`, composition `Explainer`). Timings match the reference within 1–3 frames on every measurable beat. |
| T1, T3, T4, T5, T6, T7 | not started |

**Built so far** (all in `video/src/`): `brand/theme.ts` (tokens), `brand/fonts.ts` (Teko 500/600/700 + Robot Reavers), `lib/anim.ts` (`blurIn`, `popIn`, `wipe`, `prog`), and components `Backdrop`, `MediaSlot`, `Caption`, `Headline`, `GlassCard`, `Pill`, `Line`, `Text` (`Accent`, `Num`).

**Two things the build exposed:**
1. `package.json` has `"sideEffects": ["*.css"]`, which made the bundler drop the side-effect-only `fonts.ts` import and silently fall back to a system font. The file is now listed in `sideEffects`.
2. `blurIn` sets `transform`, which overrides a centring `translateY(-50%)` on the same element. Centred, animated text must use an outer positioned wrapper and an inner animated element (see `Caption.tsx`).

**Media:** `Explainer` takes a `mediaSrc` prop. Without it the slot shows a neutral "MEDIA SLOT" block. Nothing human or stock is bundled.

**Rendering in this sandbox** needs the pre-installed Chromium because Remotion's own browser download is blocked here:
`npx remotion render Explainer out/explainer.mp4 --browser-executable=/opt/pw-browsers/chromium-1194/chrome-linux/chrome --chrome-mode=chrome-for-testing --gl=swangle`.
On a normal machine `npm run render:explainer` is enough.
