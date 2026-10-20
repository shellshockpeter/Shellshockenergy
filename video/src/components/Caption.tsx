import { useCurrentFrame } from "remotion";
import { blurIn } from "../lib/anim";
import { color, font } from "../brand/theme";
import { Accent, centerStyle } from "./Text";

export type CaptionPart = { text: string; accent?: boolean };
export type CaptionCue = { from: number; to: number; text: string };

/** "get no *clients.*" → plain "get no ", accent "clients." */
export const parseMarkup = (text: string): CaptionPart[] =>
  text
    .split("*")
    .map((t, i) => ({ text: t, accent: i % 2 === 1 }))
    .filter((p) => p.text.length > 0);

type Props = {
  cues: CaptionCue[];
  y: number;
  size?: number;
};

/** Phrase-timed caption. Hard swap, with a 3f blurIn on each new phrase. */
export const Caption: React.FC<Props> = ({ cues, y, size = 48 }) => {
  const f = useCurrentFrame();
  const cue = cues.find((c) => f >= c.from && f <= c.to);
  if (!cue) return null;
  return (
    <div style={centerStyle(y)}>
      <div
        style={{
          ...blurIn(f, cue.from, 3),
          fontFamily: font.sans,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1,
          color: color.text,
          letterSpacing: "-0.01em",
          textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          whiteSpace: "pre",
        }}
      >
        {parseMarkup(cue.text).map((p, i) =>
          p.accent ? (
            <Accent key={i} size="1em">
              {p.text}
            </Accent>
          ) : (
            <span key={i}>{p.text}</span>
          ),
        )}
      </div>
    </div>
  );
};
