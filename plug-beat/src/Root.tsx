import React from 'react';
import {Composition} from 'remotion';
import {
	PlugBeat,
	calculateMetadata,
	plugBeatDefaults,
	plugBeatSchema,
} from './PlugBeat';
import {
	MapSegment,
	mapCalculateMetadata,
	mapDefaults,
	mapSchema,
	type MapProps,
} from './MapSegment';
import {INTRO, MAP_CANVAS, SLAM} from './mapConfig';
import {Video1Overlay, video1CalculateMetadata, video1Defaults, video1Schema} from './video1/Video1Overlay';
import {FPS, TOTAL_FRAMES} from './video1/timeline';
import {CANVAS} from './theme';
import {ClipOverlay, clipCalculateMetadata, clipDefaults, clipSchema, type ClipProps} from './clips/ClipOverlay';
import {CLIPS, CLIP_ORDER, resolveClip, type ClipId} from './clips/clips';

// the 4 short clips: one transparent overlay composition each (1080x1920 design, 30 fps)
const clipComponents: Record<ClipId, React.FC<ClipProps>> = {
	BetaAlanine: (p) => <ClipOverlay {...p} clipId="BetaAlanine" />,
	Citrulline: (p) => <ClipOverlay {...p} clipId="Citrulline" />,
	AlphaGPC: (p) => <ClipOverlay {...p} clipId="AlphaGPC" />,
	TongkatAli: (p) => <ClipOverlay {...p} clipId="TongkatAli" />,
};

const MapIntro: React.FC<MapProps> = (p) => <MapSegment {...p} slam={0} />;
const MapSlam1: React.FC<MapProps> = (p) => <MapSegment {...p} slam={1} />;
const MapSlam2: React.FC<MapProps> = (p) => <MapSegment {...p} slam={2} />;
const MapSlam3: React.FC<MapProps> = (p) => <MapSegment {...p} slam={3} />;

const mapCommon = {
	fps: MAP_CANVAS.fps,
	width: MAP_CANVAS.width,
	height: MAP_CANVAS.height,
	schema: mapSchema,
	defaultProps: mapDefaults,
} as const;

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="PlugBeat"
				component={PlugBeat}
				durationInFrames={CANVAS.duration}
				fps={CANVAS.fps}
				width={CANVAS.width}
				height={CANVAS.height}
				schema={plugBeatSchema}
				defaultProps={plugBeatDefaults}
				calculateMetadata={calculateMetadata}
			/>

			{/* Master overlay synced to the voiceover of public/source.mp4 (56 s). Timings: src/video1/timeline.ts */}
			<Composition
				id="Video1Overlay"
				component={Video1Overlay}
				durationInFrames={TOTAL_FRAMES}
				fps={FPS}
				width={1080}
				height={1920}
				schema={video1Schema}
				defaultProps={video1Defaults}
				calculateMetadata={video1CalculateMetadata}
			/>

			{/* Ingredient clips 6-9: ClipBetaAlanine, ClipCitrulline, ClipAlphaGPC, ClipTongkatAli. Edit times/prices in src/clips/clips.ts */}
			{CLIP_ORDER.map((id) => (
				<Composition
					key={id}
					id={CLIPS[id].compositionId}
					component={clipComponents[id]}
					durationInFrames={resolveClip(id).durationInFrames}
					fps={30}
					width={1080}
					height={1920}
					schema={clipSchema}
					defaultProps={clipDefaults(id)}
					calculateMetadata={clipCalculateMetadata(id)}
				/>
			))}

			{/* Liquid-glass map overlay: 4 transparent segments to cut between footage */}
			<Composition
				id="MapIntro"
				component={MapIntro}
				durationInFrames={INTRO.duration}
				calculateMetadata={mapCalculateMetadata(INTRO.duration)}
				{...mapCommon}
			/>
			<Composition
				id="MapSlam1"
				component={MapSlam1}
				durationInFrames={SLAM.duration}
				calculateMetadata={mapCalculateMetadata(SLAM.duration)}
				{...mapCommon}
			/>
			<Composition
				id="MapSlam2"
				component={MapSlam2}
				durationInFrames={SLAM.duration}
				calculateMetadata={mapCalculateMetadata(SLAM.duration)}
				{...mapCommon}
			/>
			<Composition
				id="MapSlam3"
				component={MapSlam3}
				durationInFrames={SLAM.duration}
				calculateMetadata={mapCalculateMetadata(SLAM.duration)}
				{...mapCommon}
			/>
		</>
	);
};
