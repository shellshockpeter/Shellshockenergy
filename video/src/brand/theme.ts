// ShellShock brand tokens. See STYLE.md §0.1 (these supersede the reference templates' orange/serif/Inter).
export const W = 720;
export const H = 1280;
export const FPS = 30;
export const DURATION = 450;

export const color = {
  bg: "#0A0A0B",
  text: "#FFFFFF",
  muted: "#8A8A90",
  onAccent: "#0A0A0B",
  accent: "#FFB700",
  accentMid: "#FFD466",
  accentHi: "#FFE299",
  accentEdge: "#855F00",
  accentDim: "#402E00",
  glow: "rgba(255,183,0,0.25)",
  glassTop: "#5C5D64",
  glassBottom: "#43444B",
} as const;

export const accentGradient = `linear-gradient(90deg, ${color.accent}, ${color.accentMid}, ${color.accentHi})`;

/** Solid shapes: gold sweep with a dark-gold lip along the bottom edge. */
export const accentFill = (lip = 5) =>
  `linear-gradient(180deg, transparent calc(100% - ${lip}px), ${color.accentEdge} calc(100% - ${lip}px)), ${accentGradient}`;

export const font = {
  sans: "Teko, sans-serif",
  display: "'Robot Reavers', sans-serif",
} as const;

/** Reference templates were Inter-based; Teko needs ~+15% size to match cap height and width (measured). */
export const T = 1.15;

/**
 * Numerals (counters, step numbers) use Teko Bold, not Robot Reavers: at phone size RR's
 * "1" reads as "I", "0" as a hollow box and "3" as a mirrored "E". Flip to font.display to compare.
 */
export const NUMERAL_FONT = font.sans;
