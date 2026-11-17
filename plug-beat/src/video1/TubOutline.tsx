import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {TUB_OUTLINE_PATH, TUB_SEAM_PATH, TUB_VIEWBOX} from './tubSilhouette';
import {TUB_TRACK} from './tubTrack';
import type {ResolvedTimeline} from './timeline';

type Props = {
	timeline: ResolvedTimeline;
	/** centre of the tub in the 1080x1920 frame */
	x: number;
	y: number;
	/** width of the outline in px (height follows the tub's proportions) */
	width: number;
	/** degrees, if the tub is tilted in the footage */
	rotate: number;
	/** follow the keyframes in tubTrack.ts when there are any (the static x/y/width/rotate above are the fallback) */
	useTrack?: boolean;
};

const DRAW_FRAMES = 12;
const ASPECT = TUB_VIEWBOX.w / TUB_VIEWBOX.h;
const clampSeam = (d: number) => Math.max(0, Math.min(1, (d - 0.55) / 0.45));
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ */
/* Track lookup                                                        */
/* ------------------------------------------------------------------ */
const trackAt = (frame: number, arr: number[]) =>
	TUB_TRACK.frames.length === 1 ? arr[0] : interpolate(frame, TUB_TRACK.frames, arr, CLAMP);

/** Tub centre/size at `frame` from the keyframes (box mode), or null when there is no track. */
export const tubAt = (frame: number): {x: number; y: number; width: number; rotate: number} | null => {
	const t = TUB_TRACK;
	const n = t.frames.length;
	if (n === 0) return null;
	// the silhouette keeps the tub's proportions; average the width and height cues so a loose box still fits
	const width = (trackAt(frame, t.w) + trackAt(frame, t.h) * ASPECT) / 2;
	return {
		x: trackAt(frame, t.x),
		y: trackAt(frame, t.y),
		width,
		rotate: t.rotate && t.rotate.length === n ? trackAt(frame, t.rotate) : 0,
	};
};

/** The tub's 4 tracked corners (TL, TR, BR, BL as x0,y0,...,x3,y3) at `frame`, or null (auto-tracked pose). */
export const quadAt = (frame: number): number[] | null => {
	const t = TUB_TRACK;
	if (!t.quad || t.quad.length !== 8 || t.frames.length === 0) return null;
	return t.quad.map((arr) => trackAt(frame, arr));
};

/**
 * CSS matrix3d that maps the silhouette's own coordinates (0..W, 0..H) onto the tracked quad
 * (projective mapping: handles position, size, rotation AND perspective).
 */
export const quadMatrix = (q: number[], W: number, H: number): string => {
	const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
	const dx1 = x1 - x2;
	const dx2 = x3 - x2;
	const dx3 = x0 - x1 + x2 - x3;
	const dy1 = y1 - y2;
	const dy2 = y3 - y2;
	const dy3 = y0 - y1 + y2 - y3;
	let g = 0;
	let h = 0;
	if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
		const den = dx1 * dy2 - dx2 * dy1;
		g = (dx3 * dy2 - dx2 * dy3) / den;
		h = (dx1 * dy3 - dx3 * dy1) / den;
	}
	const a = x1 - x0 + g * x1;
	const b = x3 - x0 + h * x3;
	const d = y1 - y0 + g * y1;
	const e = y3 - y0 + h * y3;
	// (X, Y) in [0,W]x[0,H]  ->  u = X/W, v = Y/H
	// CSS matrix3d is column-major: (m11, m21, 0, m31, m12, m22, 0, m32, 0, 0, 1, 0, m13, m23, 0, m33)
	return `matrix3d(${a / W}, ${d / W}, 0, ${g / W}, ${b / H}, ${e / H}, 0, ${h / H}, 0, 0, 1, 0, ${x0}, ${y0}, 0, 1)`;
};

/** Average side lengths of the quad -> px per silhouette unit (to keep the neon line a constant thickness). */
const quadScale = (q: number[], W: number): number => {
	const top = Math.hypot(q[2] - q[0], q[3] - q[1]);
	const bottom = Math.hypot(q[4] - q[6], q[5] - q[7]);
	return (top + bottom) / 2 / W;
};

/**
 * Golden neon outline around the tub: draws itself on at "this product", glows and pulses,
 * a bright spark runs around it, then fades out.
 *
 * LOCKED TO THE TUB: with an auto track (tubTrack.ts has `quad`) the silhouette is warped onto the tub's tracked
 * 4 corners on every frame (position + rotation + perspective). With a box track it follows centre/size;
 * with no track it falls back to the static Studio props (tubX/tubY/tubW/tubRotate).
 */
