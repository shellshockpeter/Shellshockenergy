/**
 * ============================================================================
 *  VIDEO 1 — SINGLE SOURCE OF TRUTH
 *  Every time below is in SOURCE-VIDEO SECONDS (your transcript timestamps), even after cuts.
 *  Cuts (see CUTS) are removed from the footage and everything after them slides earlier automatically.
 *  Nothing else in the project hard-codes a time. Edit here; everything re-syncs.
 *
 *  syncOffsetFrames (a composition prop, default -2) is added to EVERY event so graphics
 *  land 2 frames BEFORE the spoken word. It is applied in resolveTimeline() below.
 * ============================================================================
 */
import {SLAM} from '../mapConfig';

export const FPS = 30;
/** Length of the SOURCE video: 56 s */
export const SOURCE_FRAMES = 1680;

/**
 * CUTS — seconds of the source video that are REMOVED (source-video time, before shifting).
 * Everything after a cut plays earlier by its length; keep all event times below as source-video times.
 */
export const CUTS: {start: number; end: number}[] = [
	{start: 32.0, end: 33.0}, // 1 s removed -> video is 55 s / 1650 frames
];

/**
 * true  = the file in public/ is ALREADY trimmed (you cut it in your editor): the footage plays straight,
 *         and CUTS only shift the graphics' timing so they stay in sync with the trimmed file.
 * false = the file is the original: the composition removes the CUTS from the footage itself.
 */
export const VIDEO_IS_ALREADY_TRIMMED = true;

/** source-video seconds -> output-video seconds (events inside a cut snap to the cut point) */
export const toOutputSeconds = (t: number): number => {
	let out = t;
	for (const c of CUTS) {
		if (t >= c.end) out -= c.end - c.start;
		else if (t > c.start) out -= t - c.start;
	}
	return out;
};

/** The pieces of the source video that survive the cuts: [fromSec, toSec) in source time. */
export const keptRanges = (): {from: number; to: number}[] => {
	const sorted = [...CUTS].sort((a, b) => a.start - b.start);
	const ranges: {from: number; to: number}[] = [];
	let cursor = 0;
	for (const c of sorted) {
		if (c.start > cursor) ranges.push({from: cursor, to: c.start});
		cursor = Math.max(cursor, c.end);
	}
	if (cursor < SOURCE_FRAMES / FPS) ranges.push({from: cursor, to: SOURCE_FRAMES / FPS});
	return ranges;
};

/** Composition length after the cuts */
export const TOTAL_FRAMES = SOURCE_FRAMES - Math.round(CUTS.reduce((sum, c) => sum + (c.end - c.start), 0) * FPS);
export const DEFAULT_SYNC_OFFSET_FRAMES = -2;

/** Money the viewer starts with — drives "$xx.xx LEFT" and the header "$200". */
export const BUDGET = 200;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type Pickup = {
	id: number;
	/** shown on the chip + counter (UPPERCASE) */
	name: string;
	/** dollars. ⚠ easy to change — this is the only place a price lives. */
	price: number;
	/** seconds: the moment the item is picked up on camera */
	at: number;
	/** where the chip pops (screen px, centre). Default: centre-lower third. */
	chipAt?: {x: number; y: number};
	note?: string;
};

export type TileIcon = 'hex' | 'drop' | 'mushroom' | 'sun' | 'bolt' | 'wave' | 'triangle' | 'ring' | 'diamond';

export type BoardTile = {
	/** shown only when this ingredient is found (briefly) — or permanently if `revealed` is true */
	name?: string;
	/** default false: the tile stays a blurred "???" on the board. Set true to un-blur it for good. */
	revealed?: boolean;
	icon: TileIcon;
	/** off by default — nothing says "organic" unless you turn it on for a tile */
	organic?: boolean;
};

