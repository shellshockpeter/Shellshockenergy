import React from 'react';
import {useRemotionEnvironment} from 'remotion';

/** Fine static film grain (feTurbulence baked into a data URI, rasterised once). */
export const GLASS_NOISE =
	"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='220' height='220' filter='url(%23n)'/></svg>\")";

type Props = {
	width?: number | string;
	height?: number | string;
	radius?: number;
	/** 0..1 — gold glow pulse around the slab (0 = just the faint resting glow) */
	pulse?: number;
	/** 0..1 — how bright the slab's gold edge tint is (tiles use this for "full gold glow") */
	gold?: number;
	children?: React.ReactNode;
	style?: React.CSSProperties;
	contentStyle?: React.CSSProperties;
};

/**
 * Dark liquid-glass panel shared by the counter, board, tiles and chips.
 * The comp background is transparent, so backdrop-filter has nothing to blur — the glass is faked:
 * translucent dark gradient, inner highlights, bright specular top-left rim, sheen, grain, thin light border.
 */
const LiquidGlassInner: React.FC<Props & {noise: boolean}> = ({noise,
	width,
	height,
	radius = 36,
	pulse = 0,
	gold = 0,
	children,
	style,
	contentStyle,
}) => (
	<div
		style={{
			position: 'relative',
			width,
			height,
			borderRadius: radius,
			boxShadow: [
				`0 0 ${18 + 46 * pulse}px rgba(255, 196, 0, ${0.1 + 0.55 * pulse + 0.22 * gold})`,
				`0 0 ${6 + 10 * pulse}px rgba(255, 214, 10, ${0.06 + 0.4 * pulse + 0.18 * gold})`,
				'0 22px 50px -18px rgba(0, 0, 0, 0.7)',
			].join(', '),
			...style,
		}}
	>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				borderRadius: radius,
				overflow: 'hidden',
				background:
					'linear-gradient(152deg, rgba(62, 60, 54, 0.66) 0%, rgba(16, 15, 14, 0.82) 32%, rgba(3, 3, 4, 0.9) 100%)',
				boxShadow: [
					'inset 0 0 0 1px rgba(255, 255, 255, 0.28)',
					'inset 4px 4px 7px -2px rgba(255, 255, 255, 0.55)',
					'inset -3px -4px 10px -3px rgba(255, 255, 255, 0.16)',
					`inset 0 0 ${50 + 40 * pulse}px rgba(255, 196, 0, ${0.07 + 0.2 * pulse + 0.1 * gold})`,
				].join(', '),
			}}
		>
			{/* the browser (client-side) renderer can only load raster images, so the grain is skipped there (it is barely visible anyway) */}
			{noise ? <div style={{position: 'absolute', inset: 0, backgroundImage: GLASS_NOISE, opacity: 0.07}} /> : null}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'linear-gradient(118deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.10) 36%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0) 62%), radial-gradient(90% 55% at 6% 0%, rgba(255,255,255,0.24), rgba(255,255,255,0) 70%)',
				}}
			/>
		</div>
		{/* bright specular rim, strongest top-left */}
		<div
			style={{
				position: 'absolute',
				inset: 0,
				borderRadius: radius,
				padding: 2.5,
				background:
					'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,240,190,0.6) 14%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 66%, rgba(255,214,10,0.38) 100%)',
				WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
				WebkitMaskComposite: 'xor',
				mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
				pointerEvents: 'none',
			}}
		/>
		<div style={{position: 'relative', width: '100%', height: '100%', ...contentStyle}}>{children}</div>
	</div>
);

export const LiquidGlass: React.FC<Props> = (props) => {
	const env = useRemotionEnvironment();
	return <LiquidGlassInner {...props} noise={!env.isClientSideRendering} />;
};
