/**
 * Layout sanity check for the map overlay (no rendering needed):
 *   npx tsx scripts/layout-check.ts
 * Verifies the HOME camera keeps the glass slab inside the safe zones and pins 1/2 are >=150px apart.
 */
import {projectPanelPoint, slamCamera} from '../src/camera';
import {HOME, MAP_CANVAS, MAP_SAFE, PANEL, STOPS, stopPanelXY} from '../src/mapConfig';

const safe = {
	l: MAP_SAFE.left,
	r: MAP_CANVAS.width - MAP_SAFE.right,
	t: MAP_SAFE.top,
	b: MAP_CANVAS.height - MAP_SAFE.bottom,
};
let bad = 0;
const flag = (ok: boolean, msg: string) => {
	if (!ok) bad++;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
};

const corners: [string, number, number][] = [
	['top-left', 0, 0],
	['top-right', PANEL.w, 0],
	['bottom-left', 0, PANEL.h],
	['bottom-right', PANEL.w, PANEL.h],
];
for (const [name, x, y] of corners) {
	const p = projectPanelPoint(x, y, HOME);
	flag(
		p.x >= safe.l && p.x <= safe.r && p.y >= safe.t && p.y <= safe.b,
		`slab ${name} -> (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`,
	);
}

const screen = STOPS.map((s) => {
	const [x, y] = stopPanelXY(s);
	return {s, ...projectPanelPoint(x, y, HOME)};
});
screen.forEach((p) => console.log(`pin ${p.s.id} ${p.s.label}: tip (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`));
const d12 = Math.hypot(screen[0].x - screen[1].x, screen[0].y - screen[1].y);
flag(d12 >= 150, `pin1<->pin2 distance ${d12.toFixed(0)}px (need >= 150)`);

for (const s of STOPS) {
	const c = slamCamera(30, s);
	const [x, y] = stopPanelXY(s);
	const p = projectPanelPoint(x, y, c);
	console.log(`slam ${s.id}: camera scale ${c.scale.toFixed(2)}, pin tip at (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
}
if (bad) {
	console.log(`\n${bad} problem(s)`);
	process.exit(1);
}
