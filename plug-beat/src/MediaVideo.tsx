import React from 'react';
import {OffthreadVideo, useRemotionEnvironment} from 'remotion';
import {Video} from '@remotion/media';

/**
 * Full-frame background video that works everywhere:
 *  - Studio preview + normal (server) render: <OffthreadVideo> (reliable with phone footage / HEVC .mov)
 *  - Studio's "render in browser" (client-side): <Video> from @remotion/media, the only one that mode supports
 */
export const MediaVideo: React.FC<{src: string; volume?: number; trimBefore?: number}> = ({src, volume = 1, trimBefore}) => {
	const env = useRemotionEnvironment();
	if (env.isClientSideRendering) {
		return <Video src={src} volume={volume} trimBefore={trimBefore} objectFit="cover" style={{width: '100%', height: '100%'}} />;
	}
	return <OffthreadVideo src={src} volume={volume} trimBefore={trimBefore} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
};