export const TubOutline: React.FC<Props> = ({timeline, x: sx, y: sy, width: sw, rotate: sr, useTrack = true}) => {
	const frame = useCurrentFrame();
	const {thisProduct, outlineFadeStart, outlineFadeEnd} = timeline.intro;
	if (frame < thisProduct || frame > outlineFadeEnd) return null;

	const quad = useTrack ? quadAt(frame) : null;
	const tracked = useTrack && !quad ? tubAt(frame) : null;
	const {x, y, width, rotate} = tracked ?? {x: sx, y: sy, width: sw, rotate: sr};

	const k = frame - thisProduct;
	const draw = interpolate(k, [0, DRAW_FRAMES], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const fade = interpolate(frame, [outlineFadeStart, outlineFadeEnd], [1, 0], CLAMP);
	const pulse = 0.5 + 0.5 * Math.sin((k / 18) * Math.PI * 2);
	const flash = Math.max(0, 1 - Math.max(0, k - DRAW_FRAMES) / 8); // bright burst when the loop closes
	const spark = ((k * 0.045) % 1 + 1) % 1;
	const glow = `drop-shadow(0 0 ${8 + 6 * pulse + 14 * flash}px rgba(255,196,0,0.95)) drop-shadow(0 0 ${22 + 16 * pulse + 20 * flash}px rgba(255,160,0,0.7))`;

	const W = TUB_VIEWBOX.w;
	const H = TUB_VIEWBOX.h;
	const unit = quad ? 1 / quadScale(quad, W) : W / width; // screen px -> silhouette units: same line thickness at any size

	const svgInner = (
		<>
			{/* soft under-glow */}
			<path d={TUB_OUTLINE_PATH} fill="none" stroke="rgba(255,170,0,0.55)" strokeWidth={14 * unit} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
			{/* core tube */}
			<path d={TUB_OUTLINE_PATH} fill="none" stroke="#FFC400" strokeWidth={5.5 * unit} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
			{/* hot centre */}
			<path d={TUB_OUTLINE_PATH} fill="none" stroke="#FFF1A8" strokeWidth={1.8 * unit} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
			{/* lid seam */}
			{draw > 0.55 ? (
				<>
					<path d={TUB_SEAM_PATH} fill="none" stroke="rgba(255,170,0,0.5)" strokeWidth={9 * unit} strokeLinecap="round" opacity={clampSeam(draw)} />
					<path d={TUB_SEAM_PATH} fill="none" stroke="#FFC400" strokeWidth={3.6 * unit} strokeLinecap="round" opacity={clampSeam(draw)} />
				</>
			) : null}
			{/* travelling spark */}
			{draw >= 1 ? (
				<path d={TUB_OUTLINE_PATH} fill="none" stroke="#FFFFFF" strokeWidth={4 * unit} strokeLinecap="round" pathLength={1} strokeDasharray="0.05 0.95" strokeDashoffset={-spark} opacity={0.9} />
			) : null}
		</>
	);

	if (quad) {
		// auto-tracked pose: warp the silhouette onto the tub's 4 corners
		return (
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: fade, filter: glow, pointerEvents: 'none'}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: quadMatrix(quad, W, H)}}>
					<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow: 'visible'}}>
						{svgInner}
					</svg>
				</div>
			</div>
		);
	}

	const height = width / ASPECT;
	return (
		<div
			style={{
				position: 'absolute',
				left: x - width / 2,
				top: y - height / 2,
				width,
				height,
				opacity: fade,
				transform: `rotate(${rotate}deg) scale(${1 + 0.012 * pulse})`,
				transformOrigin: '50% 50%',
				filter: glow,
			}}
		>
			<svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} style={{overflow: 'visible'}}>
				{svgInner}
			</svg>
		</div>
	);
};

/** Debug aid (Studio prop showTubGuide): draws the tracked tub (quad or box) + a centre dot on EVERY frame so you can scrub the whole video and check the track. */
export const TubGuide: React.FC<{x: number; y: number; width: number; rotate: number; useTrack: boolean}> = ({x: sx, y: sy, width: sw, rotate: sr, useTrack}) => {
	const frame = useCurrentFrame();
	const quad = useTrack ? quadAt(frame) : null;
	if (quad) {
		const pts = `${quad[0]},${quad[1]} ${quad[2]},${quad[3]} ${quad[4]},${quad[5]} ${quad[6]},${quad[7]}`;
		const cx = (quad[0] + quad[2] + quad[4] + quad[6]) / 4;
		const cy = (quad[1] + quad[3] + quad[5] + quad[7]) / 4;
		return (
			<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
				<polygon points={pts} fill="none" stroke="#39FF14" strokeWidth={3} strokeDasharray="10 8" />
				<circle cx={cx} cy={cy} r={14} fill="none" stroke="#39FF14" strokeWidth={3} />
				<text x={quad[0]} y={quad[1] - 12} fill="#39FF14" fontSize={22} fontFamily="sans-serif">
					tracked pose f{frame}
				</text>
			</svg>
		);
	}
	const tracked = useTrack ? tubAt(frame) : null;
	const {x, y, width, rotate} = tracked ?? {x: sx, y: sy, width: sw, rotate: sr};
	const height = width / ASPECT;
	return (
		<div style={{position: 'absolute', left: x - width / 2, top: y - height / 2, width, height, border: '3px dashed #39FF14', borderRadius: 24, transform: `rotate(${rotate}deg)`, boxSizing: 'border-box', pointerEvents: 'none'}}>
			<div style={{position: 'absolute', left: '50%', top: '50%', width: 30, height: 30, marginLeft: -15, marginTop: -15, borderRadius: 15, border: '3px solid #39FF14'}} />
			<div style={{position: 'absolute', left: 0, top: -34, fontFamily: 'sans-serif', fontSize: 22, color: '#39FF14'}}>
				{tracked ? `tracked f${frame}` : 'static (no track)'}
			</div>
		</div>
	);
};
