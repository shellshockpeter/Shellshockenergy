import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../config";

/** Metallic gold foil text with a slow travelling sheen. */
export const GoldFoilText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  sheenOffset?: number;
}> = ({ children, style, sheenOffset = 0 }) => {
  const frame = useCurrentFrame() + sheenOffset;
  const pos = 140 - ((frame * 0.9) % 260); // sheen band travels across, loops slowly
  return (
    <span
      style={{
        display: "inline-block",
        lineHeight: 1,
        backgroundImage: [
          "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.85) 50%, transparent 58%)",
          `linear-gradient(180deg, ${COLORS.goldLight} 0%, ${COLORS.gold} 30%, ${COLORS.goldDeep} 56%, #F6DD93 78%, #A9781F 100%)`,
        ].join(","),
        backgroundSize: "260% 100%, 100% 100%",
        backgroundPosition: `${pos}% 0, 0 0`,
        backgroundRepeat: "no-repeat",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        filter: "drop-shadow(0 4px 22px rgba(232,194,106,0.38))",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
