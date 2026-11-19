/**
 * HOW THE 4 CLIPS ARE COMBINED WITH YOUR MAIN VIDEO (pure data/logic, no imports except clips.ts).
 *
 * Video1Overlay plays ONE continuous video:
 *     [ your main video (A57BF0BA....MP4) ]  ->  beta-alanine  ->  L-citrulline  ->  alpha GPC  ->  tongkat ali
 * Each clip starts right after the previous one. The overlay (counter, chips, ingredient board, finale) runs across all of it.
 * The main video's length is read from the file automatically; DEFAULT_MAIN_SECONDS is only used by scripts / until it is read.
 */
import {CLIPS, CLIP_ORDER, type ClipId} from './clips';

const FPS = 30;

/** Seconds of "nothing" between the main video and the first clip, and between clips. 0 = hard cuts. */
export const CLIP_GAP_SECONDS = 0;

/** Length of the main video (the trimmed A57BF0BA file) when it can't be read (sync-report script). */
export const DEFAULT_MAIN_SECONDS = 55;

export type ClipSlot = {id: ClipId; startFrame: number; frames: number; startSeconds: number};

/** Where each clip sits in the combined video (frames/seconds from the start of the combined video). */
export const clipLayout = (mainSeconds: number): Record<ClipId, ClipSlot> => {
	const gap = Math.round(CLIP_GAP_SECONDS * FPS);
	let cursor = Math.round(mainSeconds * FPS) + gap;
	const out = {} as Record<ClipId, ClipSlot>;
	for (const id of CLIP_ORDER) {
		const frames = Math.round(CLIPS[id].durationSeconds * FPS);
		out[id] = {id, startFrame: cursor, frames, startSeconds: cursor / FPS};
		cursor += frames + gap;
	}
	return out;
};

/** Total frames of the 4 clips (+ gaps). */
export const clipsTotalFrames = (): number => {
	const gap = Math.round(CLIP_GAP_SECONDS * FPS);
	return CLIP_ORDER.reduce((sum, id) => sum + Math.round(CLIPS[id].durationSeconds * FPS) + gap, 0);
};
