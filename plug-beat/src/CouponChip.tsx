import React from 'react';
import {
	Easing,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {HexPattern} from './HexPattern';
import {
	BODY_FONT,
	COLORS,
	DISPLAY_FONT,
	PANEL,
	TIMING,
	green,
} from './theme';
import {useFitFontSize} from './useFitFontSize';

export type CouponChipProps = {
	code: string;
	discountLabel: string;
	finePrint: string;
	/** Top edge of the chip (px). Chip bottom must stay <= 1670. */
	top?: number;
};

const W = PANEL.width;
const H = 340;
const R = PANEL.radius;
const NOTCH_Y = 204; // vertical centre of the ticket notches / perforation
const NOTCH_R = 26;
const PAD = 56;
const CELL_H = 120;
const CELL_GAP = 10;

/** Rounded rectangle with a semicircular notch cut into each side. */
const ticketPath = [
	`M${R} 0`,
	`H${W - R}`,
	`A${R} ${R} 0 0 1 ${W} ${R}`,
	`V${NOTCH_Y - NOTCH_R}`,
	`A${NOTCH_R} ${NOTCH_R} 0 0 0 ${W} ${NOTCH_Y + NOTCH_R}`,
	`V${H - R}`,
	`A${R} ${R} 0 0 1 ${W - R} ${H}`,
	`H${R}`,
	`A${R} ${R} 0 0 1 0 ${H - R}`,
	`V${NOTCH_Y + NOTCH_R}`,
	`A${NOTCH_R} ${NOTCH_R} 0 0 0 0 ${NOTCH_Y - NOTCH_R}`,
	`V${R}`,
	`A${R} ${R} 0 0 1 ${R} 0`,
	'Z',
].join(' ');

/** Frame (local to the chip Sequence) at which letter `i` starts flipping. */
export const flipStartFrame = (i: number) =>
	TIMING.chip.flipStart + i * TIMING.chip.flipStagger;

/** 0 -> 1 -> 0 bump used for the post-checkmark glow pulses. */
const pulseEnvelope = (frame: number) => {
	const {pulseStart, pulseLength, pulses} = TIMING.chip;
	const phase = (frame - pulseStart) / pulseLength;
	if (phase < 0 || phase > pulses) return 0;
	return 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
};

/** One split-flap character cell. */
const FlipChar: React.FC<{
	char: string;
	index: number;
	cellW: number;
	fontSize: number;
}> = ({char, index, cellW, fontSize}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const start = flipStartFrame(index);

	const flip = spring({
		frame: frame - start,
		fps,
		durationInFrames: TIMING.chip.flipDuration,
		config: {damping: 14, stiffness: 220, mass: 0.6},
	});
	const angle = interpolate(flip, [0, 1], [-90, 0]);
	const visible = frame >= start && angle > -88;
	// brief green flash as each letter lands
	const landed = interpolate(
		frame,
		[start + 4, start + TIMING.chip.flipDuration + 6],
		[1, 0],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);

	return (
		<div
			style={{
				position: 'relative',
				width: cellW,
				height: CELL_H,
				borderRadius: 14,
				background:
					'linear-gradient(180deg, rgba(34,38,34,0.95) 0%, rgba(14,14,14,0.98) 50%, rgba(24,27,24,0.95) 100%)',
				border: '1px solid rgba(255,255,255,0.08)',
				boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.6)',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: DISPLAY_FONT,
					fontSize,
					lineHeight: 1,
					color: landed > 0.01 ? COLORS.green : COLORS.white,
					textShadow: `0 0 ${10 + 18 * landed}px ${green(0.25 + 0.6 * landed)}`,
					opacity: visible ? 1 : 0,
					transform: `perspective(420px) rotateX(${angle}deg)`,
					transformOrigin: '50% 50%',
					backfaceVisibility: 'hidden',
					whiteSpace: 'pre',
				}}
			>
				{char}
			</div>
			{/* split-flap hinge line */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: CELL_H / 2 - 1,
					height: 2,
					background: 'rgba(0,0,0,0.85)',
					boxShadow: '0 1px 0 rgba(255,255,255,0.07)',
				}}
			/>
		</div>
	);
};

/**
 * Coupon-style ticket chip. Render it INSIDE a <Sequence>: it slams in at
 * local frame 0, flips its code in letter by letter, draws an "APPLIED"
 * checkmark, pulses twice, then exits to the left during the final
 * `exitFrames` frames.
 */
