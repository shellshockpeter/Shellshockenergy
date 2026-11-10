/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import {existsSync} from 'node:fs';
import path from 'node:path';
import {Config} from '@remotion/cli/config';

Config.setRspack(true);
// PNG frames are required to keep the alpha channel (JPEG has none).
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Sound effects are optional: warn (don't crash) if they're missing.
for (const file of ['tick.mp3', 'stamp.mp3']) {
	if (!existsSync(path.join(process.cwd(), 'public', 'sfx', file))) {
		console.warn(
			`[PlugBeat] TODO: add public/sfx/${file} — that sound will be skipped (render stays silent).`,
		);
	}
}
