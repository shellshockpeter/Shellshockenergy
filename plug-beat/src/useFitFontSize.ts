import {useMemo} from 'react';
import {fitText} from '@remotion/layout-utils';
import {useFontsReady} from './theme';

type Options = {
	text: string | string[];
	fontFamily: string;
	maxWidth: number;
	maxFontSize: number;
	minFontSize?: number;
	letterSpacing?: string;
	fontWeight?: number | string;
};

/**
 * Largest font size (<= maxFontSize) at which every line fits in maxWidth.
 * Keeps editable props (price, code, brand...) from overflowing their boxes.
 */
export const useFitFontSize = ({
	text,
	fontFamily,
	maxWidth,
	maxFontSize,
	minFontSize = 12,
	letterSpacing,
	fontWeight,
}: Options): number => {
	const ready = useFontsReady();
	const lines = Array.isArray(text) ? text : [text];
	const key = lines.join('\n');

	return useMemo(() => {
		if (!ready) return maxFontSize;
		try {
			const sizes = key.split('\n').map(
				(line) =>
					fitText({
						text: line,
						withinWidth: maxWidth,
						fontFamily,
						letterSpacing,
						fontWeight,
					}).fontSize,
			);
			return Math.max(minFontSize, Math.min(maxFontSize, ...sizes));
		} catch (err) {
			console.warn('[PlugBeat] fitText failed, using max size', err);
			return maxFontSize;
		}
	}, [ready, key, fontFamily, maxWidth, maxFontSize, minFontSize, letterSpacing, fontWeight]);
};
