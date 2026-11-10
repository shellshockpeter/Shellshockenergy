import React from 'react';
import {
	Easing,
	Img,
	interpolate,
	interpolateColors,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {GlassPanel} from './GlassPanel';
import {
	BODY_FONT,
	BODY_FONT_FAMILY,
	COLORS,
	DISPLAY_FONT,
	PANEL,
	TIMING,
	green,
	red,
} from './theme';
import {useFitFontSize} from './useFitFontSize';

export type TubCardProps = {
	tubPrice: string;
	/** Price shown after the coupon is applied (the old price gets struck through). */
	salePrice: string;
	siteUrl: string;
	brandName: string;
	/** Top edge of the card (px). Keep >= 150 for the top safe zone. */
	top?: number;
	height?: number;
	tubSrc?: string;
};

const PAD = 34;
const TUB_ASPECT = 850 / 1100;
/** Height of the price area: shrunk old price stacked above the sale price. */
const PRICE_BOX = 176;
const OLD_PRICE_MAX = 138;

/** "SHELLSHOCK ENERGY" -> ["SHELLSHOCK", "ENERGY"]; balances longer names. */
const splitBrand = (name: string): string[] => {
	const words = name.trim().split(/\s+/);
	if (words.length <= 1) return words;
	let best = 1;
	let bestDiff = Infinity;
	for (let i = 1; i < words.length; i++) {
		const a = words.slice(0, i).join(' ').length;
		const b = words.slice(i).join(' ').length;
		if (Math.abs(a - b) < bestDiff) {
			bestDiff = Math.abs(a - b);
			best = i;
		}
	}
	return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
};

/**
 * Website-style product card. Render it INSIDE a <Sequence>: it reads the
 * local frame, slides in from the right with a spring at frame 0 and slides
 * back out during the last `exitFrames` frames of the Sequence.
 *
 * When the coupon lands (TIMING.card.strikeStart) a red glowing dash is drawn
 * through the old price, which shrinks away while the sale price pops in.
 */
export const TubCard: React.FC<TubCardProps> = ({
	tubPrice,
	salePrice,
	siteUrl,
	brandName,
	top = 170,
	height = 410,
	tubSrc = staticFile('tub.png'),
}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames, width: canvasW} = useVideoConfig();

	/* ---- motion -------------------------------------------------- */
	const travel = canvasW - PANEL.left + 20; // fully off-canvas to the right
	const enter = spring({
		frame,
		fps,
		// zeta ~0.8: overshoots ~1.5% of the travel (~15px) then settles
		config: {damping: 16, stiffness: 100, mass: 1},
	});
	const exitStart = durationInFrames - TIMING.card.exitFrames;
	const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.cubic),
	});
	const translateX = (1 - enter) * travel + exit * travel;

	/* ---- breathing glow ------------------------------------------ */
	const breath = 0.5 + 0.5 * Math.sin((frame / (fps * 2.4)) * Math.PI * 2);
	const glow = 0.22 + 0.3 * breath;
	const borderAlpha = 0.38 + 0.4 * breath;
	const bob = Math.sin((frame / (fps * 3)) * Math.PI * 2) * 4;

	/* ---- coupon applied: strike old price, reveal sale price ------ */
	const {strikeStart, strikeDuration, salePriceStart} = TIMING.card;
	const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
	const strike = interpolate(
		frame,
		[strikeStart, strikeStart + strikeDuration],
		[0, 1],
		{...clamp, easing: Easing.out(Easing.cubic)},
	);
	// the dash flares as it lands, then settles to a steady burn
	const strikeFlare = interpolate(
		frame,
		[strikeStart + strikeDuration, strikeStart + strikeDuration + 14],
		[1, 0],
		clamp,
	);
	const shrink = interpolate(
		frame,
		[salePriceStart - 2, salePriceStart + 10],
		[0, 1],
		{...clamp, easing: Easing.inOut(Easing.cubic)},
	);
	const oldScale = 1 - shrink * 0.54;
	const oldY = ((PRICE_BOX - OLD_PRICE_MAX) / 2) * (1 - shrink);
	const oldColor = interpolateColors(shrink, [0, 1], [COLORS.green, COLORS.silver]);
	const oldOpacity = 1 - shrink * 0.4;
	const sale = spring({
		frame: frame - salePriceStart,
		fps,
		config: {damping: 11, stiffness: 180, mass: 0.7},
	});
	const saleOpacity = interpolate(
		frame,
		[salePriceStart, salePriceStart + 4],
		[0, 1],
		clamp,
	);

	/* ---- layout / fitting ---------------------------------------- */
	const tubH = height - 60;
	const tubW = tubH * TUB_ASPECT;
	const textLeft = PAD + tubW + 38;
	const textW = PANEL.width - textLeft - PAD;

	const brandLines = splitBrand(brandName);
	const brandSize = useFitFontSize({
		text: brandLines,
		fontFamily: DISPLAY_FONT,
		maxWidth: textW,
		maxFontSize: 54,
		minFontSize: 24,
	});
	const priceText = `$${tubPrice}`;
	const saleText = `$${salePrice}`;
	const priceSize = useFitFontSize({
		text: priceText,
		fontFamily: DISPLAY_FONT,
		maxWidth: textW,
		maxFontSize: OLD_PRICE_MAX,
		minFontSize: 40,
	});
	const saleSize = useFitFontSize({
		text: saleText,
		fontFamily: DISPLAY_FONT,
		maxWidth: textW,
		maxFontSize: 112,
		minFontSize: 36,
	});
	const urlSize = useFitFontSize({
		text: siteUrl,
		fontFamily: BODY_FONT_FAMILY,
		fontWeight: 600,
		letterSpacing: '0.04em',
		maxWidth: textW,
		maxFontSize: 30,
		minFontSize: 14,
	});

	const dashH = Math.max(8, priceSize * 0.075);

	return (
		<div
			style={{
				position: 'absolute',
				left: PANEL.left,
				top,
				transform: `translateX(${translateX}px)`,
				willChange: 'transform',
			}}
		>
			<GlassPanel
				height={height}
				glow={glow}
				glowRadius={44}
				borderAlpha={borderAlpha}
			>
				{/* green halo behind the tub */}
				<div
					style={{
						position: 'absolute',
						left: PAD - 40,
						top: 0,
						width: tubW + 80,
						height,
						background: `radial-gradient(closest-side, ${green(0.22)}, transparent 80%)`,
					}}
				/>
				<Img
					src={tubSrc}
					style={{
						position: 'absolute',
						left: PAD,
						top: (height - tubH) / 2 + bob,
						width: tubW,
						height: tubH,
						objectFit: 'contain',
						filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.55))',
					}}
				/>

				<div
					style={{
						position: 'absolute',
						left: textLeft,
						width: textW,
						top: 0,
						height,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						gap: 12,
					}}
				>
					<div
						style={{
							fontFamily: DISPLAY_FONT,
							fontSize: brandSize,
							lineHeight: 1.02,
							color: COLORS.white,
							textTransform: 'uppercase',
							whiteSpace: 'nowrap',
						}}
					>
						{brandLines.map((l) => (
							<div key={l}>{l}</div>
						))}
					</div>
					<div
						style={{
							width: 84,
							height: 5,
							borderRadius: 3,
							background: COLORS.green,
							boxShadow: `0 0 14px ${green(0.8)}`,
						}}
					/>

					<div style={{position: 'relative', height: PRICE_BOX, width: textW}}>
						{/* original price: struck through, then shrinks away */}
						<div
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								transformOrigin: '0 0',
								transform: `translateY(${oldY}px) scale(${oldScale})`,
								opacity: oldOpacity,
							}}
						>
							<span
								style={{
									position: 'relative',
									display: 'inline-block',
									fontFamily: DISPLAY_FONT,
									fontSize: priceSize,
									lineHeight: 1,
									color: oldColor,
									whiteSpace: 'nowrap',
									textShadow:
										shrink < 1
											? `0 0 ${18 + 14 * breath}px ${green(0.55 * (1 - shrink))}`
											: 'none',
								}}
							>
								{priceText}
								{/* red glowing dash, drawn left -> right */}
								<span
									style={{
										position: 'absolute',
										left: -12,
										right: -12,
										top: '50%',
										height: dashH,
										marginTop: -dashH / 2,
										borderRadius: 999,
										background: `linear-gradient(90deg, ${red(0.95)}, #FF5A5A 50%, ${red(0.95)})`,
										boxShadow: `0 0 ${14 + 26 * strikeFlare}px ${3 + 5 * strikeFlare}px ${red(0.7 + 0.3 * strikeFlare)}, 0 0 46px ${red(0.35)}`,
										transformOrigin: '0 50%',
										transform: `rotate(-7deg) scaleX(${strike})`,
										opacity: strike > 0 ? 1 : 0,
									}}
								/>
							</span>
						</div>

						{/* new price */}
						<div
							style={{
								position: 'absolute',
								left: 0,
								bottom: 0,
								fontFamily: DISPLAY_FONT,
								fontSize: saleSize,
								lineHeight: 1,
								color: COLORS.green,
								whiteSpace: 'nowrap',
								opacity: saleOpacity,
								transformOrigin: '0 100%',
								transform: `scale(${0.6 + 0.4 * sale})`,
								textShadow: `0 0 ${22 + 14 * breath}px ${green(0.65)}`,
							}}
						>
							{saleText}
						</div>
					</div>

					<div
						style={{
							fontFamily: BODY_FONT,
							fontWeight: 600,
							fontSize: urlSize,
							letterSpacing: '0.04em',
							color: COLORS.silver,
							whiteSpace: 'nowrap',
						}}
					>
						{siteUrl}
					</div>
				</div>
			</GlassPanel>
		</div>
	);
};
