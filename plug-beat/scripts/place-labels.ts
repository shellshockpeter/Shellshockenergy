/**
 * Finds clear spots (panel px) for the neighbour-town labels so they never overlap pins,
 * stop labels, the title or the route, and stay out of the centre-of-frame "counter zone".
 *
 *   npx tsx scripts/place-labels.ts
 *
 * Paste the printed `at` values into TOWN_LABELS in src/mapConfig.ts. Re-run it after you
 * change STOPS / MAP_ORIGIN / label sides.
 */
import {projectPanelPoint} from '../src/camera';
import {TOWN_PATHS} from '../src/geo/townPaths';
import {HOME, MAP_ORIGIN, PANEL, STOPS, TOWN_LABELS, labelLines, stopPanelXY} from '../src/mapConfig';

type Pt = [number, number];
type Box = {x0: number; y0: number; x1: number; y1: number; name: string};

const parse = (d: string): Pt[] =>
	d
		.replace(/[MZ]/g, '')
		.split('L')
		.map((s) => s.trim().split(/\s+/).map(Number) as Pt)
		.filter((p) => p.length === 2 && !Number.isNaN(p[0]))
		.map(([x, y]) => [x + MAP_ORIGIN.x, y + MAP_ORIGIN.y]);

const inside = (p: Pt, poly: Pt[]) => {
	let c = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
	}
	return c;
};
const segDist = (p: Pt, a: Pt, b: Pt) => {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
	return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};
const edgeDist = (p: Pt, poly: Pt[]) => {
	let m = Infinity;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) m = Math.min(m, segDist(p, poly[j], poly[i]));
	return m;
};
const crosses = (poly: Pt[], x0: number, y0: number, x1: number, y1: number) => {
	// true if any polygon edge passes through the rectangle
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [ax, ay] = poly[j];
		const [bx, by] = poly[i];
		if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(ay, by) < y0 || Math.min(ay, by) > y1) continue;
		for (let t = 0; t <= 1; t += 0.05) {
			const px = ax + (bx - ax) * t;
			const py = ay + (by - ay) * t;
			if (px >= x0 && px <= x1 && py >= y0 && py <= y1) return true;
		}
	}
	return false;
};
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/* ---- keep-out boxes in SCREEN space at HOME ---- */
const tips = STOPS.map((s) => {
	const [x, y] = stopPanelXY(s);
	return projectPanelPoint(x, y, HOME);
});
const keep: Box[] = [{name: 'title', x0: 130, y0: 1115, x1: 660, y1: 1232}];
const CHAR = 23; // approx px per char of the 34px Robot Reavers stop labels
STOPS.forEach((s, i) => {
	const t = tips[i];
	keep.push({name: `pin${s.id}`, x0: t.x - 44, y0: t.y - 122, x1: t.x + 44, y1: t.y + 8});
	const stacked = !!s.labelStack;
	const w = stacked ? s.label.length * CHAR + 10 : s.label.length * CHAR + 130; // label (+ DONE stamp beside it)
	const h = stacked ? 100 : 60; // stacked = label with the DONE stamp underneath
	const dx = s.labelDx ?? 0;
	const dy = s.labelDy ?? 0;
	let cx = t.x;
	let cy = t.y;
	if (s.labelSide === 'right') {
		cx = t.x + 54 + w / 2 + dx;
		cy = t.y - 76 + dy;
	} else if (s.labelSide === 'left') {
		cx = t.x - 54 - w / 2 + dx;
		cy = t.y - 76 + dy;
	} else if (s.labelSide === 'above') {
		cx = t.x + dx;
		cy = t.y - 130 - h / 2 + dy;
	} else {
		cx = t.x + dx;
		cy = t.y + 16 + h / 2 + dy;
	}
	keep.push({name: `label${s.id}`, x0: cx - w / 2 - 8, y0: cy - h / 2 - 8, x1: cx + w / 2 + 8, y1: cy + h / 2 + 8});
});
// route (thick polyline between ground points)
for (let i = 0; i < tips.length - 1; i++) {
	const a = tips[i];
	const b = tips[i + 1];
	const steps = 24;
	for (let k = 0; k <= steps; k++) {
		const x = a.x + ((b.x - a.x) * k) / steps;
		const y = a.y + ((b.y - a.y) * k) / steps;
		keep.push({name: 'route', x0: x - 18, y0: y - 18, x1: x + 18, y1: y + 18});
	}
}
// centre-of-frame counter zone: keep map labels out of it
keep.push({name: 'counter-zone', x0: 0, y0: 860, x1: 1080, y1: 1060});

