import { AbsoluteFill, Easing, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import "../brand/fonts";
import { KineticLine, hash, scramble, toWords } from "../components/Kinetic";
import { LiquidBackdrop, glass } from "../components/LiquidBackdrop";
import { MediaSlot } from "../components/MediaSlot";
import { FPS, accentFill, accentGradient, color, font } from "../brand/theme";
import { lerp, prog } from "../lib/anim";

/** Numbered-list reel (SaaS list UI). Everything below is editable in Remotion Studio's props panel. */
export const numberedListSchema = z.object({
  mediaSrc: z
    .string()
    .describe("your clip: put it in video/public/media/ and enter media/yourclip.mp4. Empty = placeholder"),
  mediaFocusY: z.number().min(0).max(100).describe("vertical crop focus of your clip (0 top, 100 bottom): aim at the face"),
  buildFrame: z
    .number()
    .describe("frame the chart starts building onto the screen: set this to when you say 'here are four signs' (30 per second)"),
  teaser: z.string().describe("small line at the top of the chart until the last sign pings"),
  teaserAfter: z.string().describe("replaces the teaser when the last sign pings"),
  title1: z.string(),
  title2: z.string().describe("wrap the accent word in *stars*, e.g. Is Killing Your *Gains*"),
  items: z
    .array(
      z.object({
        label: z.string().describe("keep to ~24 characters"),
        ping: z.number().describe("frame the gold highlight hits this row (30 per second)"),
      }),
    )
    .min(2)
    .max(5),
  unblurOnPing: z
    .boolean()
    .describe("OFF for the hook (signs stay unreadable). ON for the payoff video: each sign decodes when pinged"),
  shockLast: z.boolean().describe("punch-in, shake and flash when the last sign pings"),
  cta: z.string().describe("label under the progress bar"),
});

export type NumberedListProps = z.infer<typeof numberedListSchema>;

// Layout (720×1280). Chart on top (inside the platform-safe area), clip below.
const PANEL = { x: 30, y: 104, w: 660, h: 512 };
const KICK_Y = 148;
const T1_Y = 194;
const T2_Y = 242;
const ROW0 = 326;
const PITCH = 62;
const ROW_X = 54;
const ROW_W = 612;
const ROW_H = 50;
const SEG_Y = 566;
const CTA_Y = 596;
const MEDIA_TOP = 634;
const MEDIA_H = 646;
const HIDDEN_BLUR = 14; // unreadable, but still clearly a smear of words
const SCAN_FROM = 262;
const SCAN_TO = 556;

const rowY = (i: number): number => ROW0 + i * PITCH;

const Lock: React.FC<{ rot: number }> = ({ rot }) => (
  <svg width={22} height={26} viewBox="0 0 22 26" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={2.2}
    style={{ transform: `rotate(${rot}deg)`, transformOrigin: "50% 80%" }}>
    <rect x="2" y="11" width="18" height="13" rx="3" fill="rgba(255,255,255,0.1)" />
    <path d="M6 11V8a5 5 0 0 1 10 0v3" />
  </svg>
);

const Check: React.FC = () => (
  <svg width={26} height={26} viewBox="0 0 26 26">
    <circle cx="13" cy="13" r="13" fill={color.accent} />
    <path d="M7 13.5l4 4 8-9" stroke={color.onAccent} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Rounded-rect outline that draws itself (stroke-dashoffset), used for the "formulating" build. */
const Wire: React.FC<{ x: number; y: number; w: number; h: number; r: number; p: number }> = ({ x, y, w, h, r, p }) => (
  <svg width={720} height={1280} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={r}
      fill="none"
      stroke={color.accent}
      strokeWidth={2}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
      style={{ filter: `drop-shadow(0 0 6px ${color.glow})` }}
      opacity={p < 1 ? 1 : 0}
    />
  </svg>
);

export const NumberedList: React.FC<NumberedListProps> = (c) => {
  const f = useCurrentFrame();
  const B = c.buildFrame;
  const n = c.items.length;
  const pings = c.items.map((it) => it.ping);
  const lastPing = pings[n - 1];
  const tense = f >= pings[n - 2]; // the last row starts to misbehave once the one before it pings

  // Active row = last one whose ping has passed.
  let active = -1;
  pings.forEach((p, i) => {
    if (f >= p) active = i;
  });

  // Shock beat on the last ping: punch-in, shake, flash, chroma split (all decay).
  const st = c.shockLast ? f - lastPing : -1;
  const shakeX = st >= 0 && st < 10 ? Math.sin(st * 2.6) * 6 * (1 - st / 10) : 0;
  const shakeY = st >= 0 && st < 10 ? Math.cos(st * 3.1) * 4 * (1 - st / 10) : 0;
  const flash = st >= 0 && st < 8 ? 0.22 * (1 - st / 8) : 0;
  const split = st >= 0 && st < 9 ? 5 * (1 - st / 9) : 0;

  // Media: entrance zoom-out, slow drift, punch-in on the shock beat.
  const mediaScale =
    lerp(1.12, 1, prog(f, 0, 10)) * (1 + 0.035 * (f / 198)) * (c.shockLast && st >= 0 ? lerp(1, 1.1, prog(f, lastPing, 4)) : 1);

  // Build: the panel draws itself, then a gold scan line sweeps down and each row is constructed as it passes.
  const panelP = prog(f, B, 9);
  const panelS = spring({ frame: f - B, fps: FPS, config: { damping: 14, stiffness: 160, mass: 0.8 } });
  const scanP = prog(f, B + 8, 22, (t) => t);
  const scanY = lerp(SCAN_FROM, SCAN_TO, scanP);
  const scanOn = f >= B + 8 && f < B + 34;
  const rowStart = (i: number): number => B + 8 + (22 * (rowY(i) - SCAN_FROM)) / (SCAN_TO - SCAN_FROM);

  // Highlight bar: squash-and-stretch jump from row to row.
  const hl = (() => {
    if (active < 0) return null;
    const toY = rowY(active);
    const fromY = active === 0 ? toY - 26 : rowY(active - 1);
    const p = prog(f, pings[active], 9, Easing.out(Easing.back(1.8)));
    return { y: lerp(fromY, toY, p), sy: 1 + 0.2 * Math.sin(Math.PI * Math.min(1, prog(f, pings[active], 9))), p };
  })();

  // Kicker (teaser) text.
  const teaser = f < lastPing ? c.teaser : scramble(c.teaserAfter, f, lastPing, 0.7);
  const kickOpacity = f < lastPing ? 0.65 + 0.35 * Math.sin(f / 5) : 1;

  const seamX = ((f * 9) % 1100) - 190;

  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <LiquidBackdrop />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        {/* the chart panel: draws, then fills with frosted glass */}
        <Wire x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} r={28} p={panelP} />
        <div
          style={{
            position: "absolute",
            left: PANEL.x,
            top: PANEL.y,
            width: PANEL.w,
            height: PANEL.h,
            borderRadius: 28,
            ...glass(0.9),
            opacity: prog(f, B + 5, 8),
            transform: `scale(${lerp(0.96, 1, Math.min(1.05, panelS))})`,
          }}
        />

        {/* teaser kicker */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: 720,
            top: KICK_Y,
            transform: "translateY(-50%)",
            textAlign: "center",
            fontFamily: font.sans,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: "0.22em",
            color: color.accent,
            opacity: kickOpacity * prog(f, B + 1, 6),
            textShadow: `0 0 12px ${color.glow}`,
          }}
        >
          {teaser.toUpperCase()}
        </div>
        <KineticLine words={toWords(c.title1)} y={T1_Y} start={B + 2} stagger={2} size={44} />
        <KineticLine words={toWords(c.title2)} y={T2_Y} start={B + 9} stagger={2} size={44} underlineAt={B + 18} />

        {/* gold scan line sweeping down while the rows are constructed */}
        {scanOn && (
          <div
            style={{
              position: "absolute",
              left: PANEL.x + 10,
              top: scanY - 1.5,
              width: PANEL.w - 20,
              height: 3,
              background: `linear-gradient(90deg, transparent, ${color.accentHi}, ${color.accent}, ${color.accentHi}, transparent)`,
              boxShadow: `0 0 18px ${color.accent}`,
              opacity: 1 - prog(f, B + 28, 6),
            }}
          />
        )}

        {/* rows: wire outline → frosted glass fill */}
        {c.items.map((it, i) => {
          const s0 = rowStart(i);
          const s = spring({ frame: f - s0, fps: FPS, config: { damping: 13, stiffness: 170, mass: 0.7 } });
          const x = (i % 2 ? 1 : -1) * 90 * (1 - s);
          const bob = f > B + 36 ? Math.sin((f + i * 9) / 14) * 1.5 : 0;
          const y = rowY(i) - ROW_H / 2 + bob;
          const shimmer = ((f * 7 + i * 120) % 1000) - 200;
          const revealed = c.unblurOnPing && f >= it.ping;
          const isLast = i === n - 1;
          const crazy = isLast && tense;
          const fill = prog(f, s0 + 4, 6);
          return (
            <div key={i}>
              <Wire x={ROW_X + x} y={y} w={ROW_W} h={ROW_H} r={9} p={prog(f, s0, 7)} />
              <div
                style={{
                  position: "absolute",
                  left: ROW_X,
                  top: y,
                  width: ROW_W,
                  height: ROW_H,
                  borderRadius: 9,
                  ...glass(1.1),
                  border: `1px solid ${crazy ? `rgba(255,183,0,${0.4 + 0.3 * Math.sin(f / 3)})` : "rgba(255,255,255,0.24)"}`,
                  opacity: fill,
                  transform: `translateX(${x}px)`,
                  overflow: "hidden",
                  boxShadow: crazy
                    ? `0 0 ${10 + 8 * Math.sin(f / 3)}px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.38)`
                    : glass().boxShadow,
                }}
              >
                {!revealed && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: shimmer,
                      width: 110,
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                      transform: "skewX(-20deg)",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* highlight bar: gold liquid glass */}
        {hl && (
          <div
            style={{
              position: "absolute",
              left: ROW_X,
              top: hl.y - ROW_H / 2,
              width: ROW_W,
              height: ROW_H,
              borderRadius: 9,
              background: accentFill(4),
              boxShadow: `0 0 ${18 + (active === n - 1 ? 10 * Math.sin(f / 3) : 0)}px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
              transform: `scaleY(${hl.sy}) scaleX(${active === n - 1 ? 1 + 0.02 * Math.sin(f / 2.5) : 1})`,
              opacity: 0.96,
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent 55%)" }} />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: (f - pings[active]) * 38 - 120,
                width: 90,
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                transform: "skewX(-20deg)",
              }}
            />
          </div>
        )}

        {/* rows: ripples, numerals, labels, locks */}
        {c.items.map((it, i) => {
          const s0 = rowStart(i);
          const s = spring({ frame: f - s0, fps: FPS, config: { damping: 13, stiffness: 170, mass: 0.7 } });
          const x = (i % 2 ? 1 : -1) * 90 * (1 - s);
          const bob = f > B + 36 ? Math.sin((f + i * 9) / 14) * 1.5 : 0;
          const cy = rowY(i) + bob;
          const isLast = i === n - 1;
          const crazy = isLast && tense;
          const pinged = f >= it.ping;
          const revealed = c.unblurOnPing && pinged;
          const onGold = active === i && hl !== null && hl.p > 0.3;
          const ink = onGold ? color.onAccent : color.text;
          const dt = f - it.ping;
          const content = prog(f, s0 + 5, 5);

          const peek = pinged ? 3 * (1 - prog(f, it.ping, 12)) : 0;
          const breath = crazy ? 2.5 * Math.sin(f / 3.5) : 0;
          const blur = revealed ? HIDDEN_BLUR * (1 - prog(f, it.ping, 8)) : HIDDEN_BLUR - peek + breath;
          const amp = crazy ? 3 : 1.2;
          const jx = revealed && blur < 2 ? 0 : (hash(Math.floor(f / 2) + i * 13) - 0.5) * 2 * amp;
          const label = revealed ? scramble(it.label, f, it.ping, 0.9) : it.label;
          const pop = pinged ? spring({ frame: dt, fps: FPS, config: { damping: 9, stiffness: 240, mass: 0.5 } }) : 1;

          const rot = revealed
            ? 0
            : crazy
              ? Math.sin(f / 1.3) * 5
              : pinged
                ? Math.sin(dt * 1.6) * 14 * (1 - prog(f, it.ping, 12))
                : 0;

          const rings = pinged
            ? [0, isLast && c.shockLast ? 5 : -1].filter((d) => d >= 0).map((d, k) => {
                const p = prog(f, it.ping + d, 16);
                const r = lerp(14, k === 0 ? 70 : 150, p);
                return (
                  <div
                    key={k}
                    style={{
                      position: "absolute",
                      left: ROW_X + 36 - r,
                      top: cy - r,
                      width: r * 2,
                      height: r * 2,
                      borderRadius: "50%",
                      border: `2px solid ${color.accent}`,
                      opacity: (1 - p) * 0.9,
                    }}
                  />
                );
              })
            : null;

          return (
            <div key={i}>
              {rings}
              <div
                style={{
                  position: "absolute",
                  left: ROW_X,
                  top: cy - ROW_H / 2,
                  width: ROW_W,
                  height: ROW_H,
                  transform: `translateX(${x}px)`,
                  opacity: content,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    width: 72,
                    top: 0,
                    height: ROW_H,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: font.sans,
                    fontWeight: 700,
                    fontSize: 36,
                    color: ink,
                    transform: `scale(${lerp(1.7, 1, Math.min(1.15, pop))})`,
                  }}
                >
                  0{i + 1}
                </div>
                {isLast && split > 0.3 &&
                  [-1, 1].map((d) => (
                    <div
                      key={d}
                      style={{
                        position: "absolute",
                        left: 88 + d * split,
                        top: 0,
                        height: ROW_H,
                        display: "flex",
                        alignItems: "center",
                        fontFamily: font.sans,
                        fontWeight: 600,
                        fontSize: 36,
                        color: d < 0 ? color.accentHi : "#fff",
                        opacity: 0.55,
                        filter: `blur(${Math.max(0, blur)}px)`,
                        mixBlendMode: "screen",
                      }}
                    >
                      {it.label}
                    </div>
                  ))}
                <div
                  style={{
                    position: "absolute",
                    left: 88 + jx,
                    top: 0,
                    height: ROW_H,
                    display: "flex",
                    alignItems: "center",
                    fontFamily: font.sans,
                    fontWeight: 600,
                    fontSize: 36,
                    whiteSpace: "pre",
                    color: ink,
                    opacity: revealed ? 1 : (onGold ? 0.9 : 0.85) + (crazy ? 0.1 * Math.sin(f / 2) : 0),
                    filter: `blur(${Math.max(0, blur)}px)`,
                  }}
                >
                  {label}
                </div>
                <div style={{ position: "absolute", right: 20, top: 0, height: ROW_H, display: "flex", alignItems: "center" }}>
                  {revealed ? (
                    <div style={{ transform: `scale(${Math.min(1.3, pop)})` }}>
                      <Check />
                    </div>
                  ) : (
                    <div style={{ filter: onGold ? "invert(1)" : undefined }}>
                      <Lock rot={rot} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* segmented progress: fills as the highlight scans */}
        {c.items.map((it, i) => {
          const gap = 8;
          const w = (ROW_W - gap * (n - 1)) / n;
          const on = prog(f, it.ping, 8);
          const pop = f >= it.ping ? 1 + 0.9 * (1 - prog(f, it.ping, 8)) : 1;
          const blink = i === n - 1 && tense && f < lastPing ? 0.5 + 0.5 * Math.sin(f / 2) : 0;
          const enter = prog(f, B + 26 + i * 2, 7);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: ROW_X + i * (w + gap),
                top: SEG_Y,
                width: w,
                height: 8,
                borderRadius: 3,
                background: "rgba(255,255,255,0.18)",
                opacity: enter,
                transform: `scaleY(${pop})`,
                boxShadow: blink > 0 ? `0 0 ${6 + 8 * blink}px ${color.glow}` : "none",
                border: blink > 0 ? `1px solid rgba(255,183,0,${0.3 + 0.6 * blink})` : "none",
              }}
            >
              <div style={{ width: `${on * 100}%`, height: "100%", borderRadius: 3, background: accentGradient, boxShadow: `0 0 10px ${color.glow}` }} />
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: 720,
            top: CTA_Y,
            transform: "translateY(-50%)",
            textAlign: "center",
            fontFamily: font.sans,
            fontWeight: 500,
            fontSize: 24,
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.6)",
            opacity: prog(f, B + 32, 7) * (0.75 + 0.25 * Math.sin(f / 6)),
          }}
        >
          {c.cta.toUpperCase()}
        </div>

        {/* the clip, below the chart */}
        <MediaSlot src={c.mediaSrc || undefined} layout="top" top={MEDIA_TOP} height={MEDIA_H} scale={mediaScale} focusY={c.mediaFocusY} />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: MEDIA_TOP,
            width: 720,
            height: 60,
            background: "linear-gradient(180deg, rgba(10,10,13,0.85), transparent)",
          }}
        />
        <div style={{ position: "absolute", left: 0, top: MEDIA_TOP - 1, width: 720, height: 2, background: "rgba(255,255,255,0.14)" }} />
        <div
          style={{
            position: "absolute",
            left: seamX,
            top: MEDIA_TOP - 2,
            width: 190,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${color.accentHi}, transparent)`,
            filter: `drop-shadow(0 0 6px ${color.accent})`,
          }}
        />
      </div>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 30%, ${color.accentHi}, ${color.accent})`,
          opacity: flash,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
