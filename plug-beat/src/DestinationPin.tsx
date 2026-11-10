import React from 'react';
import {Easing, interpolate, spring, useVideoConfig} from 'remotion';
import {NeonText} from './NeonText';
import {BODY_FONT, DISPLAY_FONT} from './theme';
import {LOOP, MAP_COLORS, redA, gold, goldWarm, type Stop} from './mapConfig';

/* ------------------------------------------------------------------ */
/* Shared pin state logic                                              */
/* ------------------------------------------------------------------ */
export type PinState = 'pending' | 'target' | 'done';

/** After this many frames a slammed pin is exactly the static DONE pin (identical in every segment). */
export const SETTLE = 24;
/** Frames the intro "drop-in" lasts before the pin is a plain pending pin. */
export const ENTRANCE_DONE = 20;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type PinAnim = {
	done: boolean;
	slamming: boolean;
	/** frames since the slam (null when not slamming) */
	sf: number | null;
};

const resolve = (state: PinState, slamFrame: number | null): PinAnim => {
	if (state === 'done') return {done: true, slamming: false, sf: null};
	if (state === 'target' && slamFrame !== null && slamFrame >= SETTLE) {
		return {done: true, slamming: false, sf: null}; // settled => identical to a DONE pin
	}
	const slamming = state === 'target' && slamFrame !== null && slamFrame >= 0;
	return {done: false, slamming, sf: slamming ? slamFrame : null};
};

/** Soft 0..1 pulse with a LOOP-frame period. */
const pulseOf = (frame: number) => 0.5 - 0.5 * Math.cos(((frame % LOOP) / LOOP) * Math.PI * 2);

/* ------------------------------------------------------------------ */
/* Ground ring + shockwave (lives on the tilted map plane, SVG)        */
/* ------------------------------------------------------------------ */
type GroundProps = {
	x: number;
	y: number;
	state: PinState;
	frame: number;
	slamFrame: number | null;
	/** frames since the intro drop started (null = no entrance) */
	entranceFrame: number | null;
	/** 0..1 boost for the pulse of the next pin to slam */
	boost: number;
};

export const PinGround: React.FC<GroundProps> = ({x, y, state, frame, slamFrame, entranceFrame, boost}) => {
	const a = resolve(state, slamFrame);
	const out: React.ReactNode[] = [];

	if (a.done) {
		// steady, faint ring: no pulse, no animation
		out.push(
			<circle key="d0" cx={x} cy={y} r={26} fill={gold(0.12)} />,
			<circle key="d1" cx={x} cy={y} r={26} fill="none" stroke={gold(0.4)} strokeWidth={2} />,
		);
	} else {
		const p = (frame % LOOP) / LOOP;
		const amp = 0.3 + 0.35 * boost;
		out.push(
			<circle key="p0" cx={x} cy={y} r={22} fill={gold(0.07 + 0.05 * amp)} />,
			<circle
				key="p1"
				cx={x}
				cy={y}
				r={lerp(18, 58, p)}
				fill="none"
				stroke={gold(amp * (1 - p))}
				strokeWidth={lerp(3, 1, p)}
			/>,
		);
	}

	// intro landing ring (thud)
	if (entranceFrame !== null && entranceFrame >= 7 && entranceFrame < 7 + 16) {
		const t = (entranceFrame - 7) / 16;
		out.push(
			<circle
				key="land"
				cx={x}
				cy={y}
				r={lerp(12, 84, Easing.out(Easing.cubic)(t))}
				fill="none"
				stroke={gold(0.75 * (1 - t))}
				strokeWidth={lerp(5, 1, t)}
			/>,
		);
	}

	// slam shockwaves
	if (a.slamming && a.sf !== null) {
		const sf = a.sf;
		const ring = (delay: number, maxR: number, key: string, w0: number) => {
			const t = interpolate(sf, [delay, delay + 20], [0, 1], clamp);
			if (t <= 0 || t >= 1) return null;
			return (
				<circle
					key={key}
					cx={x}
					cy={y}
					r={lerp(16, maxR, Easing.out(Easing.cubic)(t))}
					fill="none"
					stroke={`rgba(255, 214, 90, ${0.95 * (1 - t)})`}
					strokeWidth={lerp(w0, 1, t)}
					style={{filter: `drop-shadow(0 0 8px ${goldWarm(0.9)})`}}
				/>
			);
		};
		out.push(ring(0, 210, 'w1', 9), ring(5, 140, 'w2', 5));
		const flash = interpolate(sf, [0, 8], [1, 0], clamp);
		if (flash > 0) out.push(<circle key="fl" cx={x} cy={y} r={46} fill={`rgba(255,226,120,${0.5 * flash})`} />);
	}

	return <g>{out}</g>;
};

