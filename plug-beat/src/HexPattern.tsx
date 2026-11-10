import React, {useId} from 'react';
import {COLORS} from './theme';

type Props = {
	/** Circumradius of each hexagon in px. */
	radius?: number;
	/** Overall opacity of the pattern (keep it faint). */
	opacity?: number;
	color?: string;
	strokeWidth?: number;
	/** Fade the pattern out toward the edges with a radial mask. */
	fade?: boolean;
	style?: React.CSSProperties;
};

const hexPath = (cx: number, cy: number, r: number) => {
	const pts = Array.from({length: 6}, (_, k) => {
		const a = (Math.PI / 180) * (60 * k + 30); // pointy-top
		return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
	});
	return `M${pts.join('L')}Z`;
};

/**
 * Faint tiled hexagon pattern (nod to the site's hex motif).
 * Fills its (positioned) parent: drop it in as an absolutely-positioned layer.
 */
export const HexPattern: React.FC<Props> = ({
	radius = 34,
	opacity = 0.09,
	color = COLORS.green,
	strokeWidth = 1.5,
	fade = true,
	style,
}) => {
	const id = useId().replace(/[^a-zA-Z0-9]/g, '');
	const w = Math.sqrt(3) * radius;
	const h = 3 * radius;

	// Hex centres needed to tile one w x h cell seamlessly.
	const centres: Array<[number, number]> = [
		[0, 0],
		[w, 0],
		[w / 2, 1.5 * radius],
		[0, h],
		[w, h],
	];

	return (
		<svg
			width="100%"
			height="100%"
			style={{
				position: 'absolute',
				inset: 0,
				opacity,
				pointerEvents: 'none',
				...(fade
					? {
							WebkitMaskImage:
								'radial-gradient(120% 120% at 30% 40%, #000 25%, transparent 85%)',
							maskImage:
								'radial-gradient(120% 120% at 30% 40%, #000 25%, transparent 85%)',
						}
					: {}),
				...style,
			}}
		>
			<defs>
				<pattern id={`hex-${id}`} width={w} height={h} patternUnits="userSpaceOnUse">
					{centres.map(([cx, cy], i) => (
						<path
							key={i}
							d={hexPath(cx, cy, radius)}
							fill="none"
							stroke={color}
							strokeWidth={strokeWidth}
						/>
					))}
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#hex-${id})`} />
		</svg>
	);
};
