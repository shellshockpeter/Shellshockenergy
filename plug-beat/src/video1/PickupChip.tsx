import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {NeonText} from '../NeonText';
import {LiquidGlass} from './LiquidGlass';
import {CHIP, type ResolvedTimeline} from './timeline';

type Props = {
	pickup: ResolvedTimeline['pickups'][number];
	/** where the chip flies to (centre of the counter amount) */
	target: {x: number; y: number};
};

/**
 * "+$13.79 L-TYROSINE" chip. Pops near the product at the pickup frame, then flies up to the
 * counter and lands at pickup + 0.5 s (the moment the counter starts rolling). Global frame.
 */
export const PickupChip: React.FC<Props> = ({pickup, target}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const k = frame - pickup.atFrame;
	if (k < 0 || k >= CHIP.landFrames) return null;

	const origin = pickup.chipAt ?? CHIP.defaultAt;
	const pop = spring({frame: k, fps, config: {damping: 10, stiffness: 260, mass: 0.5}, durationInFrames: CHIP.popFrames});
	const t = interpolate(k, [CHIP.popFrames, CHIP.popFrames + CHIP.flightFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.cubic),
	});
	const x = origin.x + (target.x - origin.x) * t + Math.sin(Math.PI * t) * 70;
	const y = origin.y + (target.y - origin.y) * t;
	const scale = (0.6 + 0.4 * pop) * (1 - 0.42 * t);
	const opacity = interpolate(k, [0, 3, CHIP.landFrames - 3, CHIP.landFrames], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: 'max-content',
				opacity,
				transform: `translate(-50%, -50%) scale(${scale})`,
			}}
		>
			<LiquidGlass radius={50} pulse={0.45 + 0.4 * t} contentStyle={{display: 'flex', alignItems: 'center', gap: 22, padding: '20px 36px'}}>
				<NeonText size={30} glow={0.9} palette="gold">
					{pickup.name}
				</NeonText>
				<NeonText size={38} glow={1.1} palette="gold" style={{color: '#FFD60A'}}>
					+${pickup.price.toFixed(2)}
				</NeonText>
			</LiquidGlass>
		</div>
	);
};
