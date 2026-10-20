import { AbsoluteFill } from "remotion";
import { color } from "../brand/theme";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")";

type Props = {
  /** Faint dot grid (explainer family). */
  dots?: boolean;
};

/** Matte black base + optional dot grid + film grain. */
export const Backdrop: React.FC<Props> = ({ dots = true }) => (
  <AbsoluteFill style={{ backgroundColor: color.bg }}>
    {dots && (
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1.3px, transparent 1.8px)",
          backgroundSize: "22.5px 22.5px",
          backgroundPosition: "11px 34px",
        }}
      />
    )}
    <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.05, mixBlendMode: "overlay" }} />
  </AbsoluteFill>
);
