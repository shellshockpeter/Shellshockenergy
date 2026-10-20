import type { CSSProperties } from "react";
import { color } from "../brand/theme";

type Props = {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  active?: boolean;
  style?: CSSProperties;
  children?: React.ReactNode;
};

/** Glass card: grey vertical gradient, hairline border, optional gold active glow. */
export const GlassCard: React.FC<Props> = ({ x, y, w, h, radius = 10, active, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: radius,
      background: `linear-gradient(180deg, ${color.glassTop}, ${color.glassBottom})`,
      border: active ? `2px solid ${color.accent}` : "1px solid rgba(255,255,255,0.35)",
      boxShadow: active
        ? `0 0 24px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
        : "0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
      ...style,
    }}
  >
    {children}
  </div>
);