/* ------------------------------------------------------------------ */
/* THE TIMELINE (seconds)                                              */
/* ------------------------------------------------------------------ */
export const TIMELINE = {
	/** Map intro: "three different locations" */
	map: {
		introStart: 10.4,
		/** the spin-in is shortened so the map is settled at HOME before pin 1 drops (10.40 + 1.0 = 11.40) */
		spinSeconds: 1.0,
		pinDrops: [11.52, 11.84, 12.2] as const,
		routeDraw: {start: 12.3, end: 12.8},
		exit: {start: 12.9, end: 13.2},
	},

	/** 9-ingredient overhead board */
	board: {
		firstTilePop: 13.24, // the word "nine"
		tileStagger: 0.08,
		finalPulse: 13.8, // the word "ingredients"
		exit: {start: 14.5, end: 14.8},
		/** true: when an ingredient is found the board pops back up briefly; that tile reveals itself and stays uncovered (with all earlier finds) */
		revealOnPickup: true,
	},

	/** Persistent dollar counter */
	hud: {
		enter: 15.36, // "two hundred dollars"
		cashDrainEmphasis: {start: 17.6, end: 18.0}, // "how quickly it disappears"
		/** true: the counter glides to the bottom while a map slam is on screen so it never hides the slamming pin */
		avoidMapSlams: true,
	},

	/** Running-total glow pulse. Warns in the console if the total isn't 70–72 here. */
	totalPulse: 35.04, // "seventy one dollars"

	/** Pickups, IN ORDER. The counter rolls when each chip lands (at + 0.5 s). */
	pickups: [
		{id: 1, name: 'L-TYROSINE', price: 13.79, at: 23.5},
		{id: 2, name: 'TAURINE', price: 6.89, at: 26.9, note: 'shelf tag on camera'},
		{id: 3, name: 'CORDYCEPS', price: 18.99, at: 29.2, note: 'tag on camera'},
		{
			id: 4,
			name: "LION'S MANE",
			price: 31.49, // ⚠ PLACEHOLDER — footage shows the 365 bottle with an $18.99 tag. Change the price here only.
			at: 33.0,
		},

		{id: 5, name: 'CAFFEINE', price: 4.0, at: 49.11, note: 'energy drink held up (CVS)'},

		// ┌──────────────────────────────────────────────────────────────────┐
		// │  ADD LATER — uncomment / fill in (nothing else needs to change)  │
		// │  Vitamin Shoppe:   { id: 6, name: 'BETA-ALANINE',  price: 0, at: 0 },
		// │                    { id: 7, name: 'CITRULLINE',    price: 0, at: 0 },
		// │                    { id: 8, name: 'ALPHA GPC',     price: 0, at: 0 },
		// │                    { id: 9, name: 'TONGKAT ALI',   price: 0, at: 0 },
		// └──────────────────────────────────────────────────────────────────┘
	] as Pickup[],

	/**
	 * Map slam segments. Each starts at `segmentStart`; the impact lands 30 frames (1.0 s) later,
	 * the segment runs 90 frames. slam: 1 = Whole Foods, 2 = CVS, 3 = Vitamin Shoppe.
	 */
	mapSlams: [
		// segmentStart 39.96 -> impact 40.96 (the word "stop" in "first stop") -> ends 42.96
		{slam: 1, segmentStart: 39.96},

		// segmentStart 49.00 -> impact 50.00 (the words "5th ingredient was secured") -> ends 52.00. Pin 2 (CVS) slams.
		{slam: 2, segmentStart: 49.0},

		// ┌──────────────────────────────────────────────────────────────────┐
		// │  ADD LATER:                                                      │
		// │  {slam: 3, segmentStart: 0},   // Vitamin Shoppe                 │
		// └──────────────────────────────────────────────────────────────────┘
	] as {slam: 1 | 2 | 3; segmentStart: number}[],
};

/* ------------------------------------------------------------------ */
/* Board tiles (order = pickup order). ALL tiles are blurred "???" on    */
/* the board; a tile reveals itself briefly when its pickup is found.   */
/* ------------------------------------------------------------------ */
export const BOARD_TILES: BoardTile[] = [
	{name: 'L-TYROSINE', icon: 'hex'},
	{name: 'TAURINE', icon: 'drop'},
	{name: 'CORDYCEPS', icon: 'mushroom'},
	{name: "LION'S MANE", icon: 'sun'},
	// Tiles 5-9: add a name now or later (e.g. {name: 'CAFFEINE', icon: 'bolt'}); if you leave it out, the pickup's own name is used on reveal.
	{name: 'CAFFEINE', icon: 'bolt'}, // 5  CVS (blurred on the board until it's found)
	{icon: 'wave'}, // 6  beta-alanine
	{icon: 'triangle'}, // 7  citrulline
	{icon: 'ring'}, // 8  alpha GPC
	{icon: 'diamond'}, // 9  tongkat ali
];

