import {Easing, interpolate} from 'remotion';
import {
	HOME,
	INTRO,
	PANEL,
	PERSPECTIVE,
	SLAM,
	SLAM_RECENTER,
	SLAM_ZOOM,
	STOPS,
	stopPanelXY,
	type Camera,
	type Stop,
} from './mapConfig';

const rad = (d: number) => (d * Math.PI) / 180;

/** CSS transform for the glass slab (matches projectPanelPoint exactly). */
export const panelTransform = (c: Camera): string =>
	`perspective(${PERSPECTIVE}px) translate(${c.tx}px, ${c.ty}px) scale(${c.scale}) rotateX(${c.rotateX}deg) rotateZ(${c.rotateZ}deg)`;

/**
 * Where a point of the glass slab (panel px, origin top-left) lands on screen.
 * Re-implements the CSS transform chain
 *   perspective(P) translate(tx,ty) scale(s) rotateX(a) rotateZ(r)   (origin = slab centre)
 * so pins/labels can sit in screen space yet stay locked to the map.
 */
export const projectPanelPoint = (
	px: number,
	py: number,
	c: Camera,
): {x: number; y: number; w: number} => {
	const x0 = px - PANEL.w / 2;
	const y0 = py - PANEL.h / 2;
	// rotateZ
	const x1 = x0 * Math.cos(rad(c.rotateZ)) - y0 * Math.sin(rad(c.rotateZ));
	const y1 = x0 * Math.sin(rad(c.rotateZ)) + y0 * Math.cos(rad(c.rotateZ));
	// rotateX (z = 0 before)
	const y2 = y1 * Math.cos(rad(c.rotateX));
	const z2 = y1 * Math.sin(rad(c.rotateX));
	// scale (x/y only), translate, perspective
	const X = c.scale * x1 + c.tx;
	const Y = c.scale * y2 + c.ty;
	const w = 1 - z2 / PERSPECTIVE;
	return {x: PANEL.cx + X / w, y: PANEL.cy + Y / w, w};
};

/** Camera for a push on `stop`: zoom about the pin, pulling it partly toward the centre line. */
const fullPushCamera = (stop: Stop): Camera => {
	const [px, py] = stopPanelXY(stop);
	const home = projectPanelPoint(px, py, HOME);
	const targetX = home.x + SLAM_RECENTER * (PANEL.cx - home.x);
	const targetY = home.y;
	const x0 = px - PANEL.w / 2;
	const y0 = py - PANEL.h / 2;
	const y1 = y0 * Math.cos(rad(HOME.rotateX));
	const z1 = y0 * Math.sin(rad(HOME.rotateX));
	const w = 1 - z1 / PERSPECTIVE;
	return {
		...HOME,
		scale: SLAM_ZOOM,
		tx: w * (targetX - PANEL.cx) - SLAM_ZOOM * x0,
		ty: w * (targetY - PANEL.cy) - SLAM_ZOOM * y1,
	};
};

const PUSH_CAMERAS = new Map<number, Camera>(
	STOPS.map((s) => [s.id, fullPushCamera(s)]),
);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.inOut(Easing.cubic);

/** Push-in amount 0..1 for a slam segment (0 = HOME). Exactly 0 outside the move. */
export const slamPush = (frame: number): number => {
	const push = interpolate(frame, [SLAM.pushStart, SLAM.slamFrame], [0, 1], {...clamp, easing: ease});
	const pull = interpolate(frame, [SLAM.pullStart, SLAM.pullEnd], [0, 1], {...clamp, easing: ease});
	return push * (1 - pull);
};

/** Camera for frame `frame` of the slam segment targeting `stop`. */
export const slamCamera = (frame: number, stop: Stop): Camera => {
	const p = slamPush(frame);
	if (p === 0) return HOME; // identical object => identical pixels at every cut
	const full = PUSH_CAMERAS.get(stop.id)!;
	return {
		...HOME,
		scale: HOME.scale + (full.scale - HOME.scale) * p,
		tx: full.tx * p,
		ty: full.ty * p,
	};
};

/** Camera for the intro spin (settles exactly onto HOME at frame >= spinFrames). */
export const introCamera = (progress: number): Camera => ({
	rotateX: INTRO.startRotateX + (HOME.rotateX - INTRO.startRotateX) * progress,
	rotateZ: INTRO.startRotateZ * (1 - progress),
	scale: INTRO.startScale + (HOME.scale - INTRO.startScale) * progress,
	tx: 0,
	ty: 0,
});

/** Deterministic 6-frame screen shake (no randomness). Zero outside the shake. */
export const slamShake = (frame: number): {x: number; y: number} => {
	const k = frame - SLAM.slamFrame;
	if (k < 0 || k >= SLAM.shakeFrames) return {x: 0, y: 0};
	const decay = 1 - k / SLAM.shakeFrames;
	return {x: Math.sin(k * 2.9 + 1) * 16 * decay, y: Math.cos(k * 3.7) * 12 * decay};
};
