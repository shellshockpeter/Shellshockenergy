import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import "../brand/fonts";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { Headline } from "../components/Headline";
import { MediaSlot } from "../components/MediaSlot";
import { centerStyle } from "../components/Text";
import { accentGradient, color, font } from "../brand/theme";
import { blurIn, easeOut, prog } from "../lib/anim";

const cue = z.object({
  from: z.number().describe("first frame this caption shows"),
  to: z.number().describe("last frame this caption shows"),
  text: z.string().describe("wrap one word in *stars* to set it in the accent font"),
});

/** Numbered-list reel (SaaS list UI). Everything below is editable in Remotion Studio's props panel. */
export const numberedListSchema = z.object({
  mediaSrc: z
    .string()
    .describe("your clip: put it in video/public/media/ and enter media/yourclip.mp4. Empty = placeholder"),
  mediaFocusY: z.number().min(0).max(100).describe("vertical crop focus of your clip (0 top, 100 bottom): aim at the face"),
  line1: z.string(),
  lead: z.string().describe("plain words before the accent keyword on line 2"),
  accent: z.string().describe("accent keyword (Robot Reavers, gold)"),
  tail: z.string(),
  items: z
    .array(
      z.object({
        label: z.string().describe("keep to ~20 characters"),
        reveal: z.number().describe("frame this sign is revealed (30 per second)"),
      }),
    )
    .min(2)
    .max(5),
  shockLast: z.boolean().describe("punch-in, shake and flash when the last sign is revealed"),
  progressLabel: z.string().describe("shown under the progress bar, e.g. signs"),
  captions: z.array(cue),
});

export type NumberedListProps = z.infer<typeof numberedListSchema>;

const ROW0 = 346;
const PITCH = 80;
const barBg = "linear-gradient(90deg, #111113, #2C2C2F)";

const Mono: React.FC<{ children: React.ReactNode; size: number; style?: React.CSSProperties }> = ({
  children,
  size,
  style,
}) => (
  <div
    style={{ fontFamily: font.sans, fontWeight: 600, fontSize: size, lineHeight: 1, color: color.text, ...style }}
  >
    {children}
  </div>
);

export const NumberedList: React.FC<NumberedListProps> = (c) => {
  const f = useCurrentFrame();
  const n = c.items.length;
  const last = c.items[n - 1].reveal;
  const revealed = c.items.filter((it) => f >= it.reveal).length;

  // The shock beat on the final reveal: punch-in (persists), shake and flash (decay).
  const shockT = c.shockLast ? f - last : -1;
  const shaking = shockT >= 0 && shockT < 9;
  const shakeX = shaking ? Math.sin(shockT * 2.4) * 5 * (1 - shockT / 9) : 0;
  const flash = shockT >= 0 && shockT < 8 ? 0.2 * (1 - shockT / 8) : 0;
  const punch = c.shockLast && f >= last ? 1.1 : 1;

  // Progress bar fill: eased per reveal.
  const fill = c.items.reduce((acc, it) => acc + prog(f, it.reveal, 6, easeOut), 0) / n;

  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <Backdrop />
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shakeX}px)` }}>
        <Headline
          line1={c.line1}
          line2={{ lead: c.lead, accent: c.accent, tail: c.tail }}
          t={{ l1: [1, 8], l2: [9, 18], ul: [10, 14] }}
        />
        <div style={blurIn(f, 20, 6)}>
          {c.items.map((it, i) => {
            const y = ROW0 + i * PITCH;
            const on = prog(f, it.reveal, 4);
            const off = i < n - 1 ? prog(f, c.items[i + 1].reveal, 4) : 0;
            const pill = on * (1 - off);
            const isLast = i === n - 1;
            const pulse = isLast && f >= it.reveal ? 0.55 + 0.45 * Math.sin(f / 3) : 0;
            return (
              <div key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: 147,
                    top: y - 31.5,
                    width: 426,
                    height: 63,
                    background: barBg,
                    border: `1px solid ${isLast && on > 0 ? color.accent : "rgba(255,255,255,0.28)"}`,
                    boxShadow: isLast && on > 0 ? `0 0 ${14 + pulse * 22}px ${color.glow}` : "none",
                    opacity: isLast ? Math.max(pill, on) : pill,
                  }}
                >
                  <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: "100%", background: color.accent }} />
                </div>
                <Mono size={40} style={{ position: "absolute", left: 160, width: 64, textAlign: "center", top: y - 22 }}>
                  0{i + 1}
                </Mono>
                <Mono
                  size={40}
                  style={{
                    position: "absolute",
                    left: 235,
                    width: 330,
                    textAlign: "center",
                    top: y - 22,
                    filter: `blur(${(1 - on) * 9}px)`,
                    opacity: 0.5 + 0.5 * on,
                  }}
                >
                  {it.label}
                </Mono>
              </div>
            );
          })}
        </div>
        {/* progress track */}
        <div style={blurIn(f, 24, 6)}>
          <div style={{ position: "absolute", left: 46, top: 694, width: 628, height: 3, background: "rgba(255,255,255,0.18)" }}>
            <div style={{ width: `${fill * 100}%`, height: "100%", background: accentGradient, boxShadow: `0 0 10px ${color.glow}` }} />
            {c.items.map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${((i + 1) / n) * 100}%`,
                  top: -5,
                  width: 3,
                  height: 13,
                  marginLeft: -3,
                  background: i < revealed ? color.accentHi : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
          <Mono size={30} style={{ ...centerStyle(730), fontWeight: 500, color: color.muted, letterSpacing: "0.12em" }}>
            {revealed} / {n} {c.progressLabel.toUpperCase()}
          </Mono>
        </div>
        <Caption cues={c.captions} y={800} />
        <MediaSlot src={c.mediaSrc || undefined} layout="panel" scale={punch} focusY={c.mediaFocusY} panelTop={868} />
      </div>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, ${color.accentHi}, ${color.accent})`,
          opacity: flash,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

