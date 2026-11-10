import React from 'react';
import {
	AbsoluteFill,
	Easing,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {z} from 'zod';
import {introCamera, projectPanelPoint, slamCamera, slamShake} from './camera';
import {DestinationPin, PinGround, type PinState} from './DestinationPin';
import {MapPanel} from './MapPanel';
import {
	HOME,
	INTRO,
	SLAM,
	STOPS,
	stopPanelXY,
	type Camera,
} from './mapConfig';
import {NeonText} from './NeonText';
import {RouteLine} from './RouteLine';
import {detectSfx} from './sfx';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export const mapSchema = z.object({
	/** Show dim "pending" pins (and the route) before each stop is slammed. */
	showPending: z.boolean(),
	title: z.string(),
	subtitle: z.string(),
	/** Auto-detected from public/sfx/ — leave as-is. */
	sfx: z.object({whoosh: z.boolean(), thud: z.boolean(), stamp: z.boolean()}),
});
export type MapProps = z.infer<typeof mapSchema>;

export const mapDefaults: MapProps = {
	showPending: true,
	title: '3 STOPS',
	subtitle: 'AVON → WEST HARTFORD',
	sfx: {whoosh: false, thud: false, stamp: false},
};

export const MAP_SFX_FILES = {
	whoosh: 'sfx/whoosh.mp3',
	thud: 'sfx/thud.mp3',
	stamp: 'sfx/stamp.mp3',
} as const;

export const mapCalculateMetadata =
	(durationInFrames: number) =>
	async ({props}: {props: MapProps}) => {
		const sfx = (await detectSfx('Map', MAP_SFX_FILES)) as MapProps['sfx'];
		return {durationInFrames, props: {...props, sfx}};
	};

/* ------------------------------------------------------------------ */
/* The segment                                                         */
/* ------------------------------------------------------------------ */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * One component renders all four clips.
 *   slam = 0  -> MapIntro
 *   slam = n  -> MapSlam<n>: pins < n are DONE (static), pin n slams, pins > n stay pending.
 * Every clip starts and ends on the HOME camera.
 */
export const MapSegment: React.FC<MapProps & {slam: 0 | 1 | 2 | 3}> = ({
	showPending,
	title,
	subtitle,
	sfx,
	slam,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const isIntro = slam === 0;

	/* ---- camera ---- */
	let cam: Camera = HOME;
	let panelOpacity = 1;
	if (isIntro) {
		if (frame < INTRO.spinFrames) {
			const p = spring({
				frame,
				fps,
				config: {damping: 14, stiffness: 80, mass: 1},
				durationInFrames: INTRO.spinFrames,
			});
			cam = introCamera(p);
		}
		panelOpacity = interpolate(frame, [0, 10], [0, 1], clamp);
	} else {
		cam = slamCamera(frame, STOPS[slam - 1]);
	}
	const shake = isIntro ? {x: 0, y: 0} : slamShake(frame);

	/* ---- stop geometry ---- */
	const panelXY = STOPS.map(stopPanelXY);
	const tips = panelXY.map(([x, y]) => projectPanelPoint(x, y, cam));

	/* ---- per-pin state ---- */
	const pins = STOPS.map((stop, i) => {
		let state: PinState = 'pending';
		let slamFrame: number | null = null;
		let entranceFrame: number | null = null;
		let visible = true;
		let boost = 0;
		if (isIntro) {
			entranceFrame = frame - (INTRO.pinStart + i * INTRO.pinStagger);
			visible = showPending;
		} else if (stop.id < slam) {
			state = 'done';
		} else if (stop.id === slam) {
			state = 'target';
			slamFrame = frame - SLAM.slamFrame;
			boost = interpolate(frame, [0, SLAM.pushStart], [0, 1], clamp);
		} else {
			visible = showPending;
		}
		return {stop, state, slamFrame, entranceFrame, visible, boost};
	});

	/* ---- route progress (segment j joins stop j+1 and j+2) ---- */
	const ease = Easing.inOut(Easing.quad);
	const routeProgress = [0, 1].map((j) => {
		if (isIntro) {
			if (!showPending) return 0;
			const s = INTRO.routeStart + j * (INTRO.routeDuration / 2);
			return interpolate(frame, [s, s + INTRO.routeDuration / 2], [0, 1], {...clamp, easing: ease});
		}
		if (showPending) return 1;
		const toId = j + 2;
		if (toId < slam) return 1;
		if (toId === slam) {
			return interpolate(frame, [SLAM.slamFrame + 4, SLAM.slamFrame + 20], [0, 1], {...clamp, easing: ease});
		}
		return 0;
	});

	const titleOpacity = isIntro ? interpolate(frame, [44, 58], [0, 1], clamp) : 1;

	return (
		<AbsoluteFill>
			{/* whole-stage wrapper: carries the slam screen-shake (identity outside it) */}
			<div style={{position: 'absolute', inset: 0, transform: `translate(${shake.x}px, ${shake.y}px)`}}>
				<MapPanel camera={cam} opacity={panelOpacity}>
					<RouteLine points={panelXY} progress={routeProgress} frame={frame} />
					{pins.map((p, i) =>
						p.visible ? (
							<PinGround
								key={p.stop.id}
								x={panelXY[i][0]}
								y={panelXY[i][1]}
								state={p.state}
								frame={frame}
								slamFrame={p.slamFrame}
								entranceFrame={p.entranceFrame}
								boost={p.boost}
							/>
						) : null,
					)}
				</MapPanel>

				{pins.map((p, i) =>
					p.visible ? (
						<DestinationPin
							key={p.stop.id}
							stop={p.stop}
							state={p.state}
							frame={frame}
							slamFrame={p.slamFrame}
							entranceFrame={p.entranceFrame}
							tip={tips[i]}
							camScale={cam.scale}
							boost={p.boost}
						/>
					) : null,
				)}

				{/* title: fixed screen position, never moves with the camera */}
				<div style={{position: 'absolute', left: 150, top: 1122, opacity: titleOpacity}}>
					<NeonText size={54} glow={1.1}>
						{title}
					</NeonText>
					<div style={{height: 12}} />
					<NeonText font="body" size={22} glow={0.7} weight={600} letterSpacing="0.3em">
						{subtitle}
					</NeonText>
				</div>
			</div>

			{/* ---- sound (only mounted when the file exists) ---- */}
			{isIntro && sfx.whoosh ? (
				<Sequence name="SFX whoosh" durationInFrames={INTRO.spinFrames + 10}>
					<Audio src={staticFile(MAP_SFX_FILES.whoosh)} />
				</Sequence>
			) : null}
			{isIntro && sfx.thud && showPending
				? STOPS.map((s, i) => (
						<Sequence
							key={s.id}
							name={`SFX thud ${s.id}`}
							from={INTRO.pinStart + i * INTRO.pinStagger + 4}
							durationInFrames={24}
						>
							<Audio src={staticFile(MAP_SFX_FILES.thud)} />
						</Sequence>
					))
				: null}
			{!isIntro && sfx.stamp ? (
				<Sequence name="SFX stamp" from={SLAM.slamFrame} durationInFrames={40}>
					<Audio src={staticFile(MAP_SFX_FILES.stamp)} />
				</Sequence>
			) : null}
		</AbsoluteFill>
	);
};
