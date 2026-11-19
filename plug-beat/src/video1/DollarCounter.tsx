import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {NeonText} from '../NeonText';
import {DISPLAY_FONT} from '../theme';
import {LiquidGlass} from './LiquidGlass';
import {BUDGET, ROLL_FRAMES, type ResolvedTimeline} from './timeline';

export const HUD_W = 760;
export const HUD_H = 178;
const HUD_TOP = 275; // below the Instagram top UI (friends row / search); keep it high enough to stay clear of the face
const HUD_BOTTOM_TOP = 1920 - 250 - HUD_H - 2; // bottom edge stays above the 250px safe zone

/** Screen position the pickup chips fly to (centre of the big amount). */
export const hudTarget = (position: 'top' | 'bottom') => ({
	x: 540,
	y: (position === 'top' ? HUD_TOP : HUD_BOTTOM_TOP) + 60,
});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** The slice of a timeline the counter + chips read (Video1 passes its full timeline; the Clip compositions build their own). */
export type HudTimeline = Pick<ResolvedTimeline, 'hud' | 'pickups' | 'totalPulse' | 'mapSlams'>;

/** Top edge (px) of the counter at `frame`: it glides to the bottom while a map slam is on screen (if enabled). */
export const hudTopAt = (position: 'top' | 'bottom', timeline: HudTimeline, frame: number): number => {
	if (position === 'bottom') return HUD_BOTTOM_TOP;
	let avoid = 0;
	if (timeline.hud.avoidMapSlams) {
		for (const m of timeline.mapSlams) {
			avoid = Math.max(avoid, interpolate(frame, [m.start - 8, m.start, m.end, m.end + 8], [0, 1, 1, 0], clamp));
		}
	}
	return HUD_TOP + (HUD_BOTTOM_TOP - HUD_TOP) * Easing.inOut(Easing.cubic)(avoid);
};

/** Where pickup chips land: the centre of the big amount, wherever the counter is right now. */
export const hudTargetAt = (position: 'top' | 'bottom', timeline: HudTimeline, frame: number) => ({
	x: 540,
	y: hudTopAt(position, timeline, frame) + 60,
});

/* ---- gold digit styling (gradient per glyph; glow is applied on the container so overflow can't clip it) ---- */
const GOLD_TEXT: React.CSSProperties = {
	background: 'linear-gradient(180deg, #FFE766 0%, #FFD60A 34%, #FFC400 68%, #FFAE00 100%)',
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text',
	color: 'transparent',
	WebkitTextFillColor: 'transparent',
};

const FONT = 84;
const CELL_H = 92;
const DIGIT_W = 56;
const DOT_W = 26;
const SIGN_W = 52;

const DIGITS_30 = Array.from({length: 30}, (_, i) => i % 10);

const Digit: React.FC<{d0: number; d1: number; ease: number; opacity: number}> = ({d0, d1, ease, opacity}) => {
	// always roll upward through the digits; 3 stacked 0-9 strips so there is room both ways
	const delta = (d1 - d0 + 10) % 10;
	const idx = 10 + d0 + delta * ease;
	return (
		<div style={{width: DIGIT_W, height: CELL_H, overflow: 'hidden', opacity}}>
			<div style={{transform: `translateY(${-idx * CELL_H}px)`}}>
				{DIGITS_30.map((d, i) => (
					<div
						key={i}
						style={{
							height: CELL_H,
							lineHeight: `${CELL_H}px`,
							textAlign: 'center',
							fontFamily: DISPLAY_FONT,
							fontSize: FONT,
							...GOLD_TEXT,
						}}
					>
						{d}
					</div>
				))}
			</div>
		</div>
	);
};

const split = (val: number) => {
	const cents = Math.round(val * 100);
	return {int: String(Math.floor(cents / 100)), dec: String(cents % 100).padStart(2, '0')};
};

/**
 * Persistent dollar-counter HUD (dark liquid glass, neon gold).
 * Mounted at composition level, so useCurrentFrame() is the GLOBAL frame; every event comes from the timeline.
 */
