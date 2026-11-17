import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {z} from 'zod';
import {SLAM} from '../mapConfig';
import {MapSegment, mapDefaults} from '../MapSegment';
import {NeonPaletteProvider} from '../NeonText';
import {fileExists, detectSfx} from '../sfx';
import {CostBreak} from './CostBreak';
import {DollarCounter} from './DollarCounter';
import {MapIntroScene} from './MapIntroScene';
import {NineBoard, tileStartFrames} from './NineBoard';
import {PickupChip} from './PickupChip';
import {TubOutline} from './TubOutline';
import {getVideoMetadata} from '@remotion/media-utils';
import {BOARD_REVEAL, FPS, revealStartFrame, TIMELINE, TOTAL_FRAMES, DEFAULT_SYNC_OFFSET_FRAMES, VIDEO_IS_ALREADY_TRIMMED, keptRanges, resolveTimeline, toOutputSeconds, validateTimeline} from './timeline';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export const video1Schema = z.object({
	/** true: show public/source.mp4 underneath (to check sync). false: render ONLY the graphics. */
	preview: z.boolean(),
	/** frames added to EVERY event; -2 = graphics land 2 frames before the spoken word */
	syncOffsetFrames: z.number(),
	hudPosition: z.enum(['top', 'bottom']),
	/** colour of the map's neon text (labels, title, DONE stamps). gold = current map look. */
	mapTextColor: z.enum(['gold', 'red']),
	sfxVolume: z.number().min(0).max(1),
	/** where the tub is in YOUR footage (1080x1920 frame): centre x/y, width of the outline, tilt in degrees */
	tubX: z.number(),
	tubY: z.number(),
	tubW: z.number(),
	tubRotate: z.number(),
	/** Auto-detected from public/ — leave as-is. */
	sfx: z.object({whoosh: z.boolean(), thud: z.boolean(), tick: z.boolean(), stamp: z.boolean()}),
	/** file in public/ used as the background video. Leave empty to auto-detect (see SOURCE_CANDIDATES). */
	sourceFile: z.string(),
	hasSource: z.boolean(),
});
export type Video1Props = z.infer<typeof video1Schema>;

export const video1Defaults: Video1Props = {
	preview: true,
	syncOffsetFrames: DEFAULT_SYNC_OFFSET_FRAMES,
	hudPosition: 'top',
	mapTextColor: 'gold',
	sfxVolume: 0.8,
	tubX: 540,
	tubY: 1150,
	tubW: 420,
	tubRotate: 0,
	sfx: {whoosh: false, thud: false, tick: false, stamp: false},
	sourceFile: '',
	hasSource: false,
};

const SFX_FILES = {
	whoosh: 'sfx/whoosh.mp3',
	thud: 'sfx/thud.mp3',
	tick: 'sfx/tick.mp3',
	stamp: 'sfx/stamp.mp3',
} as const;
/** Background video lookup: first file found in public/ wins. Add your own names here. */
const SOURCE_BASENAMES = ['A57BF0BA-A76E-42EB-AD03-2F7AE0100196', 'source'];
const SOURCE_EXTENSIONS = ['mp4', 'mov', 'MOV', 'MP4', 'm4v', 'webm'];

const findSource = async (explicit: string): Promise<string> => {
	const candidates = [explicit, ...SOURCE_BASENAMES.flatMap((b) => SOURCE_EXTENSIONS.map((e) => `${b}.${e}`))].filter(Boolean);
	for (const name of candidates) {
		if (await fileExists(name)) return name;
	}
	return '';
};

