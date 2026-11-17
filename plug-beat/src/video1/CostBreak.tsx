import React, {useLayoutEffect, useRef} from 'react';
import {Easing, random, useCurrentFrame} from 'remotion';
import {DISPLAY_FONT, useFontsReady} from '../theme';
import type {ResolvedTimeline} from './timeline';

/* canvas geometry (CSS px in the 1080x1920 frame) */
const CW = 920; // left 80 .. right 1000 (safe zone)
const CH = 1000;
const TOP = 380;
const CY = 520; // text centre inside the canvas  -> screen y 900
const BLOCK = 26; // final pixel size
const PIXEL_FRAMES = 10;
const CRACK_FRAMES = 14;
const RED = '#FF2A2A';
const HOT = '#FF8E8E';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Pt = [number, number];

/* ---- deterministic cracks (seeded) ------------------------------------------------------ */
const makeCracks = (halfW: number, halfH: number): Pt[][] => {
	const out: Pt[][] = [];
	const cx = CW / 2;
	for (let i = 0; i < 8; i++) {
		const sx = cx + (random(`crack-x-${i}`) - 0.5) * halfW * 1.7;
		const sy = CY + (random(`crack-y-${i}`) - 0.5) * halfH * 1.5;
		const base = random(`crack-a-${i}`) * Math.PI * 2;
		for (const dir of [0, Math.PI]) {
			let ang = base + dir;
			let [x, y] = [sx, sy];
			const pts: Pt[] = [[x, y]];
			const n = 7 + Math.floor(random(`crack-n-${i}-${dir}`) * 6);
			for (let k = 0; k < n; k++) {
				ang += (random(`crack-j-${i}-${dir}-${k}`) - 0.5) * 1.1;
				const step = 34 + random(`crack-s-${i}-${dir}-${k}`) * 40;
				x += Math.cos(ang) * step;
				y += Math.sin(ang) * step;
				pts.push([x, y]);
				// side branch
				if (k === 2 || k === 4) {
					const bp: Pt[] = [[x, y]];
					let ba = ang + (random(`crack-b-${i}-${dir}-${k}`) > 0.5 ? 1 : -1) * (0.7 + random(`crack-ba-${i}-${dir}-${k}`) * 0.6);
					let [bx, by] = [x, y];
					for (let m = 0; m < 4; m++) {
						ba += (random(`crack-bj-${i}-${dir}-${k}-${m}`) - 0.5) * 0.9;
						bx += Math.cos(ba) * (22 + random(`crack-bs-${i}-${dir}-${k}-${m}`) * 22);
						by += Math.sin(ba) * (22 + random(`crack-bs2-${i}-${dir}-${k}-${m}`) * 22);
						bp.push([bx, by]);
					}
					out.push(bp);
				}
			}
			out.push(pts);
		}
	}
	return out;
};

const strokePartial = (ctx: CanvasRenderingContext2D, pts: Pt[], frac: number) => {
	if (frac <= 0) return;
	let total = 0;
	for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
	let remain = total * frac;
	ctx.beginPath();
	ctx.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length && remain > 0; i++) {
		const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
		const t = Math.min(1, remain / seg);
		ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t));
		remain -= seg;
	}
	ctx.stroke();
};

/* ---- text helpers ----------------------------------------------------------------------- */
const setFont = (ctx: CanvasRenderingContext2D, size: number) => {
	ctx.font = `${size}px "${DISPLAY_FONT}"`;
	ctx.textBaseline = 'alphabetic';
};

/** Draw `str` centred at (cx, cy) with a fixed cell width per digit so counting doesn't jitter. */
const drawCentered = (ctx: CanvasRenderingContext2D, str: string, size: number, cx: number, cy: number, digitW: number) => {
	setFont(ctx, size);
	const widths = Array.from(str).map((ch) => (/\d/.test(ch) ? digitW : ctx.measureText(ch).width));
	const total = widths.reduce((a, b) => a + b, 0);
	let x = cx - total / 2;
	ctx.textAlign = 'left';
	Array.from(str).forEach((ch, i) => {
		const w = ctx.measureText(ch).width;
		ctx.fillText(ch, x + (widths[i] - w) / 2, cy + size * 0.36);
		x += widths[i];
	});
};

const neonText = (ctx: CanvasRenderingContext2D, str: string, size: number, cx: number, cy: number, digitW: number, glow: number) => {
	ctx.save();
	ctx.fillStyle = RED;
	for (const [blur, alpha] of [[60, 0.55], [28, 0.8], [10, 1]] as const) {
		ctx.shadowColor = `rgba(255, 42, 42, ${alpha})`;
		ctx.shadowBlur = blur * glow;
		drawCentered(ctx, str, size, cx, cy, digitW);
	}
	ctx.shadowBlur = 0;
	ctx.fillStyle = RED;
	drawCentered(ctx, str, size, cx, cy, digitW);
	// hot centre of the tube
	ctx.fillStyle = HOT;
	ctx.globalAlpha = 0.28;
	drawCentered(ctx, str, size * 0.97, cx, cy, digitW);
	ctx.restore();
};