export const DollarCounter: React.FC<{
	timeline: HudTimeline;
	position: 'top' | 'bottom';
	/** total shown before the first roll lands (the Clip compositions start mid-video) */
	baseTotal?: number;
	/** items already found before the first pickup, so n/9 starts at 5/9 etc. */
	foundOffset?: number;
	/** cash available (bar + "LEFT") */
	budget?: number;
	totalItems?: number;
	/** last ingredient: 9/9 gold burst + glow pulse, and the OVER badge if the total passes the budget */
	finale?: boolean;
}> = ({timeline, position, baseTotal = 0, foundOffset = 0, budget = BUDGET, totalItems = 9, finale = false}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {hud, pickups, totalPulse} = timeline;
	if (frame < hud.enter) return null;

	/* ---- which roll is active ---- */
	let active: (typeof pickups)[number] | null = null;
	for (const p of pickups) if (p.landFrame <= frame) active = p;
	const from = active ? active.totalBefore : baseTotal;
	const to = active ? active.totalAfter : baseTotal;
	const k = active ? frame - active.landFrame : Infinity;
	const p01 = interpolate(k, [0, ROLL_FRAMES], [0, 1], clamp);
	const ease = Easing.out(Easing.cubic)(p01);
	const animVal = from + (to - from) * ease;
	const found = foundOffset + pickups.filter((p) => p.landFrame <= frame).length;

	/* ---- per-jump shake + glow, total pulse ---- */
	const shakeDecay = k >= 0 && k < 6 ? 1 - k / 6 : 0;
	const shakeX = Math.sin(k * 3.1 + 0.5) * 3.2 * shakeDecay;
	const shakeY = Math.cos(k * 4.3) * 2.2 * shakeDecay;
	const rollPulse = k >= 0 && k < 16 ? 1 - k / 16 : 0;
	const kt = frame - totalPulse;
	const totalEnv = kt >= 0 && kt < 22 ? Math.sin((kt / 22) * Math.PI) : 0;
	// finale: the last ingredient lands -> 9/9 burst + a bigger glow pulse
	const last = pickups[pickups.length - 1];
	const kf = finale && last ? frame - last.landFrame : -1;
	const finalEnv = kf >= 0 && kf < 30 ? Math.sin((kf / 30) * Math.PI) : 0;
	const pulse = Math.max(rollPulse * 0.75, totalEnv, finalEnv);
	const countFlash = Math.max(k >= 0 && k < 9 ? 1 - k / 9 : 0, kf >= 0 && kf < 14 ? 1 - kf / 14 : 0);
	const overBudget = finale && !!last && last.totalAfter > budget;

	/* ---- enter ---- */
	const enter = spring({frame: frame - hud.enter, fps, config: {damping: 13, stiffness: 140, mass: 0.8}});
	const enterOpacity = interpolate(frame - hud.enter, [0, 5], [0, 1], clamp);
	const dir = position === 'top' ? -1 : 1;

	/* ---- cash-drain emphasis ---- */
	const em = interpolate(frame, [hud.drainStart, hud.drainStart + 4, hud.drainEnd - 4, hud.drainEnd], [0, 1, 1, 0], clamp);
	const sweepPhase = (((frame - hud.drainStart) / Math.max(1, hud.drainEnd - hud.drainStart)) * 2) % 1;
	const leftRaw = budget - animVal;
	const left = Math.max(0, leftRaw);
	const frac = Math.min(1, left / budget);
	const short = leftRaw < -0.004; // over budget: the bar is empty and the label reads SHORT $x.xx
	const BAR_W = HUD_W - 72;
	const barH = 12 + 6 * em;

	/* ---- digits ---- */
	const a = split(from);
	const b = split(to);
	const nInt = Math.max(a.int.length, b.int.length, 1);
	const aInt = a.int.padStart(nInt, ' ');
	const bInt = b.int.padStart(nInt, ' ');
	const slot = (ch0: string, ch1: string) => ({
		d0: ch0 === ' ' ? 0 : Number(ch0),
		d1: ch1 === ' ' ? 0 : Number(ch1),
		opacity: interpolate(ease, [0, 1], [ch0 === ' ' ? 0 : 1, ch1 === ' ' ? 0 : 1]),
	});

	const top = hudTopAt(position, timeline, frame);

	return (
		<div
			style={{
				position: 'absolute',
				left: (1080 - HUD_W) / 2,
				top,
				width: HUD_W,
				height: HUD_H,
				opacity: enterOpacity,
				transform: `translate(${shakeX}px, ${shakeY + (1 - enter) * 60 * dir}px) scale(${0.92 + 0.08 * enter})`,
			}}
		>
			<LiquidGlass width={HUD_W} height={HUD_H} radius={44} pulse={pulse}>
				{/* TOTAL */}
				<div style={{position: 'absolute', left: 38, top: 36}}>
					<NeonText font="body" size={20} glow={0.5} weight={700} letterSpacing="0.34em" palette="gold">
						TOTAL
					</NeonText>
				</div>

				{/* big rolling amount */}
				<div
					style={{
						position: 'absolute',
						left: 190,
						width: 380,
						top: 10,
						height: CELL_H,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						filter: `drop-shadow(0 0 2px rgba(255, 236, 150, 0.9)) drop-shadow(0 0 ${9 + 8 * pulse}px rgba(255, 196, 0, ${0.8 + 0.2 * pulse})) drop-shadow(0 0 ${24 + 18 * pulse}px rgba(255, 160, 0, ${0.55 + 0.3 * pulse}))`,
					}}
				>
					<div style={{width: SIGN_W, height: CELL_H, lineHeight: `${CELL_H}px`, textAlign: 'center', fontFamily: DISPLAY_FONT, fontSize: FONT, ...GOLD_TEXT}}>$</div>
					{Array.from({length: nInt}, (_, i) => (
						<Digit key={`i${i}`} ease={ease} {...slot(aInt[i], bInt[i])} />
					))}
					<div style={{width: DOT_W, height: CELL_H, lineHeight: `${CELL_H}px`, textAlign: 'center', fontFamily: DISPLAY_FONT, fontSize: FONT, ...GOLD_TEXT}}>.</div>
					<Digit ease={ease} {...slot(a.dec[0], b.dec[0])} />
					<Digit ease={ease} {...slot(a.dec[1], b.dec[1])} />
				</div>

				{/* n/9 found */}
				<div style={{position: 'absolute', right: 36, top: 24, width: 150, textAlign: 'right'}}>
					<div style={{display: 'inline-block', transform: `scale(${1 + (finale ? 0.5 : 0.28) * countFlash})`, transformOrigin: '100% 50%'}}>
						<NeonText size={46} glow={0.9 + 0.8 * countFlash + (finale ? 0.6 * finalEnv : 0)} palette="gold">
							{found}/{totalItems}
						</NeonText>
					</div>
					<div style={{height: 8}} />
					<NeonText font="body" size={13} glow={0.35} weight={700} letterSpacing="0.28em" palette="gold">
						FOUND
					</NeonText>
				</div>

				{/* finale: gold burst (rings + rays) around n/9 */}
				{kf >= 0 && kf < 30 ? <FinaleBurst kf={kf} /> : null}

				{/* cash bar */}
				<div style={{position: 'absolute', left: 36, top: 116, width: BAR_W, height: 24, display: 'flex', alignItems: 'center'}}>
					<div
						style={{
							position: 'relative',
							width: BAR_W,
							height: barH,
							borderRadius: barH,
							background: 'rgba(255,255,255,0.10)',
							boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)',
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								bottom: 0,
								width: BAR_W * frac,
								borderRadius: barH,
								background: 'linear-gradient(90deg, #FFAE00 0%, #FFC400 45%, #FFE066 100%)',
								boxShadow: `0 0 ${10 + 14 * em}px rgba(255, 196, 0, ${0.7 + 0.3 * em})`,
							}}
						/>
						{/* drain sweep: a bright band sliding right -> left while the voiceover says "how quickly it disappears" */}
						{em > 0 ? (
							<div
								style={{
									position: 'absolute',
									top: 0,
									bottom: 0,
									width: 120,
									left: (1 - sweepPhase) * (BAR_W + 120) - 120,
									opacity: em,
									background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))',
								}}
							/>
						) : null}
					</div>
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 144, textAlign: 'center', transform: `scale(${1 + 0.1 * em})`}}>
					<NeonText font="body" size={20} glow={0.55 + 0.6 * em} weight={700} letterSpacing="0.2em" palette="gold">
						{short ? `SHORT $${(-leftRaw).toFixed(2)}` : `$${left.toFixed(2)} LEFT`}
					</NeonText>
				</div>
			</LiquidGlass>
			{overBudget && kf >= 6 ? <OverBadge budget={budget} frame={kf - 6} position={position} /> : null}
		</div>
	);
};

