import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {NeonText} from '../NeonText';
import {BODY_FONT, DISPLAY_FONT} from '../theme';
import {useFitFontSize} from '../useFitFontSize';
import {LiquidGlass} from './LiquidGlass';
import {BOARD_REVEAL, BOARD_TILES, BUDGET, TIMELINE, type BoardTile, type ResolvedTimeline, type TileIcon} from './timeline';

const CARD_W = 900;
const PAD = 28;
const HEADER_H = 70;
const TILE_W = (CARD_W - PAD * 2 - 16 * 2) / 3; // 270
const TILE_H = 214;
const GAP = 16;
const CARD_H = PAD + HEADER_H + 14 + TILE_H * 3 + GAP * 2 + PAD; // 810

const GOLD = '#FFC400';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ */
/* Simple geometric icons                                              */
/* ------------------------------------------------------------------ */
const Icon: React.FC<{icon: TileIcon; size: number; opacity?: number}> = ({icon, size, opacity = 1}) => {
	const common = {fill: 'none', stroke: GOLD, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round'} as const;
	let body: React.ReactNode;
	switch (icon) {
		case 'hex':
			body = (
				<>
					<polygon points="32,5 55,18.5 55,45.5 32,59 9,45.5 9,18.5" {...common} />
					<circle cx="32" cy="32" r="9" {...common} />
					<path d="M32 5 V23 M55 45.5 L40 37 M9 45.5 L24 37" {...common} />
				</>
			);
			break;
		case 'drop':
			body = (
				<>
					<path d="M32 5 C32 5 11 29 11 42 A21 21 0 0 0 53 42 C53 29 32 5 32 5 Z" {...common} />
					<path d="M21 44 A11 11 0 0 0 33 55" {...common} />
				</>
			);
			break;
		case 'mushroom':
			body = (
				<>
					<path d="M6 35 A26 26 0 0 1 58 35 Z" {...common} />
					<path d="M24 35 V50 Q32 58 40 50 V35" {...common} />
					<circle cx="21" cy="27" r="2.6" fill={GOLD} />
					<circle cx="33" cy="19" r="2.6" fill={GOLD} />
					<circle cx="43" cy="28" r="2.6" fill={GOLD} />
				</>
			);
			break;
		case 'sun':
			body = (
				<>
					<circle cx="32" cy="32" r="11" {...common} />
					{Array.from({length: 12}, (_, i) => {
						const a = (i / 12) * Math.PI * 2;
						const r0 = 17;
						const r1 = i % 2 ? 25 : 30;
						return <line key={i} x1={32 + Math.cos(a) * r0} y1={32 + Math.sin(a) * r0} x2={32 + Math.cos(a) * r1} y2={32 + Math.sin(a) * r1} {...common} />;
					})}
				</>
			);
			break;
		case 'bolt':
			body = <path d="M37 4 L15 36 H30 L26 60 L49 26 H34 Z" {...common} />;
			break;
		case 'wave':
			body = (
				<>
					<path d="M4 32 Q14 8 24 32 T44 32 T60 32" {...common} />
					<path d="M4 46 Q14 28 24 46 T44 46 T60 46" {...common} opacity={0.55} />
				</>
			);
			break;
		case 'triangle':
			body = (
				<>
					<path d="M32 7 L57 53 H7 Z" {...common} />
					<circle cx="32" cy="38" r="6" {...common} />
				</>
			);
			break;
		case 'ring':
			body = (
				<>
					<circle cx="32" cy="32" r="24" {...common} />
					<circle cx="32" cy="32" r="9" {...common} />
				</>
			);
			break;
		case 'diamond':
		default:
			body = (
				<>
					<path d="M32 5 L58 32 L32 59 L6 32 Z" {...common} />
					<path d="M32 17 L46 32 L32 47 L18 32 Z" {...common} />
				</>
			);
	}
	return (
		<svg width={size} height={size} viewBox="0 0 64 64" style={{opacity, filter: 'drop-shadow(0 0 5px rgba(255,196,0,0.85))', overflow: 'visible'}}>
			{body}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* One tile                                                            */
/* ------------------------------------------------------------------ */
const Tile: React.FC<{
	tile: BoardTile;
	index: number;
	frame: number;
	startFrame: number;
	/** 0 = blurred "???", 1 = revealed (name + icon in full gold glow) */
	reveal: number;
	/** 0..1 swell while a tile is being found (settles back to normal size, stays revealed) */
	bump: number;
	/** ingredient has been found: show the gold ✓ mark */
	found: boolean;
	/** name to show when revealed if the tile config has none (pickup name) */
	fallbackName: string;
}> = ({tile, index, frame, startFrame, reveal, bump, found, fallbackName}) => {
	const {fps} = useVideoConfig();
	const r = tile.revealed && tile.name ? 1 : reveal;
	const name = tile.name ?? fallbackName;
	const p = spring({frame: frame - startFrame, fps, config: {damping: 8, stiffness: 220, mass: 0.55}});
	const scale = 0.6 + 0.4 * p; // overshoots past 1 then settles
	const opacity = interpolate(frame - startFrame, [0, 2.5], [0, 1], clamp);
	const nameSize = useFitFontSize({text: name, fontFamily: DISPLAY_FONT, maxWidth: TILE_W - 40, maxFontSize: 26, minFontSize: 14});
	const shimmerX = ((frame * 2.6) % 520) - 140;
	const pop = 1 + 0.1 * bump;

	return (
		<div style={{width: TILE_W, height: TILE_H, opacity, transform: `scale(${scale * pop})`, position: 'relative', zIndex: bump > 0 ? 2 : 0}}>
			<LiquidGlass width={TILE_W} height={TILE_H} radius={26} gold={0.12 + 0.88 * r} pulse={0.1 + 0.55 * r}>
				{/* number badge */}
				<div
					style={{
						position: 'absolute',
						left: 14,
						top: 14,
						width: 44,
						height: 44,
						borderRadius: 22,
						background: 'radial-gradient(circle at 30% 25%, #FFE766, #FFC400 60%, #E69A00)',
						boxShadow: '0 0 12px rgba(255,196,0,0.8)',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						fontFamily: DISPLAY_FONT,
						fontSize: 24,
						color: '#120D00',
						opacity: 0.55 + 0.45 * r,
						zIndex: 3,
					}}
				>
					{index + 1}
				</div>

				{/* gold ✓: this ingredient has been found */}
				{found ? (
					<svg width={40} height={40} viewBox="0 0 40 40" style={{position: 'absolute', right: 14, top: 14, zIndex: 3, opacity: r, filter: 'drop-shadow(0 0 6px rgba(255,196,0,0.9))'}}>
						<circle cx="20" cy="20" r="17" fill="rgba(255,196,0,0.18)" stroke="#FFC400" strokeWidth="2.5" />
						<path d="M11.5 20.5 L17.5 26.5 L29 13.5" fill="none" stroke="#FFD60A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				) : null}

				{/* blurred mystery layer (fades out as the tile reveals) */}
				{r < 1 ? (
					<div style={{position: 'absolute', inset: 0, opacity: 1 - r}}>
						<div style={{position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center', filter: 'blur(9px)', opacity: 0.7}}>
							<Icon icon={tile.icon} size={84} />
						</div>
						<div style={{position: 'absolute', left: 60, right: 60, bottom: 22, height: 22, borderRadius: 11, background: 'rgba(255,196,0,0.5)', filter: 'blur(8px)'}} />
						<div style={{position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center'}}>
							<NeonText size={52} glow={0.55} opacity={0.85} palette="gold">
								???
							</NeonText>
						</div>
						<div
							style={{
								position: 'absolute',
								top: -20,
								bottom: -20,
								width: 90,
								left: shimmerX,
								transform: 'skewX(-18deg)',
								background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,236,160,0.28), rgba(255,255,255,0))',
							}}
						/>
					</div>
				) : null}

				{/* revealed layer: un-blurs in, blurs back out */}
				{r > 0 ? (
					<div style={{position: 'absolute', inset: 0, opacity: r, filter: `blur(${(1 - r) * 9}px)`}}>
						<div style={{position: 'absolute', left: 0, right: 0, top: 36, display: 'flex', justifyContent: 'center'}}>
							<Icon icon={tile.icon} size={84} />
						</div>
						<div style={{position: 'absolute', left: 0, right: 0, bottom: tile.organic ? 40 : 28, textAlign: 'center'}}>
							<NeonText size={nameSize} glow={0.9} palette="gold">
								{name}
							</NeonText>
						</div>
						{tile.organic ? (
							<div style={{position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center'}}>
								<NeonText font="body" size={12} glow={0.3} weight={700} letterSpacing="0.3em" palette="gold">
									ORGANIC
								</NeonText>
							</div>
						) : null}
					</div>
				) : null}
			</LiquidGlass>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* The board                                                           */
/* ------------------------------------------------------------------ */
/** Frames at which each tile pops in the intro (float), for the tick sounds. */
export const tileStartFrames = (t: ResolvedTimeline) =>
	BOARD_TILES.map((_, i) => t.board.firstTilePop + i * t.board.tileStagger);

type Appearance = {
	kind: 'intro' | 'reveal';
	enterStart: number;
	exitStart: number;
	exitEnd: number;
	/** pickup index (= tile index) revealed during this appearance */
	pickupIndex?: number;
	revealAt?: number;
};

/**
 * Frame the board pop-up for pickup `i` starts at. Normally the pickup frame, but if a map slam is on screen
 * then, the pop-up waits until the slam ends so the two big panels never stack.
 */
export const revealStartFrame = (t: ResolvedTimeline, i: number): number => {
	const at = t.pickups[i].atFrame;
	const clash = t.mapSlams.find((m) => at < m.end && at + BOARD_REVEAL.exitEnd > m.start);
	return clash ? Math.max(at, clash.end) : at;
};

/** The intro board plus (optionally) one brief pop-up per found ingredient. */
export const boardAppearances = (t: ResolvedTimeline): Appearance[] => {
	const list: Appearance[] = [
		{kind: 'intro', enterStart: t.board.firstTilePop - 8, exitStart: t.board.exitStart, exitEnd: t.board.exitEnd},
	];
	if (TIMELINE.board.revealOnPickup) {
		t.pickups.forEach((p, i) =>
			list.push({
				kind: 'reveal',
				enterStart: revealStartFrame(t, i),
				exitStart: revealStartFrame(t, i) + BOARD_REVEAL.exitStart,
				exitEnd: revealStartFrame(t, i) + BOARD_REVEAL.exitEnd,
				pickupIndex: i,
				revealAt: revealStartFrame(t, i) + BOARD_REVEAL.revealAt,
			}),
		);
	}
	return list;
};

export const NineBoard: React.FC<{timeline: ResolvedTimeline}> = ({timeline}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {board} = timeline;
	const cur = boardAppearances(timeline).find((a) => frame >= a.enterStart && frame <= a.exitEnd);
	if (!cur) return null;
	const intro = cur.kind === 'intro';

	const enter = spring({
		frame: frame - cur.enterStart,
		fps,
		config: intro ? {damping: 14, stiffness: 150, mass: 0.8} : {damping: 13, stiffness: 230, mass: 0.65},
	});
	const exit = interpolate(frame, [cur.exitStart, cur.exitEnd], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});

	// final pulse + "9" badge: intro only
	const kp = intro ? frame - board.finalPulse : -1;
	const env = kp >= 0 && kp < 22 ? Math.sin((kp / 22) * Math.PI) : 0;
	const badge = spring({frame: kp, fps, config: {damping: 8, stiffness: 210, mass: 0.6}});
	const flash = kp >= 0 ? Math.max(0, 1 - kp / 18) : 0;

	// reveal pop-up: the found tile un-blurs and stays revealed; earlier finds are already uncovered
	const R = BOARD_REVEAL;
	const rf = !intro && cur.revealAt !== undefined ? frame - cur.revealAt : -1;
	const ramp = interpolate(rf, [0, R.revealRamp], [0, 1], clamp);
	const bumpEnv = rf >= 0 && rf < R.bumpFrames ? Math.sin((rf / R.bumpFrames) * Math.PI) : 0;
	const levelFor = (i: number) => (intro || cur.pickupIndex === undefined ? 0 : i < cur.pickupIndex ? 1 : i === cur.pickupIndex ? ramp : 0);

	const cardScale = (0.9 + 0.1 * enter) * (1 + 0.03 * env) * (1 - 0.18 * exit);
	const starts = tileStartFrames(timeline);

	return (
		<div
			style={{
				position: 'absolute',
				left: (1080 - CARD_W) / 2,
				top: (1920 - CARD_H) / 2,
				width: CARD_W,
				height: CARD_H,
				opacity: interpolate(frame - cur.enterStart, [0, intro ? 6 : 4], [0, 1], clamp) * (1 - exit),
				transform: `scale(${cardScale}) translateY(${exit * 22}px)`,
			}}
		>
			<LiquidGlass width={CARD_W} height={CARD_H} radius={36} pulse={0.18 + 0.82 * env}>
				{/* header strip: 9 INGREDIENTS · 3 STOPS · $200 */}
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
						3 STOPS
					</NeonText>
					<span style={{fontFamily: BODY_FONT, fontSize: 26, color: GOLD, opacity: 0.8}}>·</span>
					<NeonText size={26} glow={0.9} palette="gold">
						${BUDGET}
					</NeonText>
				</div>

				{/* 3x3 grid: tiles are blurred until found, then they stay uncovered */}
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
							startFrame={intro ? starts[i] : -1000}
							reveal={levelFor(i)}
							bump={cur.pickupIndex === i ? bumpEnv : 0}
							found={levelFor(i) > 0}
							fallbackName={timeline.pickups[i]?.name ?? '???'}
						/>
					))}
				</div>
			</LiquidGlass>

			{/* "9" badge flashes at the final pulse (intro only) */}
			{kp >= 0 ? (
				<div
					style={{
						position: 'absolute',
						right: 26,
						top: -44,
						width: 112,
						height: 112,
						borderRadius: 56,
						transform: `scale(${badge})`,
						background: 'radial-gradient(circle at 30% 25%, #FFF0A0, #FFD60A 38%, #FFB000 80%)',
						boxShadow: `0 0 ${24 + 40 * flash}px rgba(255, 196, 0, ${0.6 + 0.4 * flash}), inset 0 0 0 3px rgba(255,255,255,0.5)`,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						fontFamily: DISPLAY_FONT,
						fontSize: 76,
						color: '#120D00',
					}}
				>
					9
				</div>
			) : null}
		</div>
	);
};