/* ------------------------------------------------------------------ */
/* The pin itself (billboard in screen space)                          */
/* ------------------------------------------------------------------ */
export const PIN_W = 76;
export const PIN_H = 114;
/** hole centre is this far above the tip, in pin px */
const HOLE_Y = (64 / 96) * PIN_H;

type PinProps = {
	stop: Stop;
	state: PinState;
	frame: number;
	slamFrame: number | null;
	entranceFrame: number | null;
	/** screen position of the pin tip */
	tip: {x: number; y: number};
	/** camera zoom (pins grow with the push-in) */
	camScale: number;
	boost: number;
};

const BODY =
	'M32 95 C30 92 6 60 6 32 A26 26 0 1 1 58 32 C58 60 34 92 32 95 Z';

export const DestinationPin: React.FC<PinProps> = ({
	stop,
	state,
	frame,
	slamFrame,
	entranceFrame,
	tip,
	camScale,
	boost,
}) => {
	const {fps} = useVideoConfig();
	const a = resolve(state, slamFrame);
	const sf = a.sf;

	/* ---- state -> numbers (every branch ends on the exact DONE values) ---- */
	const fill = a.done ? 1 : a.slamming ? interpolate(sf!, [0, 3], [0, 1], clamp) : 0;
	const check = a.done ? 1 : a.slamming ? interpolate(sf!, [6, 16], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 0;
	const numOp = a.done ? 0 : a.slamming ? 1 - interpolate(sf!, [3, 9], [0, 1], clamp) : 1;
	const flare = a.slamming ? Math.max(0, 1 - sf! / 14) : 0;
	const hot = a.slamming ? Math.max(0, 1 - sf! / 8) : 0;
	const pulse = a.done || a.slamming ? 0 : pulseOf(frame);
	const amp = 0.3 + 0.35 * boost;

	let slamScale = 1;
	if (a.slamming) {
		const s = spring({
			frame: sf!,
			fps,
			config: {damping: 9, stiffness: 260, mass: 0.6},
			durationInFrames: 16,
		});
		slamScale = 1 + 0.8 * (1 - s);
	}

	/* ---- intro entrance (drop from above) ---- */
	let dropY = 0;
	let entranceOpacity = 1;
	if (entranceFrame !== null && entranceFrame < ENTRANCE_DONE) {
		if (entranceFrame < 0) entranceOpacity = 0;
		else {
			const s = spring({
				frame: entranceFrame,
				fps,
				config: {damping: 12, stiffness: 220, mass: 0.7},
				durationInFrames: 14,
			});
			dropY = -170 * (1 - s);
			entranceOpacity = interpolate(entranceFrame, [0, 4], [0, 1], clamp);
		}
	}

	/* ---- glow ---- */
	const glowA = lerp(0.35 + 0.35 * amp * pulse, 0.85, fill) + 0.1 * flare;
	const glowR1 = lerp(3 + 4 * amp * pulse, 3.5, fill) + 14 * flare;
	const glowR2 = lerp(10 + 10 * amp * pulse, 12, fill) + 30 * flare;
	const filter = [
		`drop-shadow(0 0 ${glowR1}px ${gold(Math.min(1, glowA))})`,
		`drop-shadow(0 0 ${glowR2}px ${goldWarm(lerp(0.28 + 0.3 * amp * pulse, 0.42, fill) + 0.4 * flare)})`,
	].join(' ');

	const strokeCol = hot > 0 ? `rgba(255, 246, 200, ${lerp(0.55, 1, fill)})` : gold(lerp(0.55, 1, fill));
	const bodyFill = fill > 0 ? `url(#pinGrad-${stop.id})` : gold(0.07);

	/* ---- label ---- */
	const showTag = a.done || (a.slamming && sf! >= 10);
	let tagScale = 1;
	let tagOpacity = 1;
	if (a.slamming && showTag) {
		const s = spring({
			frame: sf! - 10,
			fps,
			config: {damping: 9, stiffness: 300, mass: 0.55},
			durationInFrames: 12,
		});
		tagScale = 1 + 1.3 * (1 - s);
		tagOpacity = interpolate(sf!, [10, 12], [0, 1], clamp);
	}

	const side = stop.labelSide;
	const dx = stop.labelDx ?? 0;
	const dy = stop.labelDy ?? 0;
	const gapPx = 16;
	// the label is pushed outward while the slammed pin is oversized (exactly 0 once settled)
	const ex = slamScale - 1;
	const labelPos: React.CSSProperties =
		side === 'right'
			? {left: PIN_W / 2 + gapPx + dx + (PIN_W / 2) * ex, top: -HOLE_Y + dy, transform: 'translateY(-50%)', flexDirection: 'row'}
			: side === 'left'
				? {left: -(PIN_W / 2 + gapPx) + dx - (PIN_W / 2) * ex, top: -HOLE_Y + dy, transform: 'translate(-100%, -50%)', flexDirection: 'row-reverse'}
				: side === 'above'
					? {left: dx, top: -(PIN_H + gapPx) + dy - PIN_H * ex, transform: 'translate(-50%, -100%)', flexDirection: 'row'}
					: {left: dx, top: gapPx + dy, transform: 'translate(-50%, 0)', flexDirection: 'row'};

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width: 0,
				height: 0,
				transform: `translate(${tip.x}px, ${tip.y}px) scale(${camScale})`,
				transformOrigin: '0 0',
				opacity: entranceOpacity,
			}}
		>
			{/* pin body: anchored at the tip */}
			<div
				style={{
					position: 'absolute',
					left: -PIN_W / 2,
					top: -PIN_H + dropY,
					width: PIN_W,
					height: PIN_H,
					transform: `scale(${slamScale})`,
					transformOrigin: '50% 100%',
					filter,
				}}
			>
				<svg width={PIN_W} height={PIN_H} viewBox="0 0 64 96" style={{overflow: 'visible'}}>
					<defs>
						<linearGradient id={`pinGrad-${stop.id}`} x1="0" y1="0" x2="0.4" y2="1">
							<stop offset="0" stopColor="#FFE680" />
							<stop offset="0.45" stopColor={MAP_COLORS.gold} />
							<stop offset="1" stopColor="#FF9F00" />
						</linearGradient>
					</defs>
					<path d={BODY} fill={bodyFill} fillOpacity={fill > 0 ? lerp(0.07, 1, fill) : 1} stroke={strokeCol} strokeWidth={2.4} strokeLinejoin="round" />
					{/* centre hole */}
					<circle cx="32" cy="32" r="15" fill="rgba(8, 10, 16, 0.9)" stroke={gold(lerp(0.5, 0.95, fill))} strokeWidth={1.6} />
					<text
						x="32"
						y="32"
						textAnchor="middle"
						dominantBaseline="central"
						fontFamily={DISPLAY_FONT}
						fontSize="19"
						fill={gold(lerp(0.65, 1, hot))}
						opacity={numOp}
					>
						{stop.id}
					</text>
					<path
						d="M24 32.5 L30 38.5 L41 25.5"
						fill="none"
						stroke={MAP_COLORS.gold}
						strokeWidth={4.2}
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - check}
						opacity={check > 0 ? 1 : 0}
					/>
				</svg>
			</div>

			{/* label (+ DONE stamp) */}
			<div style={{position: 'absolute', display: 'flex', alignItems: 'center', gap: 14, ...labelPos}}>
				<NeonText size={34} glow={1}>
					{stop.label}
				</NeonText>
				{showTag ? (
					<div
						style={{
							transform: `rotate(-4deg) scale(${tagScale})`,
							opacity: tagOpacity,
							border: `2px solid ${MAP_COLORS.red}`,
							borderRadius: 7,
							padding: '5px 10px 4px',
							boxShadow: `0 0 10px ${redA(0.8)}, inset 0 0 8px ${redA(0.5)}`,
							fontFamily: BODY_FONT,
						}}
					>
						<NeonText size={22} glow={0.8} letterSpacing="0.05em">
							DONE
						</NeonText>
					</div>
				) : null}
			</div>
		</div>
	);
};
