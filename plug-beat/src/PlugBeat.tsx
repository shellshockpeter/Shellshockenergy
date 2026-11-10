import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {z} from 'zod';
import {CouponChip, flipStartFrame} from './CouponChip';
import {fileExists} from './sfx';
import {TubCard} from './TubCard';
import {CANVAS, TIMING} from './theme';

export const plugBeatSchema = z.object({
	tubPrice: z.string(),
	salePrice: z.string(),
	siteUrl: z.string(),
	brandName: z.string(),
	code: z.string(),
	discountLabel: z.string(),
	finePrint: z.string(),
	/**
	 * Filled in automatically by calculateMetadata (which checks public/sfx/).
	 * Leave as-is; a missing file just means that sound is skipped.
	 */
	sfx: z.object({tick: z.boolean(), stamp: z.boolean()}),
});

export type PlugBeatProps = z.infer<typeof plugBeatSchema>;

export const plugBeatDefaults: PlugBeatProps = {
	tubPrice: '49.99',
	salePrice: '39.99',
	siteUrl: 'shellshockenergy.com',
	brandName: 'SHELLSHOCK ENERGY',
	code: 'SHOCK20',
	discountLabel: '20% OFF',
	finePrint: 'New newsletter subscribers',
	sfx: {tick: false, stamp: false},
};

/** Layout (px). Card in the upper third, chip in the lower third. */
const CARD_TOP = 170; // >= 150 top safe zone; card spans 170-580
const CHIP_TOP = 1290; // chip spans 1290-1630; bottom safe limit is 1670

const TICK_SFX = 'sfx/tick.mp3';
const STAMP_SFX = 'sfx/stamp.mp3';

/**
 * Transparent overlay: no background layer, so it composites over footage.
 * The middle of the frame (≈580-1290) is intentionally left empty for the
 * money counter.
 */
export const PlugBeat: React.FC<PlugBeatProps> = ({
	tubPrice,
	salePrice,
	siteUrl,
	brandName,
	code,
	discountLabel,
	finePrint,
	sfx,
}) => {
	const {card, chip} = TIMING;
	const letters = Array.from(code);

	return (
		<AbsoluteFill>
			<Sequence
				name="Tub card"
				from={card.start}
				durationInFrames={card.end - card.start}
			>
				<TubCard
					tubPrice={tubPrice}
					salePrice={salePrice}
					siteUrl={siteUrl}
					brandName={brandName}
					top={CARD_TOP}
				/>
			</Sequence>

			<Sequence
				name="SHOCK20 chip"
				from={chip.start}
				durationInFrames={chip.end - chip.start}
			>
				<CouponChip
					code={code}
					discountLabel={discountLabel}
					finePrint={finePrint}
					top={CHIP_TOP}
				/>
			</Sequence>

			{/* ---- sound (only mounted if the file actually exists) ---- */}
			{sfx.stamp ? (
				<Sequence name="SFX stamp" from={chip.start} durationInFrames={45}>
					<Audio src={staticFile(STAMP_SFX)} />
				</Sequence>
			) : null}
			{sfx.tick
				? letters.map((ch, i) =>
						ch.trim() === '' ? null : (
							<Sequence
								key={i}
								name={`SFX tick ${i + 1}`}
								from={chip.start + flipStartFrame(i)}
								durationInFrames={10}
							>
								<Audio src={staticFile(TICK_SFX)} />
							</Sequence>
						),
					)
				: null}
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* Sound-file detection: never crash on a missing mp3                  */
/* ------------------------------------------------------------------ */
export const calculateMetadata = async ({
	props,
}: {
	props: PlugBeatProps;
}) => {
	const [tick, stamp] = await Promise.all([
		fileExists(TICK_SFX),
		fileExists(STAMP_SFX),
	]);
	if (!tick) {
		console.warn(`[PlugBeat] TODO: add public/${TICK_SFX} — rendering without tick sounds.`);
	}
	if (!stamp) {
		console.warn(`[PlugBeat] TODO: add public/${STAMP_SFX} — rendering without the stamp sound.`);
	}
	return {
		durationInFrames: CANVAS.duration,
		props: {...props, sfx: {tick, stamp}},
	};
};
