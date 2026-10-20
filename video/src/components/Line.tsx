import { color } from "../brand/theme";

type Props = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** 0→1 draw progress. */
  p: number;
  dashed?: boolean;
  stroke?: string;
  width?: number;
  /** Dot at the far end once drawn. */
  dot?: boolean;
};

/** Full-canvas SVG line that draws from (x1,y1) toward (x2,y2). */
export const Line: React.FC<Props> = ({ x1, y1, x2, y2, p, dashed, stroke = color.accent, width = 2, dot }) => {
  const ex = x1 + (x2 - x1) * p;
  const ey = y1 + (y2 - y1) * p;
  return (
    <svg width={720} height={1280} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <line
        x1={x1}
        y1={y1}
        x2={ex}
        y2={ey}
        stroke={stroke}
        strokeWidth={width}
        strokeDasharray={dashed ? "3 5" : undefined}
        strokeLinecap="round"
      />
      {dot && p >= 1 && <circle cx={x2} cy={y2} r={6} fill={color.accent} />}
    </svg>
  );
};