/** Expanding gold rings + rays centred on the n/9 readout. */
const FinaleBurst: React.FC<{kf: number}> = ({kf}) => {
	const cx = HUD_W - 36 - 75; // centre of the n/9 block
	const cy = 47;
	const rings = [0, 6].map((delay) => {
		const t = (kf - delay) / 22;
		if (t < 0 || t >= 1) return null;
		const e = Easing.out(Easing.cubic)(t);
		const size = 70 * (0.4 + 2.2 * e);
		return (
			<div
				key={delay}
				style={{
					position: 'absolute',
					left: cx - size / 2,
					top: cy - size / 2,
					width: size,
					height: size,
					borderRadius: size,
					border: `${4 - 2.5 * t}px solid rgba(255, 214, 10, ${0.95 * (1 - t)})`,
					boxShadow: `0 0 ${18 * (1 - t)}px rgba(255, 196, 0, ${0.9 * (1 - t)}), inset 0 0 ${14 * (1 - t)}px rgba(255, 196, 0, ${0.6 * (1 - t)})`,
				}}
			/>
		);
	});
	const t = Math.min(1, kf / 22);
	const e = Easing.out(Easing.cubic)(t);
	return (
		<>
			{rings}
			<svg width={240} height={240} viewBox="-120 -120 240 240" style={{position: 'absolute', left: cx - 120, top: cy - 120, overflow: 'visible', pointerEvents: 'none'}}>
				{Array.from({length: 14}, (_, i) => {
					const a = (i / 14) * Math.PI * 2 + 0.15;
					const r0 = 26 + 34 * e;
					const r1 = r0 + 22 * (1 - t) + 6;
					return (
						<line
							key={i}
							x1={Math.cos(a) * r0}
							y1={Math.sin(a) * r0}
							x2={Math.cos(a) * r1}
							y2={Math.sin(a) * r1}
							stroke="#FFD60A"
							strokeWidth={i % 2 ? 3 : 5}
							strokeLinecap="round"
							opacity={1 - t}
							style={{filter: 'drop-shadow(0 0 5px rgba(255,196,0,0.9))'}}
						/>
					);
				})}
			</svg>
		</>
	);
};

