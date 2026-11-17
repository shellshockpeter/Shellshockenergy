import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {introCamera, projectPanelPoint} from '../camera';
import {DestinationPin, PinGround} from '../DestinationPin';
import {MapPanel} from '../MapPanel';
import {MapTitle} from '../MapSegment';
import {HOME, STOPS, stopPanelXY, type Camera} from '../mapConfig';
import {RouteLine} from '../RouteLine';
import type {ResolvedTimeline} from './timeline';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * "Three different locations" map entrance. Mount INSIDE a <Sequence from={map.introStart}>, so the
 * frame here is local. Same MapPanel / pins / route / HOME camera / pin positions as the standalone
 * MapIntro composition; only the timing comes from the timeline:
 *   spin-in (shortened) -> pin drops on the spoken words -> route draws -> exit (scale down + fade).
 */
export const MapIntroScene: React.FC<{timeline: ResolvedTimeline; title: string; subtitle: string}> = ({
	timeline,
	title,
	subtitle,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const m = timeline.map;
	const start = m.introStart;

	/* ---- camera: spin in, then exactly HOME ---- */
	let cam: Camera = HOME;
	if (frame < m.spinFrames) {
		const p = spring({frame, fps, config: {damping: 14, stiffness: 80, mass: 1}, durationInFrames: m.spinFrames});
		cam = introCamera(p);
	}
	const panelOpacity = interpolate(frame, [0, 8], [0, 1], clamp);

	/* ---- geometry ---- */
	const panelXY = STOPS.map(stopPanelXY);
	const tips = panelXY.map(([x, y]) => projectPanelPoint(x, y, cam));

	/* ---- pins drop on the spoken words ---- */
	const pins = STOPS.map((stop, i) => ({stop, entranceFrame: frame - (m.pinDrops[i] - start)}));

	/* ---- route draws between the pins ---- */
	const rs = m.routeStart - start;
	const re = m.routeEnd - start;
	const mid = (rs + re) / 2;
	const ease = Easing.inOut(Easing.quad);
	const routeProgress = [
		interpolate(frame, [rs, mid], [0, 1], {...clamp, easing: ease}),
		interpolate(frame, [mid, re], [0, 1], {...clamp, easing: ease}),
	];

	/* ---- exit ---- */
	const ex = interpolate(frame, [m.exitStart - start, m.exitEnd - start], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const titleOpacity = interpolate(frame, [m.spinFrames, m.spinFrames + 10], [0, 1], clamp);

	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					opacity: 1 - ex,
					transform: `scale(${1 - 0.14 * ex})`,
					transformOrigin: '540px 760px',
				}}
			>
				<MapPanel camera={cam} opacity={panelOpacity}>
					<RouteLine points={panelXY} progress={routeProgress} frame={frame} />
					{pins.map((p, i) =>
						p.entranceFrame >= 0 ? (
							<PinGround
								key={p.stop.id}
								x={panelXY[i][0]}
								y={panelXY[i][1]}
								state="pending"
								frame={frame}
								slamFrame={null}
								entranceFrame={p.entranceFrame}
								boost={0}
							/>
						) : null,
					)}
				</MapPanel>

				{pins.map((p, i) => (
					<DestinationPin
						key={p.stop.id}
						stop={p.stop}
						state="pending"
						frame={frame}
						slamFrame={null}
						entranceFrame={p.entranceFrame}
						tip={tips[i]}
						camScale={cam.scale}
						boost={0}
					/>
				))}

				<MapTitle title={title} subtitle={subtitle} opacity={titleOpacity} />
			</div>
		</AbsoluteFill>
	);
};
