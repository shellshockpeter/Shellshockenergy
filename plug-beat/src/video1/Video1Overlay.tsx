import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {z} from 'zod';
import {SLAM} from '../mapConfig';
import {MapSegment, mapDefaults} from '../MapSegment';
import {NeonPaletteProvider} from '../NeonText';
import {fileExists, detectSfx} from '../sfx';
import {DollarCounter, hudTarget} from './DollarCounter';
import {MapIntroScene} from './MapIntroScene';
import {NineBoard, tileStartFrames} from './NineBoard';
import {PickupChip} from './PickupChip';
import {BOARD_REVEAL, TIMELINE, TOTAL_FRAMES, DEFAULT_SYNC_OFFSET_FRAMES, resolveTimeline, validateTimeline} from './timeline';

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
	/** Auto-detected from public/ — leave as-is. */
	sfx: z.object({whoosh: z.boolean(), thud: z.boolean(), tick: z.boolean(), stamp: z.boolean()}),
	hasSource: z.boolean(),
});
export type Video1Props = z.infer<typeof video1Schema>;

export const video1Defaults: Video1Props = {
	preview: true,
	syncOffsetFrames: DEFAULT_SYNC_OFFSET_FRAMES,
	hudPosition: 'top',
	mapTextColor: 'gold',
	sfxVolume: 0.8,
	sfx: {whoosh: false, thud: false, tick: false, stamp: false},
	hasSource: false,
};

const SFX_FILES = {
	whoosh: 'sfx/whoosh.mp3',
	thud: 'sfx/thud.mp3',
	tick: 'sfx/tick.mp3',
	stamp: 'sfx/stamp.mp3',
} as const;
const SOURCE = 'source.mp4';

export const video1CalculateMetadata = async ({props}: {props: Video1Props}) => {
	const [sfx, hasSource] = await Promise.all([
		detectSfx('Video1', SFX_FILES),
		props.preview ? fileExists(SOURCE) : Promise.resolve(false),
	]);
	if (props.preview && !hasSource) {
		console.warn(`[Video1] TODO: put your video at public/${SOURCE} — preview is showing graphics only.`);
	}
	for (const w of validateTimeline(resolveTimeline(props.syncOffsetFrames))) console.warn(`[Video1] ⚠ ${w}`);
	return {durationInFrames: TOTAL_FRAMES, props: {...props, sfx: sfx as Video1Props['sfx'], hasSource}};
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
export const Video1Overlay: React.FC<Video1Props> = ({preview, syncOffsetFrames, hudPosition, mapTextColor, sfxVolume, sfx, hasSource}) => {
	const T = resolveTimeline(syncOffsetFrames);
	const target = hudTarget(hudPosition);
	const tiles = tileStartFrames(T);

	return (
		<AbsoluteFill>
			{/* ---- preview video (off for the real alpha render) ---- */}
			{preview && hasSource ? (
				<AbsoluteFill>
					<OffthreadVideo src={staticFile(SOURCE)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				</AbsoluteFill>
			) : null}
			{preview && !hasSource ? (
				<div style={{position: 'absolute', left: 80, right: 80, top: 160, textAlign: 'center', fontFamily: 'sans-serif', fontSize: 26, color: '#FFD60A', background: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12}}>
					public/source.mp4 not found — showing graphics only
				</div>
			) : null}

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
				<PickupChip key={p.id} pickup={p} target={target} />
			))}

			{/* ---- 3. persistent dollar counter (always on top) ---- */}
			<DollarCounter timeline={T} position={hudPosition} />

			{/* ---- sound: mounted only if the file exists ---- */}
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
			{T.pickups.map((p) => (
				<React.Fragment key={`snd${p.id}`}>
					{sfx.stamp ? (
						<Sequence name={`SFX chip landing ${p.id}`} from={p.landFrame} durationInFrames={30}>
							<Audio src={staticFile(SFX_FILES.stamp)} volume={sfxVolume} />
						</Sequence>
					) : null}
					{sfx.tick && TIMELINE.board.revealOnPickup ? (
						<Sequence name={`SFX tile reveal ${p.id}`} from={p.atFrame + BOARD_REVEAL.revealAt} durationInFrames={8}>
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
	);
};
