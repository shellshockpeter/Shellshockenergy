// Placeholder Shell Shock mark: top-down wireframe turtle shell.
// Swap for the real logo (e.g. <Img src={staticFile("logo.svg")} />) when it's ready.
const NEON = "#00ff41";
const CX = 200;
const CY = 240;
const RX = 180;
const RY = 220;

// Three vertebral scutes running down the spine
const HEXES = [150, 240, 330].map((cy) => {
  const w = 52;
  const h = 46;
  return [
    [CX - w, cy - h / 2],
    [CX, cy - h],
    [CX + w, cy - h / 2],
    [CX + w, cy + h / 2],
    [CX, cy + h],
    [CX - w, cy + h / 2],
  ] as [number, number][];
});

const onEllipse = (angleDeg: number, s: number): [number, number] => {
  const a = (angleDeg * Math.PI) / 180;
  return [CX + Math.cos(a) * RX * s, CY + Math.sin(a) * RY * s];
};

export const ShellEmblem: React.FC<{ size: number; pulse: number }> = ({
  size,
  pulse,
}) => {
  const mesh = Array.from({ length: 14 }, (_, i) => 0.15 + (i / 13) * 0.85);
  const spokes = Array.from({ length: 36 }, (_, i) => i * 10);
  // Costal seams: hex side vertices out to the inner rim
  const seams: [[number, number], [number, number]][] = [
    [HEXES[0][0], onEllipse(-150, 0.84)],
    [HEXES[0][2], onEllipse(-30, 0.84)],
    [HEXES[0][5], onEllipse(-178, 0.84)],
    [HEXES[0][3], onEllipse(-2, 0.84)],
    [HEXES[2][0], onEllipse(178, 0.84)],
    [HEXES[2][2], onEllipse(2, 0.84)],
    [HEXES[2][5], onEllipse(150, 0.84)],
    [HEXES[2][3], onEllipse(30, 0.84)],
    [HEXES[0][1], onEllipse(-90, 0.84)],
    [HEXES[2][4], onEllipse(90, 0.84)],
  ];

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 400 480"
      style={{
        overflow: "visible",
        filter: `drop-shadow(0 0 ${8 + pulse * 16}px ${NEON}) drop-shadow(0 0 ${24 + pulse * 30}px rgba(0,255,65,0.6))`,
      }}
    >
      {/* Fine wireframe mesh */}
      <g stroke={NEON} fill="none" strokeWidth={0.6} opacity={0.35}>
        {mesh.map((s) => (
          <ellipse key={s} cx={CX} cy={CY} rx={RX * s} ry={RY * s} />
        ))}
        {spokes.map((a) => {
          const [x, y] = onEllipse(a, 1);
          return <line key={a} x1={CX} y1={CY} x2={x} y2={y} />;
        })}
      </g>
      {/* Structure */}
      <g stroke={NEON} fill="none" strokeWidth={4} strokeLinejoin="round">
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
        <ellipse cx={CX} cy={CY} rx={RX * 0.84} ry={RY * 0.84} strokeWidth={2.5} />
        {HEXES.map((pts, i) => (
          <polygon
            key={i}
            points={pts.map((p) => p.join(",")).join(" ")}
            fill="rgba(0,255,65,0.12)"
          />
        ))}
        {seams.map(([a, b], i) => (
          <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={2.5} />
        ))}
        {Array.from({ length: 24 }, (_, i) => {
          const [x1, y1] = onEllipse(i * 15, 0.84);
          const [x2, y2] = onEllipse(i * 15, 1);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2} />;
        })}
      </g>
    </svg>
  );
};
