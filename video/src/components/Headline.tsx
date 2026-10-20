import { useCurrentFrame } from "remotion";
import { prog, wipe } from "../lib/anim";
import { T, color, font } from "../brand/theme";
import { Accent, centerStyle } from "./Text";

type Props = {
  /** Line 1: plain text. */
  line1: string;
  /** Line 2: optional lead word(s), then an accent keyword, then optional tail. */
  line2: { lead?: string; accent: string; tail?: string };
  /** Absolute frames: line 1 wipe, line 2 wipe, underline draw. */
  t: { l1: [number, number]; l2: [number, number]; ul: [number, number] };
};

const base = {
  fontFamily: font.sans,
  fontWeight: 600,
  fontSize: 40 * T,
  lineHeight: 1,
  color: color.text,
  letterSpacing: "-0.005em",
  whiteSpace: "pre",
} as const;

/** Two-line title: sans line, then a line with a Robot Reavers accent keyword and a gold underline. */
export const Headline: React.FC<Props> = ({ line1, line2, t }) => {
  const f = useCurrentFrame();
  const ul = prog(f, t.ul[0], t.ul[1] - t.ul[0], (x) => x);
  return (
    <>
      <div style={{ ...centerStyle(208), ...base }}>
        <span style={wipe(f, t.l1[0], t.l1[1] - t.l1[0])}>{line1}</span>
      </div>
      <div style={{ ...centerStyle(253), ...base }}>
        <span style={{ position: "relative", display: "inline-block" }}>
          <span style={{ display: "inline-block", ...wipe(f, t.l2[0], t.l2[1] - t.l2[0]) }}>
            {line2.lead}
            <Accent size="1em">{line2.accent}</Accent>
            {line2.tail}
          </span>
          <span
            style={{
              position: "absolute",
              left: 0,
              bottom: -2,
              height: 2,
              width: `${ul * 100}%`,
              background: color.accent,
            }}
          />
        </span>
      </div>
    </>
  );
};
