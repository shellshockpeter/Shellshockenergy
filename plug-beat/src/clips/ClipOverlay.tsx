import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {z} from 'zod';
import {detectSfx, fileExists} from '../sfx';
import {DollarCounter} from '../video1/DollarCounter';
import {PickupChip} from '../video1/PickupChip';
import {CASH_START, CLIPS, TOTAL_ITEMS, type ClipId} from './clips';
import {DEFAULT_SYNC_OFFSET_FRAMES, clipChain, resolveClip} from './clipsResolve';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export const clipSchema = z.object({
	/** running total BEFORE this clip (default comes from clips.ts) */
	startTotal: z.number(),
	/** cash the viewer started with: drives the bar, "LEFT", "SHORT" and "OVER $200" */
	cashStart: z.number(),
	/** true: show the clip (public/clips/<file>) under the graphics. false: graphics only (for the alpha render) */
	preview: z.boolean(),
	/** frames added to every event; -2 = graphics land 2 frames BEFORE the pickup */
	syncOffsetFrames: z.number(),
	hudPosition: z.enum(['top', 'bottom']),
	sfxVolume: z.number().min(0).max(1),
	/** TongkatAli: lengthen the clip (6.0 s -> 7.5 s) so the finale has room to play. Ignored by the other clips. */
	extended: z.boolean(),
	/** auto-detected from public/sfx — leave as-is */
	sfx: z.object({tick: z.boolean(), stamp: z.boolean()}),
	hasSource: z.boolean(),
	/** auto-detected: where the clip file was found (public/clips/<file> or public/<file>) */
	clipFile: z.string(),
});
export type ClipProps = z.infer<typeof clipSchema>;

export const clipDefaults = (id: ClipId): ClipProps => ({
	startTotal: CLIPS[id].startTotal,
	cashStart: CASH_START,
	preview: true,
	syncOffsetFrames: DEFAULT_SYNC_OFFSET_FRAMES,
	hudPosition: 'top',
	sfxVolume: 0.8,
	extended: false,
	sfx: {tick: false, stamp: false},
	hasSource: false,
	clipFile: '',
});

/** a clip may sit in public/clips/ or loose in public/ */
const findClipFile = async (file: string): Promise<string> => {
	for (const name of [`clips/${file}`, file]) {
		if (await fileExists(name)) return name;
	}
	return '';
};

const SFX_FILES = {tick: 'sfx/tick.mp3', stamp: 'sfx/stamp.mp3'} as const;

/** Console report: running total after every clip + warnings. */
const logChain = (id: ClipId, startTotal: number) => {
	const {rows, warnings} = clipChain({[id]: startTotal});
	for (const r of rows) {
		console.log(`[Clips] ${r.title.padEnd(13)} $${r.start.toFixed(2)} + $${r.price.toFixed(2)} = $${r.end.toFixed(2)}  (${r.item}/${TOTAL_ITEMS}, $${r.left.toFixed(2)} ${r.left >= 0 ? 'left' : 'SHORT'})${r.id === id ? '   <- this clip' : ''}`);
	}
	for (const w of warnings) console.warn(`[Clips] ⚠ ${w}`);
};

export const clipCalculateMetadata =
	(id: ClipId) =>
	async ({props}: {props: ClipProps}) => {
		const cfg = CLIPS[id];
		const [sfx, clipFile] = await Promise.all([
			detectSfx('Clips', SFX_FILES),
			props.preview ? findClipFile(cfg.file) : Promise.resolve(''),
		]);
		if (props.preview && !clipFile) console.warn(`[Clips] TODO: put the clip at public/${cfg.file} (or public/clips/) — preview is showing graphics only.`);
		logChain(id, props.startTotal);
		const {durationInFrames} = resolveClip(id, {syncOffsetFrames: props.syncOffsetFrames, startTotal: props.startTotal, extended: props.extended});
		return {durationInFrames, props: {...props, sfx: sfx as ClipProps['sfx'], hasSource: !!clipFile, clipFile}};
	};

/* ------------------------------------------------------------------ */
/* The composition                                                     */
/* ------------------------------------------------------------------ */
export const ClipOverlay: React.FC<ClipProps & {clipId: ClipId}> = ({
	clipId,
	startTotal,
	cashStart,
	preview,
	syncOffsetFrames,
	hudPosition,
	sfxVolume,
	extended,
	sfx,
	hasSource,
	clipFile,
}) => {
	const R = resolveClip(clipId, {syncOffsetFrames, startTotal, extended});
	const {cfg, pickup} = R;

	return (
		<AbsoluteFill>
			{preview && hasSource ? (
				<AbsoluteFill style={{zIndex: 0}}>
					<OffthreadVideo src={staticFile(clipFile)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				</AbsoluteFill>
			) : null}
			{preview && !hasSource ? (
				<div style={{zIndex: 5, position: 'absolute', left: 80, right: 80, bottom: 300, textAlign: 'center', fontFamily: 'sans-serif', fontSize: 26, color: '#FFD60A', background: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12}}>
					clip not found: public/{cfg.file}
				</div>
			) : null}

			{/* ALL graphics live in this layer, always above the clip */}
			<AbsoluteFill style={{zIndex: 1}}>
				{/* the HUD is already on screen at frame 0 showing the running total, n/9 and the cash bar */}
				<DollarCounter
					timeline={R}
					position={hudPosition}
					baseTotal={startTotal}
					foundOffset={cfg.itemNumber - 1}
					budget={cashStart}
					totalItems={TOTAL_ITEMS}
					finale={!!cfg.finale}
				/>
				<PickupChip pickup={pickup} timeline={R} position={hudPosition} />

				{/* sound (only mounted if the file exists): tick when the roll starts, stamp when the chip lands */}
				{sfx.stamp ? (
					<Sequence name="SFX stamp (chip lands)" from={pickup.landFrame} durationInFrames={30}>
						<Audio src={staticFile(SFX_FILES.stamp)} volume={sfxVolume} />
					</Sequence>
				) : null}
				{sfx.tick ? (
					<Sequence name="SFX tick (counter rolls)" from={pickup.landFrame + 3} durationInFrames={8}>
						<Audio src={staticFile(SFX_FILES.tick)} volume={sfxVolume} />
					</Sequence>
				) : null}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
