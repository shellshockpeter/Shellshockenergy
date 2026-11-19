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

/**
 * THE CONCLUSION VIDEO (appended after the 4 clips): public/IMG_4503.mov (or .MOV/.mp4, loose in public/ or public/clips/).
 * Its length is read from the file. Times below are in seconds from the START of that video.
 */
export const CONCLUSION_BASENAME = 'IMG_4503';
export const CONCLUSION_EXTENSIONS = ['mov', 'MOV', 'mp4', 'MP4', 'm4v'];
/** the finished 9-ingredient board pops up from 11 s to 14 s */
export const CONCLUSION_BOARD = {from: 11, to: 14};
/** "TOTAL SPENT" card pops in this many seconds after the conclusion starts */
export const CONCLUSION_SPENT_AT = 0.3;
/** the PlugBeat overlay (SHOCK20 tub card + coupon chip) plays from 17 s to 23 s of the conclusion video.
 *  PlugBeat's own first 30 frames are empty, so it starts `leadFrames` early and its tub card appears right at 17 s. */
export const CONCLUSION_PLUGBEAT = {from: 17, to: 23, leadFrames: 30};
/** used only if the browser can't read the .mov's length */
export const CONCLUSION_FALLBACK_SECONDS = 24;
