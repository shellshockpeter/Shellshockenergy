/** Logic for the standalone Clip... compositions (kept out of clips.ts so that file stays pure data). */
import {CHIP, DEFAULT_SYNC_OFFSET_FRAMES, FPS, type ResolvedTimeline} from '../video1/timeline';
import {CASH_START, CLIPS, CLIP_ORDER, type ClipId} from './clips';

export {DEFAULT_SYNC_OFFSET_FRAMES};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Everything a composition needs, with syncOffsetFrames applied (graphics land that many frames BEFORE the pickup). */
export const resolveClip = (
	id: ClipId,
	opts: {syncOffsetFrames?: number; startTotal?: number; extended?: boolean} = {},
) => {
	const cfg = CLIPS[id];
	const offset = opts.syncOffsetFrames ?? DEFAULT_SYNC_OFFSET_FRAMES;
	const startTotal = opts.startTotal ?? cfg.startTotal;
	const atFrame = Math.round(cfg.pickupAt * FPS) + offset;
	const landFrame = atFrame + CHIP.landFrames; // = roll start = pickup + 0.5 s
	const pickup: ResolvedTimeline['pickups'][number] = {
		id: cfg.itemNumber,
		name: cfg.ingredient,
		price: cfg.price,
		at: cfg.pickupAt,
		chipAt: cfg.chipAt,
		atFrame,
		landFrame,
		totalBefore: startTotal,
		totalAfter: round2(startTotal + cfg.price),
	};
	const seconds = opts.extended && cfg.extendedSeconds ? cfg.extendedSeconds : cfg.durationSeconds;
	return {
		cfg,
		offset,
		pickup,
		durationInFrames: Math.round(seconds * FPS),
		// the slice of a timeline the counter + chip read: HUD is already on screen at frame 0, no drain emphasis, no map slams
		hud: {enter: -1000, drainStart: -1000, drainEnd: -900, avoidMapSlams: false},
		pickups: [pickup],
		totalPulse: -1000,
		mapSlams: [] as ResolvedTimeline['mapSlams'],
	};
};

export type ResolvedClip = ReturnType<typeof resolveClip>;

/** Running totals after every clip (using each clip's own startTotal) + warnings when the chain is broken. */
export const clipChain = (overrides: Partial<Record<ClipId, number>> = {}) => {
	const rows: {id: ClipId; title: string; start: number; price: number; end: number; left: number; item: number}[] = [];
	const warnings: string[] = [];
	for (const id of CLIP_ORDER) {
		const cfg = CLIPS[id];
		const start = overrides[id] ?? cfg.startTotal;
		const end = round2(start + cfg.price);
		const prev = rows[rows.length - 1];
		if (prev && Math.abs(prev.end - start) > 0.005) {
			warnings.push(`${cfg.title}: startTotal $${start.toFixed(2)} != end of ${prev.title} ($${prev.end.toFixed(2)}). Chain them, or this clip's counter will jump.`);
		}
		rows.push({id, title: cfg.title, start, price: cfg.price, end, left: round2(CASH_START - end), item: cfg.itemNumber});
		if (end > CASH_START) warnings.push(`${cfg.title}: total $${end.toFixed(2)} is over the $${CASH_START} budget (counter shows SHORT $${(end - CASH_START).toFixed(2)}).`);
	}
	return {rows, warnings};
};
