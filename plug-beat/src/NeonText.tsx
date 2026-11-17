import React, {createContext, useContext} from 'react';
import {BODY_FONT, DISPLAY_FONT} from './theme';

export type NeonPaletteName = 'gold' | 'red';

type Palette = {
	core: string;
	/** hot white-ish centre of the tube */
	hot: string;
	mid: string;
	far: string;
	/** "r, g, b" for building rgba() strings */
	rgb: string;
};

export const NEON_PALETTES: Record<NeonPaletteName, Palette> = {
	gold: {
		core: '#FFC400',
		hot: 'rgba(255, 246, 205, 0.95)',
		mid: 'rgba(255, 170, 0, 0.75)',
		far: 'rgba(255, 140, 0, 0.42)',
		rgb: '255, 196, 0',
	},
	red: {
		core: '#FF2A2A',
		hot: 'rgba(255, 226, 226, 0.95)',
		mid: 'rgba(255, 42, 42, 0.75)',
		far: 'rgba(255, 42, 42, 0.42)',
		rgb: '255, 42, 42',
	},
};

const PaletteContext = createContext<NeonPaletteName>('gold');

/** Wrap the map scenes in this to switch ALL map text (labels, titles, DONE stamps) between gold and red. */
export const NeonPaletteProvider: React.FC<{palette: NeonPaletteName; children: React.ReactNode}> = ({
	palette,
	children,
}) => <PaletteContext.Provider value={palette}>{children}</PaletteContext.Provider>;

export const useNeonPalette = (override?: NeonPaletteName): Palette => {
	const fromContext = useContext(PaletteContext);
	return NEON_PALETTES[override ?? fromContext];
};

/** Layered neon text-shadow. glow = 1 is the standard strength. */
export const neonShadow = (glow = 1, palette: NeonPaletteName = 'gold'): string => {
	const p = NEON_PALETTES[palette];
	return [
		`0 0 ${1.5 * glow}px ${p.hot}`, // hot core
		`0 0 ${5 * glow}px ${p.core}`,
		`0 0 ${12 * glow}px ${p.core}`,
		`0 0 ${26 * glow}px ${p.mid}`,
		`0 0 ${46 * glow}px ${p.far}`,
	].join(', ');
};

type Props = {
	children: React.ReactNode;
	/** 'display' = Robot Reavers (titles, stop labels); 'body' = Inter (neighbour towns). */
	font?: 'display' | 'body';
	size: number;
	glow?: number;
	weight?: number;
	letterSpacing?: string;
	opacity?: number;
	/** force a palette; default = whatever NeonPaletteProvider says (gold) */
	palette?: NeonPaletteName;
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
	palette,
	style,
}) => {
	const fromContext = useContext(PaletteContext);
	const name = palette ?? fromContext;
	return (
		<span
			style={{
				fontFamily: font === 'display' ? DISPLAY_FONT : BODY_FONT,
				fontWeight: font === 'display' ? 400 : weight,
				fontSize: size,
				lineHeight: 1,
				letterSpacing,
				color: NEON_PALETTES[name].core,
				textShadow: neonShadow(glow, name),
				opacity,
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{children}
		</span>
	);
};
