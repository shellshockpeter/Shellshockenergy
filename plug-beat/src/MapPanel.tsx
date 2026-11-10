import React from 'react';
import {NeonText} from './NeonText';
import {TOWN_PATHS} from './geo/townPaths';
import {panelTransform} from './camera';
import {
	MAP_COLORS,
	MAP_ORIGIN,
	PANEL,
	TOWN_LABELS,
	labelLines,
	type Camera,
} from './mapConfig';

type Props = {
	camera: Camera;
	/** 0..1 fade for the whole slab (used by the intro) */
	opacity?: number;
	/** Plane-level SVG content (route, ground rings). Drawn in panel px, tilted with the map. */
	children?: React.ReactNode;
};

const FOCUS = new Set(['Avon', 'West Hartford']);

/** Fine static film-grain (feTurbulence baked into a data URI, rasterised once). */
const NOISE =
	"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='220' height='220' filter='url(%23n)'/></svg>\")";

/**
 * Futuristic liquid-glass slab with traced town outlines.
 * The comp background is transparent, so backdrop-filter has nothing to blur —
 * the glass is faked with layered gradients, specular edge light, inner glow and grain.
 */
export const MapPanel: React.FC<Props> = ({camera, opacity = 1, children}) => {
	return (
		<div
			style={{
				position: 'absolute',
				left: PANEL.cx - PANEL.w / 2,
				top: PANEL.cy - PANEL.h / 2,
				width: PANEL.w,
				height: PANEL.h,
				transform: panelTransform(camera),
				transformOrigin: '50% 50%',
				opacity,
			}}
		>
			{/* the slab */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: PANEL.radius,
					overflow: 'hidden',
					background:
						'linear-gradient(152deg, rgba(58, 58, 64, 0.62) 0%, rgba(14, 14, 17, 0.80) 30%, rgba(2, 2, 4, 0.90) 100%)',
					boxShadow: [
						`inset 0 0 0 1px ${MAP_COLORS.glassEdge}`,
						'inset 4px 4px 6px -2px rgba(255, 255, 255, 0.60)',
						'inset -3px -4px 10px -3px rgba(255, 255, 255, 0.20)',
						'inset 0 0 90px rgba(255, 255, 255, 0.07)',
						'0 0 50px rgba(0, 0, 0, 0.55)',
					].join(', '),
				}}
			>
				{/* 1 km graticule */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backgroundImage:
							'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
						backgroundSize: '62px 62px',
						backgroundPosition: `${MAP_ORIGIN.x % 62}px ${MAP_ORIGIN.y % 62}px`,
					}}
				/>
				{/* grain */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backgroundImage: NOISE,
						opacity: 0.07,
					}}
				/>

				{/* town outlines */}
				<svg
					width={PANEL.w}
					height={PANEL.h}
					viewBox={`0 0 ${PANEL.w} ${PANEL.h}`}
					style={{position: 'absolute', inset: 0}}
				>
					<defs>
						<linearGradient id="focusFill" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0" stopColor="rgba(255,255,255,0.20)" />
							<stop offset="1" stopColor="rgba(255,255,255,0.06)" />
						</linearGradient>
					</defs>
					<g transform={`translate(${MAP_ORIGIN.x} ${MAP_ORIGIN.y})`} strokeLinejoin="round">
						{Object.entries(TOWN_PATHS)
							.filter(([name]) => !FOCUS.has(name))
							.map(([name, t]) => (
								<path
									key={name}
									d={t.d}
									fill="rgba(255,255,255,0.02)"
									stroke={MAP_COLORS.line}
									strokeWidth={1.6}
								/>
							))}
						{Object.entries(TOWN_PATHS)
							.filter(([name]) => FOCUS.has(name))
							.map(([name, t]) => (
								<path
									key={name}
									d={t.d}
									fill="url(#focusFill)"
									stroke={MAP_COLORS.lineFocus}
									strokeWidth={2.4}
									style={{filter: 'drop-shadow(0 0 6px rgba(255, 236, 190, 0.6))'}}
								/>
							))}
					</g>
					{/* plane-level overlays: route + ground rings */}
					{children}
				</svg>

				{/* neighbour + focus town labels (they live on the tilted map plane) */}
				{TOWN_LABELS.map((l) => {
					const focus = l.focus || FOCUS.has(l.town);
					const [x, y] = l.at ?? [
						MAP_ORIGIN.x + TOWN_PATHS[l.town].label[0],
						MAP_ORIGIN.y + TOWN_PATHS[l.town].label[1],
					];
					return (
						<div
							key={l.town}
							style={{
								position: 'absolute',
								left: x,
								top: y,
								transform: 'translate(-50%, -50%)',
							}}
						>
							{(l.oneLine ? [l.town.toUpperCase()] : labelLines(l.town)).map((line) => (
								<div key={line} style={{textAlign: 'center', marginTop: 2}}>
									<NeonText
										font="body"
										size={l.size ?? (focus ? 44 : 23)}
										glow={focus ? 1.3 : 0.7}
										weight={700}
										letterSpacing={focus ? '0.14em' : '0.12em'}
										opacity={1}
									>
										{line}
									</NeonText>
								</div>
							))}
						</div>
					);
				})}

				{/* soft diagonal sheen */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(118deg, rgba(255,255,255,0) 22%, rgba(255,255,255,0.11) 38%, rgba(255,255,255,0.02) 52%, rgba(255,255,255,0) 64%), radial-gradient(90% 38% at 8% 0%, rgba(255,255,255,0.26), rgba(255,255,255,0) 70%)',
						pointerEvents: 'none',
					}}
				/>
			</div>

			{/* bright specular rim, strongest top-left */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: PANEL.radius,
					padding: 2.5,
					background:
						'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.55) 14%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 66%, rgba(255,255,255,0.32) 100%)',
					WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
					WebkitMaskComposite: 'xor',
					mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
					pointerEvents: 'none',
				}}
			/>
		</div>
	);
};
