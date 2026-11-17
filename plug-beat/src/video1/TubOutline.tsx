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

const ASPECT = TUB_VIEWBOX.w / TUB_VIEWBOX.h;

/** Tub position/size at `frame`: interpolated from the keyframes, or null when there is no track. */
export const tubAt = (frame: number): {x: number; y: number; width: number; rotate: number} | null => {
	const t = TUB_TRACK;
	const n = t.frames.length;
	if (n === 0) return null;
	const at = (arr: number[]) =>
		n === 1 ? arr[0] : interpolate(frame, t.frames, arr, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	// the silhouette keeps the tub's proportions; average the width and height cues so a loose box still fits
	const width = (at(t.w) + at(t.h) * ASPECT) / 2;
	return {x: at(t.x), y: at(t.y), width, rotate: t.rotate && t.rotate.length === n ? at(t.rotate) : 0};
};

const DRAW_FRAMES = 12;
const clampSeam = (d: number) => Math.max(0, Math.min(1, (d - 0.55) / 0.45));

/**
 * Golden neon outline around the tub: draws itself on at "this product", glows and pulses,
 * a bright spark runs around it, then fades out. It FOLLOWS the keyframe track in tubTrack.ts every frame;
 * with no track it falls back to the static Studio props (tubX/tubY/tubW/tubRotate).
 */
export const TubOutline: React.FC<Props> = ({timeline, x: sx, y: sy, width: sw, rotate: sr, useTrack = true}) => {
	const frame = useCurrentFrame();
	const {thisProduct, outlineFadeStart, outlineFadeEnd} = timeline.intro;
	if (frame < thisProduct || frame > outlineFadeEnd) return null;

	// follow the tracked keyframes (every frame), else the static Studio props
	const tracked = useTrack ? tubAt(frame) : null;
	const {x, y, width, rotate} = tracked ?? {x: sx, y: sy, width: sw, rotate: sr};

	const k = frame - thisProduct;
	const draw = interpolate(k, [0, DRAW_FRAMES], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const fade = interpolate(frame, [outlineFadeStart, outlineFadeEnd], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const pulse = 0.5 + 0.5 * Math.sin((k / 18) * Math.PI * 2);
	const flash = Math.max(0, 1 - Math.max(0, k - DRAW_FRAMES) / 8); // bright burst when the loop closes
	const height = (width * TUB_VIEWBOX.h) / TUB_VIEWBOX.w;
	const unit = TUB_VIEWBOX.w / width; // px -> viewBox units, so the line is the same thickness at any size
	const spark = ((k * 0.045) % 1 + 1) % 1;

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
				filter: `drop-shadow(0 0 ${8 + 6 * pulse + 14 * flash}px rgba(255,196,0,0.95)) drop-shadow(0 0 ${22 + 16 * pulse + 20 * flash}px rgba(255,160,0,0.7))`,
			}}
		>
			<svg width={width} height={height} viewBox={`0 0 ${TUB_VIEWBOX.w} ${TUB_VIEWBOX.h}`} style={{overflow: 'visible'}}>
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
					<path
						d={TUB_OUTLINE_PATH}
						fill="none"
						stroke="#FFFFFF"
						strokeWidth={4 * unit}
						strokeLinecap="round"
						pathLength={1}
						strokeDasharray="0.05 0.95"
						strokeDashoffset={-spark}
						opacity={0.9}
					/>
				) : null}
			</svg>
		</div>
	);
};

/** Debug aid (Studio prop showTubGuide): draws the tracked tub box + centre cross on EVERY frame so you can scrub the whole video and check the track. */
export const TubGuide: React.FC<{x: number; y: number; width: number; rotate: number; useTrack: boolean}> = ({x: sx, y: sy, width: sw, rotate: sr, useTrack}) => {
	const frame = useCurrentFrame();
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
