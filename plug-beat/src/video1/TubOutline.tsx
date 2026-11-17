import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {TUB_OUTLINE_PATH, TUB_SEAM_PATH, TUB_VIEWBOX} from './tubOutline';
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
};

const DRAW_FRAMES = 12;
const clampSeam = (d: number) => Math.max(0, Math.min(1, (d - 0.55) / 0.45));

/**
 * Golden neon outline around the tub: draws itself on at "this product", glows and pulses,
 * a bright spark runs around it, then fades out. Position/size are Studio props (tubX/tubY/tubW/tubRotate).
 */
export const TubOutline: React.FC<Props> = ({timeline, x, y, width, rotate}) => {
	const frame = useCurrentFrame();
	const {thisProduct, outlineFadeStart, outlineFadeEnd} = timeline.intro;
	if (frame < thisProduct || frame > outlineFadeEnd) return null;

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