/* ---- solve ---- */
type Pick = {p: Pt; score: number; size: number; oneLine: boolean; w: number; h: number};
const placed: Box[] = [];
const out: Record<string, Pick | null> = {};
const order = [...TOWN_LABELS].sort((a, b) => Number(!!b.focus) - Number(!!a.focus));
const MARGIN = 20;

for (const l of order) {
	const poly = parse(TOWN_PATHS[l.town].d);
	const focus = !!l.focus;
	const sizeList = focus ? [54, 48, 44, 40, 36, 32, 28, 26, 24, 22, 20] : [23, 20, 17];
	// multi-word focus towns may also be tried on a single line
	const modes = focus && labelLines(l.town).length > 1 ? [false, true] : [false];
	let best = null as Pick | null;

	search: for (const size of sizeList) {
		for (const oneLine of modes) {
			const lines = oneLine ? [l.town.toUpperCase()] : labelLines(l.town);
			const w = Math.max(...lines.map((t) => t.length)) * size * (focus ? 0.83 : 0.79) + 6;
			const h = size * 1.3 * lines.length + 4;
			for (let x = MARGIN + w / 2; x <= PANEL.w - MARGIN - w / 2; x += 6) {
				for (let y = MARGIN + h / 2; y <= PANEL.h - MARGIN - h / 2; y += 6) {
					const p: Pt = [x, y];
					const corners: Pt[] = [
						[x - w / 2, y - h / 2],
						[x + w / 2, y - h / 2],
						[x - w / 2, y + h / 2],
						[x + w / 2, y + h / 2],
					];
					// fully inside its own town, with no border line running through the text
					if (!inside(p, poly) || corners.some((c) => !inside(c, poly))) continue;
					if (crosses(poly, x - w / 2, y - h / 2, x + w / 2, y + h / 2)) continue;
					const clearance = Math.min(...corners.map((c) => edgeDist(c, poly)), edgeDist(p, poly));
					if (clearance < 4) continue;
					const s = projectPanelPoint(x, y, HOME);
					const box: Box = {name: l.town, x0: s.x - w / 2 - 6, y0: s.y - h / 2 - 6, x1: s.x + w / 2 + 6, y1: s.y + h / 2 + 6};
					if ([...keep, ...placed].some((k) => overlap(box, k))) continue;
					const panelClear = Math.min(x - w / 2, PANEL.w - (x + w / 2), y - h / 2, PANEL.h - (y + h / 2));
					const score = Math.min(clearance, panelClear + 12);
					if (!best || score > best.score) best = {p, score, size, oneLine, w, h};
				}
			}
			if (best) break search; // biggest size that fits wins
		}
	}
	out[l.town] = best;
	if (best) {
		const s = projectPanelPoint(best.p[0], best.p[1], HOME);
		placed.push({name: l.town, x0: s.x - best.w / 2 - 8, y0: s.y - best.h / 2 - 8, x1: s.x + best.w / 2 + 8, y1: s.y + best.h / 2 + 8});
	}
}

for (const l of TOWN_LABELS) {
	const v = out[l.town];
	console.log(
		`${l.town.padEnd(14)} ${v ? `at: [${Math.round(v.p[0])}, ${Math.round(v.p[1])}], size: ${v.size}${v.oneLine ? ', oneLine: true' : ''}` : 'NO CLEAR SPOT (label hidden)'}`,
	);
}
