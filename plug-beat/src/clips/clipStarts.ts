/**
 * WHERE EACH CLIP SITS INSIDE YOUR MAIN VIDEO (the A57BF0BA... file), in seconds from the start of that FILE.
 * This is the time shown in Studio's timeline for the trimmed file = "the clip's own 0:00 is at this second of the video".
 * (It can be negative if your video only uses the later part of a clip.)
 *
 * ⚠ These are PLACEHOLDERS (clips laid back to back after the 5th ingredient). Replace them either:
 *   - automatically:  npm run locate-clips        (finds each clip in your video by matching the picture; overwrites this file)
 *   - or by hand: type the real numbers below and set CLIP_STARTS_ARE_PLACEHOLDERS = false.
 */
import type {ClipId} from './clips';

export const CLIP_STARTS_ARE_PLACEHOLDERS = true;

export const CLIP_STARTS: Record<ClipId, number> = {
	BetaAlanine: 53.0,
	Citrulline: 59.0,
	AlphaGPC: 63.87,
	TongkatAli: 69.87,
};