/** Text rendered to a low-res canvas then thresholded -> hard pixel blocks of size `block`. */
const pixelBitmap = (str: string, size: number, digitW: number, block: number): HTMLCanvasElement => {
	const w = Math.ceil(CW / block);
	const h = Math.ceil(CH / block);
	const small = document.createElement('canvas');
	small.width = w;
	small.height = h;
	const s = small.getContext('2d')!;
	s.scale(1 / block, 1 / block);
	s.fillStyle = RED;
	drawCentered(s, str, size, CW / 2, CY, digitW);
	const img = s.getImageData(0, 0, w, h);
	for (let i = 0; i < img.data.length; i += 4) {
		const on = img.data[i + 3] > 80;
		img.data[i] = 255;
		img.data[i + 1] = on ? 42 + ((i / 4) % 3) * 6 : 0; // tiny colour variation between blocks
		img.data[i + 2] = on ? 42 : 0;
		img.data[i + 3] = on ? 255 : 0;
	}
	s.setTransform(1, 0, 0, 1, 0, 0);
	s.putImageData(img, 0, 0);
	const big = document.createElement('canvas');
	big.width = CW;
	big.height = CH;
	const b = big.getContext('2d')!;
	b.imageSmoothingEnabled = false;
	b.drawImage(small, 0, 0, w * block, h * block);
	return big;
};

const eraseCracks = (ctx: CanvasRenderingContext2D, cracks: Pt[][], frac: number) => {
	ctx.save();
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.globalCompositeOperation = 'destination-out';
	ctx.lineWidth = 6;
	cracks.forEach((c) => strokePartial(ctx, c, frac));
	ctx.restore();
};

const glintCracks = (ctx: CanvasRenderingContext2D, cracks: Pt[][], frac: number) => {
	ctx.save();
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.strokeStyle = 'rgba(255, 190, 190, 0.9)';
	ctx.shadowColor = RED;
	ctx.shadowBlur = 10;
	ctx.lineWidth = 1.6;
	cracks.forEach((c) => strokePartial(ctx, c, frac));
	ctx.restore();
};

/**
 * Big red neon cost counter: counts $0 -> $200 quickly, the $200 turns into hard pixels, cracks spread through it,
 * then it crumbles away. Canvas-drawn; every random value is seeded so each render is identical.
 * Mounted at composition level (global frame). All times come from the timeline.
 */
