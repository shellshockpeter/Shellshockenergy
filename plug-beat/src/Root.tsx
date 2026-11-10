import React from 'react';
import {Composition} from 'remotion';
import {
	PlugBeat,
	calculateMetadata,
	plugBeatDefaults,
	plugBeatSchema,
} from './PlugBeat';
import {CANVAS} from './theme';

export const RemotionRoot: React.FC = () => {
	return (
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
	);
};
