import {useEffect, useState} from 'react';
import {staticFile, useDelayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */
export const COLORS = {
	black: '#0A0A0A',
	green: '#39FF14',
	white: '#FFFFFF',
	silver: '#C9CED6',
	silverDim: 'rgba(201, 206, 214, 0.62)',
} as const;

/** `rgba()` helper for the neon green accent. */
export const green = (alpha: number) => `rgba(57, 255, 20, ${alpha})`;

/* ------------------------------------------------------------------ */
/* Canvas + social-app safe zones (px, 1080x1920)                      */
/* ------------------------------------------------------------------ */
export const CANVAS = {width: 1080, height: 1920, fps: 30, duration: 240} as const;

export const SAFE = {left: 80, right: 80, top: 150, bottom: 250} as const;

/**
 * Panels are 880px wide and centred (100px side gutter) so a small spring
 * overshoot still stays inside the 80px side safe zone.
 */
export const PANEL = {
	width: 880,
	left: (CANVAS.width - 880) / 2,
	radius: 32,
} as const;

/* ------------------------------------------------------------------ */
/* Timeline (global frames) — one place to tweak the beat sheet        */
/* ------------------------------------------------------------------ */
export const TIMING = {
	card: {start: 30, end: 195, exitFrames: 15},
	chip: {
		start: 105,
		end: 195,
		exitFrames: 15,
		shakeFrames: 6,
		/** local frame (inside the chip Sequence) the first letter starts flipping */
		flipStart: 5,
		/** frames between letters */
		flipStagger: 3,
		flipDuration: 8,
		/** local frame the checkmark starts drawing (≈ global 137, right after the last letter lands) */
		checkStart: 32,
		checkDuration: 12,
		pulseStart: 46,
		pulseLength: 13,
		pulses: 2,
	},
} as const;

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */
export const DISPLAY_FONT = 'Robot Reavers';

const inter = loadInter('normal', {
	weights: ['400', '600', '700'],
	subsets: ['latin'],
});
export const BODY_FONT = `${inter.fontFamily}, system-ui, sans-serif`;
export const BODY_FONT_FAMILY = inter.fontFamily;

const displayFontLoaded = loadFont({
	family: DISPLAY_FONT,
	url: staticFile('fonts/RobotReavers.otf'),
});

/**
 * Returns true once both fonts are loaded. Holds the render (delayRender)
 * until then, so text measuring (fitText) and the final frame always use the
 * real glyphs.
 */
export const useFontsReady = (): boolean => {
	const {delayRender, continueRender} = useDelayRender();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const handle = delayRender('Loading ShellShock fonts');
		Promise.all([displayFontLoaded, inter.waitUntilDone()])
			.catch((err) => console.warn('[PlugBeat] Font failed to load:', err))
			.finally(() => {
				setReady(true);
				continueRender(handle);
			});
	}, [delayRender, continueRender]);

	return ready;
};
