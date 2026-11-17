/**
 * TUB TRACK — where the tub is in YOUR footage, frame by frame (keyframes).
 * The golden outline follows these keyframes for as long as it is on screen.
 *
 * All numbers are in the 1080x1920 composition frame (NOT your 1440x2560 file):
 *   frames  video frame numbers (= composition frames; the footage is already trimmed). Must increase.
 *   x, y    centre of the tub (px)
 *   w, h    width / height of a box drawn tightly around the tub (px)
 *   rotate  optional tilt in degrees (omit to keep it upright)
 *   quad    optional (written by the auto tracker): 8 arrays = x0,y0,x1,y1,x2,y2,x3,y3 of the tub's corners, one value per frame
 *
 * Fill it in one of two ways:
 *   1) AUTOMATIC:  python3 scripts/track_tub.py --start 1.0 --end 6.0
 *        Finds the tub's printed label in every frame and writes `quad`: the tub's 4 corners per frame
 *        (top-left, top-right, bottom-right, bottom-left) so the outline is warped onto the tub: position + rotation + perspective.
 *      (`python3 scripts/track_tub.py --mode box --select` follows a drawn box instead: position + size only.)
 *   2) BY HAND:    a few keyframes are enough, the outline glides between them, e.g.
 *        frames: [40, 90, 150], x: [540, 600, 520], y: [1150, 1100, 1180], w: [420, 440, 400], h: [540, 560, 520]
 * Empty arrays = no track: the outline uses the static tubX / tubY / tubW / tubRotate props from Studio.
 *
 * (The keyframes are NOT shifted by syncOffsetFrames: a position belongs to one specific video frame.)
 */
export type TubTrack = {
	frames: number[];
	x: number[];
	y: number[];
	w: number[];
	h: number[];
	rotate?: number[];
	quad?: number[][];
};

export const TUB_TRACK: TubTrack = {
	frames: [],
	x: [],
	y: [],
	w: [],
	h: [],
};