export const CouponChip: React.FC<CouponChipProps> = ({
	code,
	discountLabel,
	finePrint,
	top = 1290,
}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const {chip} = TIMING;

	/* ---- slam + shake -------------------------------------------- */
	const slam = spring({
		frame,
		fps,
		config: {damping: 13, stiffness: 320, mass: 0.55},
	});
	const scale = interpolate(slam, [0, 1], [1.6, 1]);
	const opacity = interpolate(frame, [0, 3], [0, 1], {
		extrapolateRight: 'clamp',
	});
	// deterministic 6-frame shake (no randomness => identical on every render)
	const shakeDecay = Math.max(0, 1 - frame / chip.shakeFrames);
	const shakeX = Math.sin(frame * 2.9 + 1) * 16 * shakeDecay;
	const shakeY = Math.cos(frame * 3.7) * 11 * shakeDecay;

	/* ---- exit to the left ---------------------------------------- */
	const exitStart = durationInFrames - chip.exitFrames;
	const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.cubic),
	});
	const exitX = -exit * (PANEL.left + W + 20);

	/* ---- checkmark + pulses -------------------------------------- */
	const check = interpolate(
		frame,
		[chip.checkStart, chip.checkStart + chip.checkDuration],
		[0, 1],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.out(Easing.cubic),
		},
	);
	const appliedIn = interpolate(
		frame,
		[chip.checkStart + 4, chip.checkStart + 14],
		[0, 1],
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
	);
	const pulse = pulseEnvelope(frame);
	const glowRadius = 22 + 40 * pulse;
	const glowAlpha = 0.28 + 0.5 * pulse;
	const borderAlpha = 0.5 + 0.5 * pulse;

	/* ---- code cells ---------------------------------------------- */
	const chars = Array.from(code);
	const n = Math.max(1, chars.length);
	const avail = W - PAD * 2;
	const cellW = Math.min(104, (avail - CELL_GAP * (n - 1)) / n);
	const codeFont = useFitFontSize({
		text: code,
		fontFamily: DISPLAY_FONT,
		maxWidth: cellW * n * 0.86,
		maxFontSize: 96,
		minFontSize: 24,
	});
	const discountSize = useFitFontSize({
		text: discountLabel,
		fontFamily: DISPLAY_FONT,
		maxWidth: 440,
		maxFontSize: 74,
		minFontSize: 28,
	});

	const bottomMid = (NOTCH_Y + H) / 2;

	return (
		<div
			style={{
				position: 'absolute',
				left: PANEL.left,
				top,
				width: W,
				height: H,
				opacity,
				transform: `translate(${exitX + shakeX}px, ${shakeY}px) scale(${scale})`,
				transformOrigin: '50% 50%',
				// drop-shadow follows the notched alpha shape of the ticket
				filter: `drop-shadow(0 0 ${glowRadius}px ${green(glowAlpha)})`,
				willChange: 'transform, filter',
			}}
		>
			{/* glass body, clipped to the notched ticket shape */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					clipPath: `path('${ticketPath}')`,
					background:
						'linear-gradient(145deg, rgba(24, 28, 24, 0.80) 0%, rgba(10, 10, 10, 0.88) 100%)',
					backdropFilter: 'blur(24px)',
					WebkitBackdropFilter: 'blur(24px)',
				}}
			>
				<HexPattern opacity={0.08} />
			</div>

			{/* border + perforation */}
			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{position: 'absolute', inset: 0, overflow: 'visible'}}
			>
				<path
					d={ticketPath}
					fill="none"
					stroke={green(borderAlpha)}
					strokeWidth={1.5}
				/>
				<line
					x1={NOTCH_R + 22}
					x2={W - NOTCH_R - 22}
					y1={NOTCH_Y}
					y2={NOTCH_Y}
					stroke="rgba(255,255,255,0.2)"
					strokeWidth={2}
					strokeDasharray="7 9"
				/>
			</svg>

			{/* label */}
			<div
				style={{
					position: 'absolute',
					top: 22,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: BODY_FONT,
					fontWeight: 600,
					fontSize: 22,
					letterSpacing: '0.38em',
					textIndent: '0.38em',
					color: COLORS.silverDim,
				}}
			>
				PROMO CODE
			</div>

			{/* split-flap code */}
			<div
				style={{
					position: 'absolute',
					top: 58,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					gap: CELL_GAP,
				}}
			>
				{chars.map((c, i) => (
					<FlipChar
						key={i}
						char={c}
						index={i}
						cellW={cellW}
						fontSize={codeFont}
					/>
				))}
			</div>

			{/* discount + fine print */}
			<div
				style={{
					position: 'absolute',
					left: PAD,
					top: NOTCH_Y,
					height: H - NOTCH_Y,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					gap: 8,
				}}
			>
				<div
					style={{
						fontFamily: DISPLAY_FONT,
						fontSize: discountSize,
						lineHeight: 1,
						color: COLORS.green,
						whiteSpace: 'nowrap',
						textShadow: `0 0 ${14 + 12 * pulse}px ${green(0.55)}`,
					}}
				>
					{discountLabel}
				</div>
				<div
					style={{
						fontFamily: BODY_FONT,
						fontWeight: 400,
						fontSize: 24,
						letterSpacing: '0.02em',
						color: COLORS.silverDim,
						whiteSpace: 'nowrap',
					}}
				>
					{finePrint}
				</div>
			</div>

			{/* checkmark + APPLIED */}
			<div
				style={{
					position: 'absolute',
					right: PAD,
					top: bottomMid - 30,
					height: 60,
					display: 'flex',
					alignItems: 'center',
					gap: 14,
				}}
			>
				<svg width={52} height={52} viewBox="0 0 56 56" style={{overflow: 'visible'}}>
					<circle
						cx={28}
						cy={28}
						r={25}
						fill="none"
						stroke={green(0.35 * check)}
						strokeWidth={2}
					/>
					<path
						d="M13 29 L24 40 L43 16"
						fill="none"
						stroke={COLORS.green}
						strokeWidth={6}
						strokeLinecap="round"
						strokeLinejoin="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - check}
						style={{filter: `drop-shadow(0 0 6px ${green(0.9)})`}}
					/>
				</svg>
				<div
					style={{
						fontFamily: BODY_FONT,
						fontWeight: 700,
						fontSize: 28,
						letterSpacing: '0.22em',
						color: COLORS.green,
						opacity: appliedIn,
						transform: `translateX(${(1 - appliedIn) * 14}px)`,
						textShadow: `0 0 12px ${green(0.5)}`,
					}}
				>
					APPLIED
				</div>
			</div>
		</div>
	);
};
