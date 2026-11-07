import { OffthreadVideo, interpolate, staticFile } from "remotion";
import { color, font } from "../brand/theme";

type Props = {
  /** Footage the user supplies (no stock people). Placeholder block when omitted. */
  src?: string;
  layout: "panel" | "full" | "top" | "card";
  /** layout "top": a full-width block at `top` with this `height`. */
  height?: number;
  top?: number;
  /** layout "card": a rounded glass-edged card at (x, top) of width × height. */
  x?: number;
  width?: number;
  radius?: number;
  /** Fade the clip's audio out starting at this frame (over 4 frames), so a cut doesn't clip a breath. */
  fadeOutAt?: number;
  /** Talking-head punch-in (1 = none). */
  scale?: number;
  /** Vertical focus of the crop, 0 = top, 100 = bottom (cover-fit). Pick the face. */
  focusY?: number;
  /** Panel layout: y of the panel's top edge (default 938). */
  panelTop?: number;
};

const Placeholder: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, #2B2B30 0%, #17171A 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        fontFamily: font.sans,
        fontWeight: 500,
        fontSize: 26,
        letterSpacing: "0.2em",
        color: color.muted,
        border: "1px dashed rgba(255,255,255,0.25)",
        borderRadius: 999,
        padding: "4px 22px",
      }}
    >
      MEDIA SLOT
    </div>
  </div>
);

/** The talking-head / hero-footage layer. Panel = rounded inset at the bottom; full = full bleed. */
export const MediaSlot: React.FC<Props> = ({ src, layout, scale = 1, focusY = 50, panelTop = 938, height = 600, top = 0, x = 0, width = 720, radius = 22, fadeOutAt }) => {
  const inner = (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})` }}>
      {src ? (
        <OffthreadVideo
          src={/^https?:/.test(src) ? src : staticFile(src)}
          volume={(fr) => (fadeOutAt === undefined ? 1 : interpolate(fr, [fadeOutAt, fadeOutAt + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${focusY}%` }}
        />
      ) : (
        <Placeholder />
      )}
    </div>
  );
  if (layout === "card") {
    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top,
          width,
          height,
          borderRadius: radius,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.28)",
          boxShadow: "0 18px 44px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        {inner}
      </div>
    );
  }
  if (layout === "top") {
    return <div style={{ position: "absolute", left: 0, top, width: 720, height, overflow: "hidden" }}>{inner}</div>;
  }
  if (layout === "full") {
    return <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>{inner}</div>;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 46,
        top: panelTop,
        width: 628,
        height: 1280 - panelTop + 78,
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {inner}
    </div>
  );
};
