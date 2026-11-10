import React from 'react';
import {HexPattern} from './HexPattern';
import {PANEL, green} from './theme';

type Props = {
	width?: number;
	height: number;
	/** 0..1 — strength of the outer neon glow. */
	glow?: number;
	/** Outer glow blur radius in px. */
	glowRadius?: number;
	/** 0..1 — opacity of the 1px green-tinted border. */
	borderAlpha?: number;
	hexOpacity?: number;
	children?: React.ReactNode;
	style?: React.CSSProperties;
};

/**
 * Rounded glass panel: translucent dark fill, 1px green-tinted border,
 * backdrop blur, soft outer glow and a faint hex pattern.
 * (Outer glow lives outside the box, so parents must not clip overflow.)
 */
export const GlassPanel: React.FC<Props> = ({
	width = PANEL.width,
	height,
	glow = 0.3,
	glowRadius = 36,
	borderAlpha = 0.45,
	hexOpacity = 0.09,
	children,
	style,
}) => (
	<div
		style={{
			position: 'relative',
			width,
			height,
			borderRadius: PANEL.radius,
			background:
				'linear-gradient(145deg, rgba(24, 28, 24, 0.78) 0%, rgba(10, 10, 10, 0.84) 100%)',
			border: `1px solid ${green(borderAlpha)}`,
			boxShadow: `0 0 ${glowRadius}px ${glowRadius / 6}px ${green(glow)}, inset 0 1px 0 rgba(255,255,255,0.07)`,
			backdropFilter: 'blur(24px)',
			WebkitBackdropFilter: 'blur(24px)',
			overflow: 'hidden',
			boxSizing: 'border-box',
			...style,
		}}
	>
		<HexPattern opacity={hexOpacity} />
		{children}
	</div>
);
