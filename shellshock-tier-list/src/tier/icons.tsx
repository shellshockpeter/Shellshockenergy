import React from "react";
import { IngId } from "./data";

export const NEON = "#46FF7A";
export const GOLD = "#FFC94A";

// All icons live on a 120x120 grid, single stroke weight, angular geometry.
const SW = 3.2;

const hex = (cx: number, cy: number, r: number, rot = -90) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = ((rot + i * 60) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
const pts = (p: readonly (readonly [number, number])[]) =>
  p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");

const Creatine: React.FC = () => {
  const outer = hex(60, 60, 44);
  const inner = hex(60, 60, 22);
  const o = outer;
  // The outer hexagon is bitten off at the upper-right vertex by an angular notch.
  const nA: [number, number] = [76, 26.4];
  const nB: [number, number] = [86, 46];
  const nC: [number, number] = [o[1][0], 60];
  return (
    <>
      <polyline points={pts([nA, nB, nC])} />
      <polyline points={pts([nC, o[2], o[3], o[4], o[5], o[0], nA])} />
      {/* inner crystal + lattice spokes */}
      <polygon points={pts(inner)} />
      {inner.map((q, i) =>
        i === 1 ? null : (
          <line key={i} x1={q[0]} y1={q[1]} x2={outer[i][0]} y2={outer[i][1]} />
        ),
      )}
      <line x1={inner[1][0]} y1={inner[1][1]} x2={nB[0]} y2={nB[1]} />
    </>
  );
};

const Caffeine: React.FC = () => (
  <>
    {/* six-ring (pyrimidine) fused with five-ring (imidazole) */}
    <polygon points="38,36 58.8,48 58.8,72 38,84 17.2,72 17.2,48" />
    <polyline points="58.8,48 81.6,40.6 95.7,60 81.6,79.4 58.8,72" />
    {/* inner double bonds */}
    <polyline points="24,52 38,44 52,52" opacity={0.9} />
    <polyline points="52,68 38,76" opacity={0.9} />
    {/* carbonyl double bonds */}
    <line x1="17.2" y1="48" x2="6" y2="40" />
    <line x1="38" y1="84" x2="38" y2="102" />
    <line x1="32" y1="86" x2="32" y2="104" />
    {/* methyl groups */}
    <line x1="17.2" y1="72" x2="6" y2="82" />
    <line x1="81.6" y1="40.6" x2="88" y2="24" />
    <line x1="95.7" y1="60" x2="112" y2="60" />
  </>
);

const AlphaGPC: React.FC = () => (
  <>
    {/* angular octagon reticle */}
    <polygon points="45,22 75,22 98,45 98,75 75,98 45,98 22,75 22,45" />
    <polygon points="60,40 80,60 60,80 40,60" />
    {/* crosshair */}
    <line x1="60" y1="6" x2="60" y2="34" />
    <line x1="60" y1="86" x2="60" y2="114" />
    <line x1="6" y1="60" x2="34" y2="60" />
    <line x1="86" y1="60" x2="114" y2="60" />
    <circle cx="60" cy="60" r="2.6" fill="currentColor" />
  </>
);

const BetaAlanine: React.FC = () => {
  const h = hex(60, 60, 32);
  return (
    <>
      <polygon points={pts(h)} />
      {/* pulse line through the middle */}
      <polyline points="20,60 42,60 50,40 62,82 70,60 100,60" />
      {/* tingling spark dots */}
      {[
        [14, 24],
        [24, 12],
        [98, 18],
        [108, 34],
        [12, 98],
        [26, 108],
        [100, 100],
        [110, 84],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x - 2.2}
          y={y - 2.2}
          width={4.4}
          height={4.4}
          transform={`rotate(45 ${x} ${y})`}
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
      {/* radiating tick lines */}
      <line x1="60" y1="10" x2="60" y2="20" />
      <line x1="60" y1="100" x2="60" y2="110" />
    </>
  );
};

const Tyrosine: React.FC = () => {
  const nodes: [number, number][] = [
    [60, 62], // soma
    [24, 30],
    [20, 74],
    [60, 14],
    [98, 30],
    [102, 78],
    [64, 108],
  ];
  const links: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [0, 6],
    [1, 3],
    [4, 5],
  ];
  return (
    <>
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
      ))}
      <polygon points={pts(hex(60, 62, 13))} />
      {nodes.slice(1).map(([x, y], i) => (
        <polygon key={i} points={pts(hex(x, y, 6.5, -90))} />
      ))}
    </>
  );
};

const Tongkat: React.FC = () => (
  <>
    {/* angular root system */}
    <polyline points="60,8 60,36 52,48 54,66" />
    <polyline points="52,48 36,56 30,74 18,90 14,110" />
    <polyline points="30,74 40,92 34,112" />
    <polyline points="54,66 66,80 60,98 68,114" />
    <polyline points="60,36 74,46 82,62 100,76 106,96" />
    <polyline points="82,62 84,84 94,106" />
    <polyline points="46,22 60,30 74,20" />
  </>
);

const ICONS: Record<IngId, React.FC> = {
  creatine: Creatine,
  caffeine: Caffeine,
  alphagpc: AlphaGPC,
  betaalanine: BetaAlanine,
  tyrosine: Tyrosine,
  tongkat: Tongkat,
};

export const IngredientIcon: React.FC<{
  id: IngId;
  size: number;
  glow?: boolean;
}> = ({ id, size, glow = true }) => {
  const C = ICONS[id];
  const fid = `ig-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <filter id={fid} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      {glow && (
        <g
          filter={`url(#${fid})`}
          stroke={GOLD}
          strokeWidth={SW * 2.6}
          strokeLinejoin="miter"
          strokeLinecap="square"
          fill="none"
          color={GOLD}
          opacity={0.85}
        >
          <C />
        </g>
      )}
      <g
        stroke={NEON}
        strokeWidth={SW}
        strokeLinejoin="miter"
        strokeLinecap="square"
        fill="none"
        color={NEON}
      >
        <C />
      </g>
    </svg>
  );
};
