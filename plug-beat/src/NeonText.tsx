import React from 'react';
import {BODY_FONT, DISPLAY_FONT} from './theme';
import {MAP_COLORS} from './mapConfig';

/** Layered golden-yellow neon text-shadow. glow = 1 is the standard strength. */
export const neonShadow = (glow = 1): string =>
	[
		`0 0 ${1.5 * glow}px rgba(255, 246, 205, 0.95)`, // hot core
		`0 0 ${5 * glow}px ${MAP_COLORS.text}`,
		`0 0 ${12 * glow}px ${MAP_COLORS.text}`,
		`0 0 ${26 * glow}px rgba(255, 170, 0, 0.75)`,
		`0 0 ${46 * glow}px rgba(255, 140, 0, 0.42)`,
	].join(', ');

type Props = {
	children: React.ReactNode;
	/** 'display' = Robot Reavers (titles, stop labels); 'body' = Inter (neighbour towns). */
	font?: 'display' | 'body';
	size: number;
	glow?: number;
	weight?: number;
	letterSpacing?: string;
	opacity?: number;
	style?: React.CSSProperties;
};

export const NeonText: React.FC<Props> = ({
	children,
	font = 'display',
	size,
	glow = 1,
	weight = 600,
	letterSpacing,
	opacity = 1,
	style,
}) => (
	<span
		style={{
			fontFamily: font === 'display' ? DISPLAY_FONT : BODY_FONT,
			fontWeight: font === 'display' ? 400 : weight,
			fontSize: size,
			lineHeight: 1,
			letterSpacing,
			color: MAP_COLORS.text,
			textShadow: neonShadow(glow),
			opacity,
			whiteSpace: 'nowrap',
			...style,
		}}
	>
		{children}
	</span>
);
