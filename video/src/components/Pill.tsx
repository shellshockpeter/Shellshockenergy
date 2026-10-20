import type { CSSProperties } from "react";
import { accentFill, color, font } from "../brand/theme";

type Props = {
  children: React.ReactNode;
  style?: CSSProperties;
  size?: number;
  lip?: number;
};

/** Solid gold label (accent-fill, black text). */
export const AccentPill: React.FC<Props> = ({ children, style, size = 22, lip = 3 }) => (
  <div
    style={{
      background: accentFill(lip),
      color: color.onAccent,
      fontFamily: font.sans,
      fontWeight: 600,
      fontSize: size,
      lineHeight: 1,
      padding: `${size * 0.22}px ${size * 0.5}px ${size * 0.22 + lip}px`,
      borderRadius: 3,
      boxShadow: `0 0 14px ${color.glow}`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);