/* ------------------------------------------------------------------ */
/* Chip / counter mechanics                                            */
/* ------------------------------------------------------------------ */
/** pop 0–5, fly 6–14, land at frame 15 (= pickup + 0.5 s). defaultAt = chip start; override per pickup with `chipAt` to sit beside the real product/tag. */
export const CHIP = {popFrames: 6, flightFrames: 9, landFrames: 15, defaultAt: {x: 540, y: 1235}} as const;
/**
 * Board pop-up when an ingredient is found (frames relative to the pickup frame).
 * The found tile un-blurs and STAYS revealed (✓) in every later pop-up; earlier finds are already uncovered.
 */
export const BOARD_REVEAL = {revealAt: 4, revealRamp: 5, bumpFrames: 16, exitStart: 34, exitEnd: 42} as const;
/** counter digit roll length (≈0.5 s) */
export const ROLL_FRAMES = 15;

/* ------------------------------------------------------------------ */
/* Resolver: seconds -> frames, with syncOffsetFrames applied          */
/* ------------------------------------------------------------------ */
export const resolveTimeline = (offset: number = DEFAULT_SYNC_OFFSET_FRAMES) => {
	const fr = (s: number) => Math.round(toOutputSeconds(s) * FPS) + offset;
	const T = TIMELINE;

	let running = 0;
	const pickups = T.pickups.map((p) => {
		const atFrame = fr(p.at);
		const landFrame = atFrame + CHIP.landFrames;
		const from = running;
		running = Math.round((running + p.price) * 100) / 100;
		return {...p, atFrame, landFrame, totalBefore: from, totalAfter: running};
	});

	return {
		offset,
		map: {
			introStart: fr(T.map.introStart),
			spinFrames: Math.round(T.map.spinSeconds * FPS),
			pinDrops: T.map.pinDrops.map(fr),
			routeStart: fr(T.map.routeDraw.start),
			routeEnd: fr(T.map.routeDraw.end),
			exitStart: fr(T.map.exit.start),
			exitEnd: fr(T.map.exit.end),
		},
		board: {
			firstTilePop: fr(T.board.firstTilePop),
			/** float frames between tiles (0.08 s = 2.4 frames) */
			tileStagger: T.board.tileStagger * FPS,
			finalPulse: fr(T.board.finalPulse),
			exitStart: fr(T.board.exit.start),
			exitEnd: fr(T.board.exit.end),
		},
		hud: {
			enter: fr(T.hud.enter),
			drainStart: fr(T.hud.cashDrainEmphasis.start),
			drainEnd: fr(T.hud.cashDrainEmphasis.end),
			avoidMapSlams: T.hud.avoidMapSlams,
		},
		pickups,
		totalPulse: fr(T.totalPulse),
		mapSlams: T.mapSlams.map((m) => {
			const start = fr(m.segmentStart);
			return {slam: m.slam, start, impact: start + SLAM.slamFrame, end: start + SLAM.duration};
		}),
	};
};

export type ResolvedTimeline = ReturnType<typeof resolveTimeline>;

/** Counter total (dollars) at `frame`, counting every pickup whose chip has landed. */
export const totalAtFrame = (t: ResolvedTimeline, frame: number): number => {
	let total = 0;
	for (const p of t.pickups) if (p.landFrame <= frame) total = p.totalAfter;
	return total;
};

/** Console warnings for common timeline mistakes (called from calculateMetadata and the sync report). */
export const validateTimeline = (t: ResolvedTimeline): string[] => {
	const warnings: string[] = [];
	for (let i = 1; i < t.pickups.length; i++) {
		if (t.pickups[i].at <= t.pickups[i - 1].at) {
			warnings.push(`pickups must be in time order: "${t.pickups[i].name}" (${t.pickups[i].at}s) is not after "${t.pickups[i - 1].name}".`);
		}
	}
	const total = totalAtFrame(t, t.totalPulse);
	if (total < 70 || total > 72) {
		warnings.push(`running total at totalPulse (${TIMELINE.totalPulse}s) is $${total.toFixed(2)} — expected between $70 and $72.`);
	}
	const last = t.pickups[t.pickups.length - 1];
	if (last && last.totalAfter > BUDGET) warnings.push(`pickups total $${last.totalAfter.toFixed(2)} exceeds the $${BUDGET} budget.`);
	return warnings;
};