export const CostBreak: React.FC<{timeline: ResolvedTimeline}> = ({timeline}) => {
	const frame = useCurrentFrame();
	const ready = useFontsReady();
	const ref = useRef<HTMLCanvasElement>(null);
	const {costStart, countEnd, pixelStart, crackStart, crumbleStart, end} = timeline.intro;
	const visible = frame >= costStart && frame <= end;
	const dpr = typeof window === 'undefined' ? 1 : Math.min(3, window.devicePixelRatio || 1);

	useLayoutEffect(() => {
		const canvas = ref.current;
		if (!canvas || !visible || !ready) return;
		const ctx = canvas.getContext('2d')!;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, CW, CH);

		// size the text so "$200" fits the safe width
		setFont(ctx, 320);
		const probe = ctx.measureText('$200').width;
		const size = Math.floor(320 * Math.min(1, 860 / probe));
		setFont(ctx, size);
		const digitW = Math.max(...'0123456789'.split('').map((d) => ctx.measureText(d).width));
		const textW = ctx.measureText('$').width + digitW * 3;
		const halfW = textW / 2;
		const halfH = size * 0.36;
		const cracks = makeCracks(halfW, halfH);

		const f = frame;
		if (f < pixelStart) {
			/* ---- A: count 0 -> 200, then a short hold ---- */
			const p = clamp01((f - costStart) / Math.max(1, countEnd - costStart));
			const value = Math.round(200 * Easing.inOut(Easing.cubic)(p));
			const flash = f >= countEnd ? Math.max(0, 1 - (f - countEnd) / 8) : 0;
			const pop = f - costStart < 6 ? lerp(0.82, 1, Easing.out(Easing.back(2))(clamp01((f - costStart) / 6))) : 1;
			const glow = 1 + 0.22 * Math.sin(f * 1.9) + 0.9 * flash;
			ctx.save();
			ctx.translate(CW / 2, CY);
			ctx.scale(pop, pop);
			ctx.translate(-CW / 2, -CY);
			neonText(ctx, `$${value}`, size, CW / 2, CY, digitW, glow);
			ctx.restore();
			return;
		}

		/* ---- B..D: the $200 as hard pixels ---- */
		const pp = clamp01((f - pixelStart) / PIXEL_FRAMES);
		const block = f < pixelStart + PIXEL_FRAMES ? Math.max(2, Math.round(lerp(2, BLOCK, Easing.out(Easing.cubic)(pp)))) : BLOCK;
		const bitmap = pixelBitmap('$200', size, digitW, block);

		if (f < crumbleStart) {
			const crackFrac = clamp01((f - crackStart) / CRACK_FRAMES);
			const jitter = f >= crackStart ? (random(`jit-${f}`) - 0.5) * 3 : 0;
			ctx.save();
			ctx.translate(jitter, (random(`jity-${f}`) - 0.5) * (f >= crackStart ? 3 : 0));
			ctx.imageSmoothingEnabled = false;
			for (const [blur, a] of [[44, 0.5], [18, 0.8]] as const) {
				ctx.shadowColor = `rgba(255, 42, 42, ${a})`;
				ctx.shadowBlur = blur;
				ctx.drawImage(bitmap, 0, 0, CW, CH);
			}
			ctx.shadowBlur = 0;
			ctx.drawImage(bitmap, 0, 0, CW, CH);
			if (f >= crackStart) {
				eraseCracks(ctx, cracks, crackFrac);
				// bright fracture lines, masked so they only appear ON the digits (never in the empty air around them)
				const layer = document.createElement('canvas');
				layer.width = CW;
				layer.height = CH;
				const lctx = layer.getContext('2d')!;
				glintCracks(lctx, cracks, crackFrac);
				lctx.globalCompositeOperation = 'destination-in';
				lctx.drawImage(bitmap, 0, 0);
				ctx.drawImage(layer, 0, 0, CW, CH);
			}
			ctx.restore();
			return;
		}

		/* ---- D: crumble. bake the cracked bitmap, then let each block fall ---- */
		const base = document.createElement('canvas');
		base.width = CW;
		base.height = CH;
		const bctx = base.getContext('2d')!;
		bctx.drawImage(bitmap, 0, 0);
		eraseCracks(bctx, cracks, 1);
		const data = bctx.getImageData(0, 0, CW, CH).data;

		const total = Math.max(1, end - crumbleStart);
		const e = f - crumbleStart;
		ctx.imageSmoothingEnabled = false;
		const cols = Math.ceil(CW / BLOCK);
		const rows = Math.ceil(CH / BLOCK);
		const y0 = Math.max(0, Math.floor((CY - size * 0.6) / BLOCK));
		const y1 = Math.min(rows, Math.ceil((CY + size * 0.6) / BLOCK));
		const dust: {x: number; y: number; delay: number; i: number}[] = [];

		for (let j = y0; j < y1; j++) {
			for (let i = 0; i < cols; i++) {
				const cx = i * BLOCK + BLOCK / 2;
				const cy = j * BLOCK + BLOCK / 2;
				if (data[((Math.floor(cy) * CW + Math.floor(cx)) * 4) + 3] < 40) continue; // empty or cracked away
				const id = `${i}-${j}`;
				const delay = (random(`d-${id}`) * 0.62 + ((j - y0) / Math.max(1, y1 - y0)) * 0.12) * total * 0.8;
				const t = Math.max(0, e - delay) / 30;
				let dx = 0;
				let dy = 0;
				let rot = 0;
				let alpha = 1;
				if (t > 0) {
					const vx = (random(`vx-${id}`) - 0.5) * 140;
					const vy = -40 - random(`vy-${id}`) * 90;
					dx = vx * t;
					dy = vy * t + 0.5 * 2600 * t * t;
					rot = (random(`rot-${id}`) - 0.5) * 7 * t;
					alpha = 1 - clamp01((t - 0.3) / 0.45);
					dust.push({x: cx, y: cy, delay, i: dust.length});
				} else if (e > delay - 4) {
					dx = (random(`tx-${id}-${f}`) - 0.5) * 3; // tremble just before letting go
					dy = (random(`ty-${id}-${f}`) - 0.5) * 3;
				}
				if (alpha <= 0.01) continue;
				ctx.save();
				ctx.globalAlpha = alpha;
				ctx.translate(cx + dx, cy + dy);
				ctx.rotate(rot);
				ctx.shadowColor = 'rgba(255,42,42,0.9)';
				ctx.shadowBlur = 14;
				ctx.drawImage(base, i * BLOCK, j * BLOCK, BLOCK, BLOCK, -BLOCK / 2, -BLOCK / 2, BLOCK, BLOCK);
				ctx.restore();
			}
		}

		// fine dust shaken loose by each falling block
		ctx.save();
		ctx.shadowColor = RED;
		ctx.shadowBlur = 6;
		dust.forEach((d, n) => {
			if (n % 2) return;
			const t = Math.max(0, e - d.delay) / 30;
			const s = 3 + random(`ds-${n}`) * 5;
			const px = d.x + (random(`dx-${n}`) - 0.5) * 120 * t * 2;
			const py = d.y + 0.5 * 1800 * t * t * (0.5 + random(`dg-${n}`)) - 30 * t;
			const a = 0.85 * (1 - clamp01(t / 0.55));
			if (a <= 0.02) return;
			ctx.globalAlpha = a;
			ctx.fillStyle = random(`dc-${n}`) > 0.6 ? HOT : RED;
			ctx.fillRect(px, py, s, s);
		});
		ctx.restore();
	});

	if (!visible) return null;
	return (
		<canvas
			ref={ref}
			width={Math.round(CW * dpr)}
			height={Math.round(CH * dpr)}
			style={{position: 'absolute', left: (1080 - CW) / 2, top: TOP, width: CW, height: CH}}
		/>
	);
};

