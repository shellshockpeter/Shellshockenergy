/**
 * ============================================================================
 *  CLIPS — everything you may want to edit for the 4 short clips lives here.
 *  Times are SECONDS INSIDE EACH CLIP. Prices in dollars.
 *
 *  Each clip has ONE pickup. When the pickup happens the PickupChip pops, flies to the counter in 0.5 s, and the
 *  counter starts rolling the moment the chip lands (roll starts = pickup + 0.5 s, shown in clips-sync-report.md).
 *
 *  startTotal = the running total BEFORE the clip. Chain them: each clip's startTotal should equal the previous
 *  clip's end total. The console + clips-sync-report.md print the running total after every clip and warn if the
 *  chain is broken. (Every startTotal can also be overridden live in Studio via the `startTotal` prop.)
 *
 *  ⚠ The chain below starts from $75.16 = the total at the end of Video 1 (5 ingredients found). That total
 *    still includes the PLACEHOLDER Lion's Mane price ($31.49) from src/video1/timeline.ts: if you change that
 *    price, update startTotal of ClipBetaAlanine to match (and the rest of the chain follows the warnings).
 * ============================================================================
 */
import {CHIP, DEFAULT_SYNC_OFFSET_FRAMES, FPS, type Pickup, type ResolvedTimeline} from '../video1/timeline';

export {DEFAULT_SYNC_OFFSET_FRAMES};

/** Money the viewer started the whole video with (cash bar + "LEFT" + "OVER $200"). */
export const CASH_START = 200;
/** n/9 */
export const TOTAL_ITEMS = 9;

export type ClipId = 'BetaAlanine' | 'Citrulline' | 'AlphaGPC' | 'TongkatAli';

export type ClipConfig = {
	/** Remotion composition id */
	compositionId: string;
	title: string;
	/** file in public/clips/ (shown under the graphics when preview=true) */
	file: string;
	/** clip length in seconds */
	durationSeconds: number;
	/** the `extended` prop switches the clip to this length (so the finale has room to play) */
	extendedSeconds?: number;
	/** running total BEFORE this clip */
	startTotal: number;
	/** which ingredient this is: 6 means the counter starts at 5/9 and turns into 6/9 */
	itemNumber: number;
	ingredient: string;
	price: number;
	/** seconds into the clip when the item is picked up (the chip pops now, the counter rolls 0.5 s later) */
	pickupAt: number;
	/** where the chip pops (1080x1920 frame, centre). Default y 1500 = below every label / price tag in these clips */
	chipAt?: {x: number; y: number};
	/** last ingredient: 9/9 gold burst + glow pulse, plus the OVER badge / SHORT label if the total passes the budget */
	finale?: boolean;
};

export const CLIP_ORDER: ClipId[] = ['BetaAlanine', 'Citrulline', 'AlphaGPC', 'TongkatAli'];

export const CLIPS: Record<ClipId, ClipConfig> = {
	BetaAlanine: {
		compositionId: 'ClipBetaAlanine',
		title: 'Beta-Alanine',
		file: '01_beta-alanine_6s.mp4',
		durationSeconds: 6.0,
		startTotal: 75.16,
		itemNumber: 6,
		ingredient: 'BETA-ALANINE',
		price: 24.99,
		pickupAt: 3.4, // counter rolls at 3.9
		chipAt: {x: 540, y: 1500},
	},
	Citrulline: {
		compositionId: 'ClipCitrulline',
		title: 'L-Citrulline',
		file: '02_l-citrulline_from-10s.mp4',
		durationSeconds: 4.87,
		startTotal: 100.15,
		itemNumber: 7,
		ingredient: 'L-CITRULLINE',
		price: 27.99,
		pickupAt: 1.3, // counter rolls at 1.8
		chipAt: {x: 540, y: 1500},
	},
	AlphaGPC: {
		compositionId: 'ClipAlphaGPC',
		title: 'Alpha GPC',
		file: '03_alpha-gpc_6s.mp4',
		durationSeconds: 6.0,
		startTotal: 128.14,
		itemNumber: 8,
		ingredient: 'ALPHA GPC',
		price: 19.99,
		pickupAt: 4.0, // counter rolls at 4.5
		chipAt: {x: 540, y: 1500},
	},
	TongkatAli: {
		compositionId: 'ClipTongkatAli',
		title: 'Tongkat Ali',
		file: '04_tongkat-ali_6s.mp4',
		durationSeconds: 6.0,
		extendedSeconds: 7.5, // turn on the `extended` prop for 7.5 s
		startTotal: 148.13,
		itemNumber: 9,
		ingredient: 'TONGKAT ALI',
		price: 49.99,
		pickupAt: 5.0, // counter rolls at 5.5 -> 9/9 finale
		chipAt: {x: 540, y: 1500},
		finale: true,
	},
};

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

/** Same as Pickup, re-exported so editors see the shape the chip expects. */
export type ClipPickup = Pickup;