/** "OVER $200" glass badge that pops in under (or above) the counter when the last item pushes the total past the budget. */
const OverBadge: React.FC<{budget: number; frame: number; position: 'top' | 'bottom'}> = ({budget, frame, position}) => {
	const {fps} = useVideoConfig();
	const pop = spring({frame, fps, config: {damping: 9, stiffness: 240, mass: 0.6}});
	const pulse = 0.5 + 0.5 * Math.sin((frame / 18) * Math.PI * 2);
	const H = 72;
	return (
		<div
			style={{
				position: 'absolute',
				left: '50%',
				[position === 'top' ? 'top' : 'bottom']: HUD_H + 16,
				width: 'max-content',
				transform: `translateX(-50%) scale(${0.5 + 0.5 * pop})`,
				opacity: interpolate(frame, [0, 3], [0, 1], clamp),
			}}
		>
			<LiquidGlass height={H} radius={H / 2} pulse={0.55 + 0.35 * pulse} contentStyle={{display: 'flex', alignItems: 'center', gap: 16, padding: '0 36px', height: H}}>
				<svg width={34} height={34} viewBox="0 0 34 34" style={{filter: 'drop-shadow(0 0 6px rgba(255,196,0,0.9))'}}>
					<path d="M17 3 L32 30 H2 Z" fill="none" stroke="#FFC400" strokeWidth={3} strokeLinejoin="round" />
					<path d="M17 13 V21" stroke="#FFD60A" strokeWidth={3.4} strokeLinecap="round" />
					<circle cx="17" cy="25.5" r="1.9" fill="#FFD60A" />
				</svg>
				<NeonText size={38} glow={1.2} palette="gold">
					OVER ${budget}
				</NeonText>
			</LiquidGlass>
		</div>
	);
};

