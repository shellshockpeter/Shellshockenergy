/**
 * ONE shared config for every map segment (MapIntro, MapSlam1-3).
 *
 * Everything that must be identical between clips lives here: projection origin,
 * panel geometry, HOME camera, stop coordinates, label placement, colours.
 * No segment overrides any of it, and nothing in the map is random.
 */
import {project} from './geo/projection';

export const MAP_CANVAS = {width: 1080, height: 1920, fps: 30} as const;

/** Social-app safe zones (px). */
export const MAP_SAFE = {left: 80, right: 80, top: 150, bottom: 250} as const;

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */
export const MAP_COLORS = {
	text: '#FFC400', // golden neon text core
	gold: '#FFC400', // pin core
	goldHot: '#FFE27A',
	goldDeep: '#FF9F00',
	glassEdge: 'rgba(255, 255, 255, 0.30)',
	line: 'rgba(255, 255, 255, 0.42)', // regular town outline
	lineFocus: 'rgba(255, 244, 214, 0.95)', // Avon + West Hartford outline
} as const;

export const gold = (a: number) => `rgba(255, 196, 0, ${a})`;
export const goldWarm = (a: number) => `rgba(255, 150, 0, ${a})`;
/** golden neon text glow */
export const textA = (a: number) => `rgba(255, 196, 0, ${a})`;

/* ------------------------------------------------------------------ */
/* Glass panel + camera                                                */
/* ------------------------------------------------------------------ */
export const PANEL = {
	/** unprojected size of the glass slab */
	w: 840,
	h: 1160,
	/** screen position of the slab centre (also the transform origin) */
	cx: 540,
	cy: 650,
	radius: 46,
} as const;

/** Where the projection origin (lat/lng 41.80, -72.83) sits inside the panel (panel px). */
export const MAP_ORIGIN = {x: 260, y: 330} as const;

export const PERSPECTIVE = 2600;

export type Camera = {
	rotateX: number;
	rotateZ: number;
	scale: number;
	tx: number;
	ty: number;
};

/** The one camera every segment starts and ends on. */
export const HOME: Camera = {rotateX: 22, rotateZ: 0, scale: 1, tx: 0, ty: 0};

/** How far the camera pushes in on a slam. */
export const SLAM_ZOOM = 1.3;
/** 0 = zoom about the pin, 1 = pin is pulled to the horizontal centre. Keeps labels on screen. */
export const SLAM_RECENTER = 0.55;

/* ------------------------------------------------------------------ */
/* Stops                                                               */
/* ------------------------------------------------------------------ */
export type LabelSide = 'left' | 'right' | 'above' | 'below';

export type Stop = {
	id: 1 | 2 | 3;
	label: string;
	town: string;
	lat: number;
	lng: number;
	/** which side of the pin the label sits on (chosen so labels never collide) */
	labelSide: LabelSide;
	/** fine-tune label position (px, relative to the side anchor) */
	labelDx?: number;
	labelDy?: number;
	/** for 'above'/'below' labels: put the DONE stamp UNDER the label instead of beside it (narrower block) */
	labelStack?: boolean;
};

/**
 * ⚠️  TODO: REPLACE THESE LAT/LNG VALUES WITH THE REAL STORE COORDINATES.
 * They are PLACEHOLDERS that sit inside the right towns (Avon, Avon, West Hartford).
 * (Right-click the store in Google Maps -> click the lat,lng to copy.)
 * Keep pins 1 and 2 at least ~150px apart on screen; the layout check script warns if not.
 */
export const STOPS: readonly Stop[] = [
	{id: 1, label: 'WHOLE FOODS', town: 'Avon', lat: 41.8, lng: -72.83, labelSide: 'right'},
	{id: 2, label: 'CVS', town: 'Avon', lat: 41.79, lng: -72.86, labelSide: 'above', labelStack: true},
	{
		id: 3,
		label: 'VITAMIN SHOPPE',
		town: 'West Hartford',
		lat: 41.76,
		lng: -72.74,
		labelSide: 'below',
		labelDx: -140,
	},
] as const;

/** Stop position in panel px (origin = top-left of the glass slab). */
export const stopPanelXY = (s: Stop): [number, number] => {
	const [x, y] = project(s.lat, s.lng);
	return [MAP_ORIGIN.x + x, MAP_ORIGIN.y + y];
};

/* ------------------------------------------------------------------ */
/* Town labels drawn on the map plane                                  */
/* ------------------------------------------------------------------ */
export type TownLabel = {
	town: string;
	/** panel px; defaults to the traced centroid */
	at?: [number, number];
	focus?: boolean;
	/** font size override (px) */
	size?: number;
	/** keep a multi-word name on one line */
	oneLine?: boolean;
};

/** Multi-word town names wrap onto two lines so they fit inside their town. */
export const labelLines = (town: string): string[] => town.toUpperCase().split(' ');

/**
 * Positions come from `npx tsx scripts/place-labels.ts` (re-run it if you move pins/labels).
 * Burlington and Hartford sit almost entirely outside the panel at this zoom (pins 1/2 must be
 * >=150px apart, which fixes the scale), so they get no label; Canton is only a sliver (no label).
 */
export const TOWN_LABELS: readonly TownLabel[] = [
	{town: 'Avon', focus: true, at: [143, 513], size: 54},
	{town: 'West Hartford', focus: true, at: [660, 436], size: 28, oneLine: true},
	{town: 'Simsbury', at: [288, 103], size: 23},
	{town: 'Bloomfield', at: [708, 79], size: 23},
	{town: 'Farmington', at: [222, 775], size: 23},
	{town: 'Newington', at: [742, 1031], size: 20},
	{town: 'New Britain', at: [586, 1112], size: 17},
] as const;

/* ------------------------------------------------------------------ */
/* Timing (frames)                                                     */
/* ------------------------------------------------------------------ */
export const INTRO = {
	duration: 120,
	spinFrames: 50,
	pinStart: 58,
	pinStagger: 8,
	routeStart: 90,
	routeDuration: 24,
	startRotateZ: -90,
	startRotateX: 55,
	startScale: 0.45,
} as const;

export const SLAM = {
	duration: 90,
	pushStart: 10,
	slamFrame: 30,
	pullStart: 50,
	pullEnd: 70,
	shakeFrames: 6,
} as const;

/** Pulse + dash loops use a 30-frame period so they stay continuous across every cut. */
export const LOOP = 30;
