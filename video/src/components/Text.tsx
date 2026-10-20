import type { CSSProperties } from "react";
import { NUMERAL_FONT, accentGradient, font } from "../brand/theme";

/** A word set in Robot Reavers Italic with the gold gradient. */
export const Accent: React.FC<{ children: React.ReactNode; size?: string }> = ({
  children,
  size = "1em",
}) => (
  <span
    style={{
      fontFamily: font.display,
      fontStyle: "italic",
      fontWeight: 400,
      fontSize: size,
      backgroundImage: accentGradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      display: "inline-block",
      paddingRight: "0.12em",
      lineHeight: 1,
    }}
  >
    {children}
  </span>
);

/** Centered line at a given y (px), horizontally centered on x=360. */
export const centerStyle = (y: number): CSSProperties => ({
  position: "absolute",
  left: 0,
  width: 720,
  top: y,
  transform: "translateY(-50%)",
  textAlign: "center",
});

/** Gold-gradient numeral (counters, step numbers). Upright Teko Bold for legibility. */
export const Num: React.FC<{ children: React.ReactNode; size: number; style?: CSSProperties }> = ({
  children,
  size,
  style,
}) => (
  <span
    style={{
      fontFamily: NUMERAL_FONT,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1,
      backgroundImage: accentGradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      display: "inline-block",
      ...style,
    }}
  >
    {children}
  </span>
);
