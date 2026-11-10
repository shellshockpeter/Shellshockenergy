import React, {useId} from 'react';
import {LOOP, MAP_COLORS, gold, goldWarm} from './mapConfig';

type Props = {
	/** Route vertices in panel px (stop ground points). */
	points: ReadonlyArray<readonly [number, number]>;
	/** Draw progress 0..1 for each segment (points.length - 1 entries). */
	progress: readonly number[];
	/** Frame used for the moving dashes. Period is LOOP so cuts between segments stay seamless. */
	frame: number;
};

const DASH = 16;
const GAP = 12;

/**
 * Glowing gold dashed route with moving dashes. Rendered inside the tilted map plane.
 * Draw-in is a mask (a solid stroke growing along each segment), so the dashes keep flowing
 * while the line draws.
 */
export const RouteLine: React.FC<Props> = ({points, progress, frame}) => {
	const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
	// loop of exactly one dash pattern per LOOP frames => seamless at every cut
	const offset = -(DASH + GAP) * ((frame % LOOP) / LOOP);

	return (
		<g>
			<defs>
				<filter id={`rb-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="6" />
				</filter>
			</defs>
			{points.slice(0, -1).map((p, i) => {
				const q = points[i + 1];
				const t = progress[i] ?? 0;
				if (t <= 0) return null;
				const d = `M${p[0]} ${p[1]} L${q[0]} ${q[1]}`;
				return (
					<g key={i}>
						<mask id={`rm-${uid}-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="2000" height="2000">
							<path
								d={d}
								pathLength={1}
								stroke="#fff"
								strokeWidth={30}
								strokeLinecap="round"
								fill="none"
								strokeDasharray={`${t} 2`}
							/>
						</mask>
						<g mask={`url(#rm-${uid}-${i})`}>
							{/* bloom */}
							<path
								d={d}
								fill="none"
								stroke={goldWarm(0.75)}
								strokeWidth={10}
								strokeLinecap="round"
								strokeDasharray={`${DASH} ${GAP}`}
								strokeDashoffset={offset}
								filter={`url(#rb-${uid})`}
							/>
							{/* core */}
							<path
								d={d}
								fill="none"
								stroke={MAP_COLORS.gold}
								strokeWidth={4}
								strokeLinecap="round"
								strokeDasharray={`${DASH} ${GAP}`}
								strokeDashoffset={offset}
								style={{filter: `drop-shadow(0 0 3px ${gold(0.9)})`}}
							/>
						</g>
					</g>
				);
			})}
		</g>
	);
};