export const video1CalculateMetadata = async ({props}: {props: Video1Props}) => {
	const [sfx, sourceFile] = await Promise.all([
		detectSfx('Video1', SFX_FILES),
		props.preview ? findSource(props.sourceFile) : Promise.resolve(''),
	]);

	// The composition is exactly as long as your video file (so a re-trimmed export is picked up automatically).
	let durationInFrames = TOTAL_FRAMES;
	if (props.preview && !sourceFile) {
		console.warn(`[Video1] TODO: put your video in public/ (e.g. public/${SOURCE_BASENAMES[0]}.mp4 or public/source.mp4) — preview is showing graphics only.`);
	} else if (sourceFile) {
		try {
			const meta = await getVideoMetadata(staticFile(sourceFile));
			const videoFrames = Math.round(meta.durationInSeconds * FPS);
			if (VIDEO_IS_ALREADY_TRIMMED) durationInFrames = videoFrames;
			console.log(`[Video1] background video: public/${sourceFile} — ${meta.durationInSeconds.toFixed(2)} s (${videoFrames} frames, ${meta.width}x${meta.height})`);
			if (Math.abs(videoFrames - TOTAL_FRAMES) > FPS / 2) {
				console.warn(`[Video1] ⚠ the video is ${(videoFrames / FPS).toFixed(2)} s but the timeline expects ${(TOTAL_FRAMES / FPS).toFixed(2)} s (56 s minus the CUTS). If you trimmed a different amount, change CUTS in src/video1/timeline.ts.`);
			}
		} catch (err) {
			console.warn('[Video1] could not read the video length, using the timeline length', err);
		}
	}
	for (const w of validateTimeline(resolveTimeline(props.syncOffsetFrames))) console.warn(`[Video1] ⚠ ${w}`);
	return {durationInFrames, props: {...props, sfx: sfx as Video1Props['sfx'], sourceFile, hasSource: !!sourceFile}};
};

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
/** Fades a map slam segment in/out so it doesn't pop on and off (set 0 in the timeline file's FADE to disable). */
const FADE_FRAMES = 6;
const SlamFade: React.FC<{fadeIn: number; fadeOut: number; children: React.ReactNode}> = ({fadeIn, fadeOut, children}) => {
	const frame = useCurrentFrame();
	const a = fadeIn > 0 ? interpolate(frame, [0, fadeIn], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
	const b = fadeOut > 0 ? interpolate(frame, [SLAM.duration - fadeOut, SLAM.duration], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
	return <AbsoluteFill style={{opacity: a * b}}>{children}</AbsoluteFill>;
};

/* ------------------------------------------------------------------ */
/* The master composition                                              */
/* ------------------------------------------------------------------ */
export const Video1Overlay: React.FC<Video1Props> = ({preview, syncOffsetFrames, hudPosition, mapTextColor, sfxVolume, tubX, tubY, tubW, tubRotate, sfx, sourceFile, hasSource}) => {
	const T = resolveTimeline(syncOffsetFrames);
	const tiles = tileStartFrames(T);

	return (
		<AbsoluteFill>
			{/* ---- preview video (off for the real alpha render) ---- */}
			{preview && hasSource ? (
				<AbsoluteFill style={{zIndex: 0}}>
					{VIDEO_IS_ALREADY_TRIMMED ? (
						// your file is already trimmed: play it straight from the start
						<OffthreadVideo src={staticFile(sourceFile)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
					) : (
						// original file: play only the pieces that survive the CUTS, back to back
						keptRanges().map((r) => (
							<Sequence
								key={r.from}
								name={`Source ${r.from.toFixed(2)}–${r.to.toFixed(2)}s`}
								from={Math.round(toOutputSeconds(r.from) * FPS)}
								durationInFrames={Math.round((r.to - r.from) * FPS)}
							>
								<OffthreadVideo src={staticFile(sourceFile)} trimBefore={Math.round(r.from * FPS)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
							</Sequence>
						))
					)}
				</AbsoluteFill>
			) : null}
			{preview && !hasSource ? (
				<div style={{zIndex: 5, position: 'absolute', left: 80, right: 80, top: 160, textAlign: 'center', fontFamily: 'sans-serif', fontSize: 26, color: '#FFD60A', background: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12}}>
					background video not found in public/ — showing graphics only
				</div>
			) : null}

			{/* ALL graphics live in this layer, always above the video (zIndex 1 vs 0) */}
			<AbsoluteFill style={{zIndex: 1}}>
			{/* ---- 0. first 6 s: golden outline around the tub, then the red $0 -> $200 counter that cracks and crumbles ---- */}
			<TubOutline timeline={T} x={tubX} y={tubY} width={tubW} rotate={tubRotate} />
			<CostBreak timeline={T} />

			{/* ---- 1. map entrance: "three different locations" ---- */}
			<NeonPaletteProvider palette={mapTextColor}>
				<Sequence name="Map intro" from={T.map.introStart} durationInFrames={T.map.exitEnd - T.map.introStart + 1}>
					<MapIntroScene timeline={T} title={mapDefaults.title} subtitle={mapDefaults.subtitle} />
				</Sequence>

				{/* ---- 5. map slam segments (reuses the existing MapSegment) ---- */}
				{T.mapSlams.map((m, i, all) => {
					const prev = all[i - 1];
					const next = all[i + 1];
					const joinsPrev = prev && Math.abs(prev.end - m.start) <= 1;
					const joinsNext = next && Math.abs(next.start - m.end) <= 1;
					return (
						<Sequence key={`slam${m.slam}-${i}`} name={`Map slam ${m.slam}`} from={m.start} durationInFrames={SLAM.duration}>
							<SlamFade fadeIn={joinsPrev ? 0 : FADE_FRAMES} fadeOut={joinsNext ? 0 : FADE_FRAMES}>
								<MapSegment {...mapDefaults} sfx={{whoosh: false, thud: false, stamp: sfx.stamp}} slam={m.slam} />
							</SlamFade>
						</Sequence>
					);
				})}
			</NeonPaletteProvider>

			{/* ---- 2. nine-ingredient board ---- */}
			<NineBoard timeline={T} />

			{/* ---- 4. pickup chips ---- */}
			{T.pickups.map((p) => (
				<PickupChip key={p.id} pickup={p} timeline={T} position={hudPosition} />
			))}

			{/* ---- 3. persistent dollar counter (always on top) ---- */}
			<DollarCounter timeline={T} position={hudPosition} />

			{/* ---- sound: mounted only if the file exists ---- */}
			{sfx.whoosh ? (
				<Sequence name="SFX tub outline" from={T.intro.thisProduct} durationInFrames={40}>
					<Audio src={staticFile(SFX_FILES.whoosh)} volume={sfxVolume * 0.6} />
				</Sequence>
			) : null}
			{sfx.tick
				? Array.from({length: Math.max(0, Math.floor((T.intro.countEnd - T.intro.costStart) / 2))}, (_, i) => (
						<Sequence key={`cnt${i}`} name={`SFX count tick ${i + 1}`} from={T.intro.costStart + i * 2} durationInFrames={6}>
							<Audio src={staticFile(SFX_FILES.tick)} volume={sfxVolume} />
						</Sequence>
					))
				: null}
			{sfx.stamp ? (
				<Sequence name="SFX $200 reached" from={T.intro.countEnd} durationInFrames={30}>
					<Audio src={staticFile(SFX_FILES.stamp)} volume={sfxVolume} />
				</Sequence>
			) : null}
			{sfx.thud ? (
				<>
					<Sequence name="SFX pixelate" from={T.intro.pixelStart} durationInFrames={20}>
						<Audio src={staticFile(SFX_FILES.thud)} volume={sfxVolume * 0.7} />
					</Sequence>
					<Sequence name="SFX cracks" from={T.intro.crackStart} durationInFrames={20}>
						<Audio src={staticFile(SFX_FILES.thud)} volume={sfxVolume} />
					</Sequence>
					<Sequence name="SFX crumble" from={T.intro.crumbleStart} durationInFrames={24}>
						<Audio src={staticFile(SFX_FILES.thud)} volume={sfxVolume} />
					</Sequence>
				</>
			) : null}
			{sfx.whoosh ? (
				<Sequence name="SFX whoosh" from={T.map.introStart} durationInFrames={60}>
					<Audio src={staticFile(SFX_FILES.whoosh)} volume={sfxVolume} />
				</Sequence>
			) : null}
			{sfx.thud
				? T.map.pinDrops.map((f, i) => (
						<Sequence key={`thud${i}`} name={`SFX thud ${i + 1}`} from={f + 5} durationInFrames={24}>
							<Audio src={staticFile(SFX_FILES.thud)} volume={sfxVolume} />
						</Sequence>
					))
				: null}
			{sfx.tick
				? tiles.map((f, i) => (
						<Sequence key={`tile${i}`} name={`SFX tick tile ${i + 1}`} from={Math.round(f)} durationInFrames={8}>
							<Audio src={staticFile(SFX_FILES.tick)} volume={sfxVolume} />
						</Sequence>
					))
				: null}
			{T.pickups.map((p, pi) => (
				<React.Fragment key={`snd${p.id}`}>
					{sfx.stamp ? (
						<Sequence name={`SFX chip landing ${p.id}`} from={p.landFrame} durationInFrames={30}>
							<Audio src={staticFile(SFX_FILES.stamp)} volume={sfxVolume} />
						</Sequence>
					) : null}
					{sfx.tick && TIMELINE.board.revealOnPickup ? (
						<Sequence name={`SFX tile reveal ${p.id}`} from={revealStartFrame(T, pi) + BOARD_REVEAL.revealAt} durationInFrames={8}>
							<Audio src={staticFile(SFX_FILES.tick)} volume={sfxVolume} />
						</Sequence>
					) : null}
					{sfx.tick ? (
						<Sequence name={`SFX counter roll ${p.id}`} from={p.landFrame + 3} durationInFrames={8}>
							<Audio src={staticFile(SFX_FILES.tick)} volume={sfxVolume} />
						</Sequence>
					) : null}
				</React.Fragment>
			))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
