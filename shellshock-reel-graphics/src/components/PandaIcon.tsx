import React from "react";

/** Minimal flat panda face: white face, black ears + eye patches. */
export const PandaIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <circle cx={22} cy={24} r={15} fill="#0B0F0C" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
    <circle cx={78} cy={24} r={15} fill="#0B0F0C" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
    <circle cx={50} cy={55} r={38} fill="#FFFFFF" />
    <ellipse cx={33} cy={51} rx={10} ry={13.5} fill="#0B0F0C" transform="rotate(22 33 51)" />
    <ellipse cx={67} cy={51} rx={10} ry={13.5} fill="#0B0F0C" transform="rotate(-22 67 51)" />
    <circle cx={34.5} cy={50} r={3.4} fill="#FFFFFF" />
    <circle cx={65.5} cy={50} r={3.4} fill="#FFFFFF" />
    <ellipse cx={50} cy={67} rx={6.5} ry={4.6} fill="#0B0F0C" />
    <path d="M43.5 75 Q50 81 56.5 75" fill="none" stroke="#0B0F0C" strokeWidth={3} strokeLinecap="round" />
  </svg>
);
