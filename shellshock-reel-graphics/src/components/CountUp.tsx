import React from "react";
import { useCurrentFrame } from "remotion";
import { easeOut, ramp } from "../ease";
import { MONO } from "../fonts";

export const formatNum = (v: number, decimals = 0) =>
  v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Counts 0 -> `to` over `duration` frames (ease-out), monospace + tabular-nums. */
export const CountUp: React.FC<{
  to: number;
  decimals?: number;
  start: number; // local frame
  duration?: number;
  style?: React.CSSProperties;
}> = ({ to, decimals = 0, start, duration = 12, style }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, start, start + duration, easeOut);
  return (
    <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", fontWeight: 800, ...style }}>
      {formatNum(to * p, decimals)}
    </span>
  );
};
