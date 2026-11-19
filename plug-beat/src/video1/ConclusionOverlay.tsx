import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {NeonText} from '../NeonText';
import {BODY_FONT} from '../theme';
import {CONCLUSION_BOARD, CONCLUSION_SPENT_AT} from '../clips/clipLayout';
import {LiquidGlass} from './LiquidGlass';
import {BUDGET, BOARD_TILES, FPS, type ResolvedTimeline} from './timeline';
import {CARD_H, CARD_W, GAP, HEADER_H, PAD, TILE_H, TILE_W, Tile} from './NineBoard';

const GOLD = '#FFC400';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * Plays inside a <Sequence> that starts where the conclusion video starts (frame 0 = its first frame).
 * 1) "TOTAL SPENT $198.12" card: counts up, shows how little of the $200 is left.
 * 2) from CONCLUSION_BOARD.from to .to: the finished board, all 9 ingredients uncovered with ✓, tiles pop in one by one.
 */
export const ConclusionOverlay: React.FC<{timeline: ResolvedTimeline}> = ({timeline}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const spent = timeline.pickups[timeline.pickups.length - 1]?.totalAfter ?? 0;
	const left = Math.round((BUDGET - spent) * 100) / 100;

	/* ---- spent card ---- */
	const s0 = Math.round(CONCLUSION_SPENT_AT * FPS);
	const enter = spring({frame: frame - s0, fps, config: {damping: 12, stiffness: 190, mass: 0.7}});
	const count = interpolate(frame - s0 - 4, [0, 40], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const shown = spent * count;
	const settled = frame - s0 - 44;
	const flash = settled >= 0 ? Math.max(0, 1 - settled / 16) : 0;

	/* ---- finished board ---- */
	const b0 = Math.round(CONCLUSION_BOARD.from * FPS);
	const b1 = Math.round(CONCLUSION_BOARD.to * FPS);
	const boardOn = frame >= b0 && frame <= b1;
	const bEnter = spring({frame: frame - b0, fps, config: {damping: 14, stiffness: 170, mass: 0.8}});
	const bExit = interpolate(frame, [b1 - 9, b1], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});

	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: 140,
					top: 372,
					width: 800,
					height: 170,
					opacity: interpolate(frame - s0, [0, 4], [0, 1], clamp),
					transform: `scale(${0.85 + 0.15 * enter + 0.04 * flash})`,
				}}
			>
				<LiquidGlass width={800} height={170} radius={34} pulse={0.3 + 0.7 * flash}>
					<div style={{position: 'absolute', left: 0, right: 0, top: 16, textAlign: 'center'}}>
						<NeonText font="body" size={24} glow={0.6} weight={800} letterSpacing="0.32em" palette="gold">
							TOTAL SPENT
						</NeonText>
					</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center'}}>
						<NeonText size={84} glow={1} palette="gold">
							${shown.toFixed(2)}
						</NeonText>
					</div>
					<div style={{position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', fontFamily: BODY_FONT, fontSize: 22, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, opacity: count}}>
						OF ${BUDGET} · ${left.toFixed(2)} LEFT
					</div>
				</LiquidGlass>
			</div>

			{boardOn ? (
				<div
					style={{
						position: 'absolute',
						left: (1080 - CARD_W) / 2,
						top: (1920 - CARD_H) / 2,
						width: CARD_W,
						height: CARD_H,
						opacity: interpolate(frame - b0, [0, 6], [0, 1], clamp) * (1 - bExit),
						transform: `scale(${(0.9 + 0.1 * bEnter) * (1 - 0.18 * bExit)}) translateY(${bExit * 22}px)`,
					}}
				>
					<LiquidGlass width={CARD_W} height={CARD_H} radius={36} pulse={0.5}>
						<div
							style={{
								position: 'absolute',
								left: PAD,
								right: PAD,
								top: PAD,
								height: HEADER_H,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 16,
								borderBottom: '1px solid rgba(255, 214, 10, 0.35)',
							}}
						>
							<NeonText size={26} glow={0.9} palette="gold">
								9 INGREDIENTS
							</NeonText>
							<span style={{fontFamily: BODY_FONT, fontSize: 26, color: GOLD, opacity: 0.8}}>·</span>
							<NeonText size={26} glow={0.9} palette="gold">
								${spent.toFixed(2)} SPENT
							</NeonText>
						</div>
						<div
							style={{
								position: 'absolute',
								left: PAD,
								top: PAD + HEADER_H + 14,
								display: 'grid',
								gridTemplateColumns: `repeat(3, ${TILE_W}px)`,
								gridTemplateRows: `repeat(3, ${TILE_H}px)`,
								gap: GAP,
							}}
						>
							{BOARD_TILES.map((tile, i) => (
								<Tile
									key={i}
									tile={tile}
									index={i}
									frame={frame}
									startFrame={b0 + 3 + i * 3}
									reveal={1}
									bump={0}
									found
									fallbackName={timeline.pickups[i]?.name ?? ''}
								/>
							))}
						</div>
					</LiquidGlass>
				</div>
			) : null}
		</>
	);
};
