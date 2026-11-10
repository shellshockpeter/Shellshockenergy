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
import {CANVAS} from './theme';

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
