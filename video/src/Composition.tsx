import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { ShellEmblem } from "./ShellEmblem";

// Fonts are bundled in public/fonts so renders work offline.
const orbitron = "Orbitron";
const mono = "JetBrains Mono";
loadFont({ family: orbitron, url: staticFile("fonts/Orbitron-700.woff2"), weight: "700" });
loadFont({ family: mono, url: staticFile("fonts/JetBrainsMono-400.woff2"), weight: "400" });

const NEON = "#00ff41";
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  target: number;
  transparent: boolean;
};

// Revenue curve shape from the reference: slow start, spring ramp,
// summer plateau, hard Q4 spike. Normalized to 0 → 1 over x ∈ [0, 1].
const rawCurve = (x: number) =>
  0.5 / (1 + Math.exp(-(x - 0.35) * 12)) + 0.5 * Math.pow(x, 6);
const CURVE_MIN = rawCurve(0);
const CURVE_MAX = rawCurve(1);
const curve = (x: number) => (rawCurve(x) - CURVE_MIN) / (CURVE_MAX - CURVE_MIN);

// Timeline (seconds)
const PANEL_IN = [0, 0.6];
const COUNT = [0.8, 5.3];
const EMBLEM_IN = 0.4;

const alphaMetadata: CalculateMetadataFunction<Props> = () => ({
  defaultCodec: "prores",
  defaultVideoImageFormat: "png",
  defaultPixelFormat: "yuva444p10le",
  defaultProResProfile: "4444",
});

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="RevenueCounter"
        component={RevenueCounter}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ target: 300_000_000, transparent: false }}
      />
      <Composition
        id="RevenueCounterAlpha"
        component={RevenueCounter}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ target: 300_000_000, transparent: true }}
        calculateMetadata={alphaMetadata}
      />
    </>
  );
};

const CHART_W = 808;
const CHART_H = 520;

export const RevenueCounter: React.FC<Props> = ({ target, transparent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // One shared progress value drives both the line and the counter,
  // so the number always matches the height of the line's tip.
  const progress = interpolate(frame, [COUNT[0] * fps, COUNT[1] * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  const value = progress >= 1 ? target : Math.round(target * curve(progress));

  const steps = 240;
  const points: [number, number][] = [];
  for (let i = 0; i <= Math.ceil(steps * progress); i++) {
    const x = Math.min(i / steps, progress);
    points.push([x * CHART_W, CHART_H - 24 - curve(x) * (CHART_H - 72)]);
  }
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const tip = points[points.length - 1];
  const area = `${line} L${tip[0]},${CHART_H} L0,${CHART_H} Z`;

  const done = (frame - COUNT[1] * fps) / fps;
  const pulse = done > 0 ? Math.exp(-done * 3) : 0;

  return (
    <AbsoluteFill
      name="Background"
      style={{ backgroundColor: transparent ? "transparent" : "#000" }}
    >
      <Interactive.Div
        name="Panel"
        style={{
          position: "absolute",
          left: 80,
          top: 170,
          width: 920,
          height: 1580,
          borderRadius: 28,
          border: `2px solid rgba(0,255,65,0.35)`,
          padding: 12,
          boxShadow: `0 0 40px rgba(0,255,65,0.25), 0 0 120px rgba(0,255,65,0.12)`,
          opacity: interpolate(frame, [PANEL_IN[0] * fps, PANEL_IN[1] * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [PANEL_IN[0] * fps, PANEL_IN[1] * fps], [0.96, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 20,
            border: `4px solid ${NEON}`,
            overflow: "hidden",
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(0,255,65,0.10), rgba(0,255,65,0.03) 70%), #000",
            boxShadow: `0 0 18px ${NEON}, 0 0 48px rgba(0,255,65,0.55), inset 0 0 24px rgba(0,255,65,0.35)`,
          }}
        >
          {/* Scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(0,255,65,0.07) 0px, rgba(0,255,65,0.07) 1px, transparent 1px, transparent 4px)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />

          <div style={{ position: "absolute", left: 40, top: 60, right: 40 }}>
            <Interactive.Div
              name="Label"
              style={{
                fontFamily: mono,
                fontSize: 44,
                letterSpacing: 4,
                color: NEON,
                opacity: 0.85,
                textShadow: `0 0 12px rgba(0,255,65,0.6)`,
              }}
            >
              ANNUAL REVENUE
            </Interactive.Div>

            <div
              style={{
                marginTop: 18,
                fontFamily: orbitron,
                fontWeight: 700,
                fontSize: 84,
                color: NEON,
                whiteSpace: "nowrap",
                display: "flex",
                textShadow: `0 0 ${14 + pulse * 30}px ${NEON}, 0 0 ${40 + pulse * 60}px rgba(0,255,65,${0.5 + pulse * 0.4})`,
              }}
            >
              <Counter value={value} />
            </div>

            {/* Chart */}
            <div style={{ position: "relative", marginTop: 70, width: CHART_W, height: CHART_H }}>
              <svg width={CHART_W} height={CHART_H} style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NEON} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={NEON} stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="dotGlow" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="8" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {MONTHS.map((_, i) => (
                  <line
                    key={i}
                    x1={(i / 11) * CHART_W}
                    x2={(i / 11) * CHART_W}
                    y1={0}
                    y2={CHART_H}
                    stroke={NEON}
                    strokeOpacity={0.22}
                    strokeWidth={1.5}
                  />
                ))}
                <line x1={0} x2={CHART_W} y1={CHART_H} y2={CHART_H} stroke={NEON} strokeOpacity={0.3} strokeWidth={1.5} />
                {progress > 0 && (
                  <>
                    <path d={area} fill="url(#fill)" />
                    <path
                      d={line}
                      fill="none"
                      stroke={NEON}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                    />
                    <circle cx={tip[0]} cy={tip[1]} r={10} fill={NEON} filter="url(#dotGlow)" />
                  </>
                )}
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: CHART_H + 18,
                  left: 0,
                  width: CHART_W,
                  height: 40,
                  fontFamily: mono,
                  fontSize: 26,
                  color: NEON,
                  opacity: 0.8,
                }}
              >
                {MONTHS.map((m, i) => (
                  <span
                    key={m}
                    style={{
                      position: "absolute",
                      left: (i / 11) * CHART_W,
                      translate: "-50% 0",
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Interactive.Div
            name="Emblem"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 60,
              display: "flex",
              justifyContent: "center",
              opacity: interpolate(frame, [EMBLEM_IN * fps, (EMBLEM_IN + 0.8) * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <ShellEmblem size={420} pulse={pulse} />
          </Interactive.Div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};

// Fixed-width character cells: Orbitron is proportional, so without this
// the number would jitter sideways every frame as digits change.
const Counter: React.FC<{ value: number }> = ({ value }) => {
  const text = "$" + value.toLocaleString("en-US");
  return (
    <>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: ch === "," ? "0.36em" : "0.8em",
            textAlign: "center",
          }}
        >
          {ch}
        </span>
      ))}
    </>
  );
};
