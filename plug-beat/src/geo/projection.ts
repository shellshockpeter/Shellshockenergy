/**
 * Map projection shared by the generated town paths and the stop pins.
 * MUST match scripts/trace_towns.py (LAT0/LNG0/PX_PER_KM/KX/KY).
 *
 * Local equirectangular projection around the origin (41.80 N, 72.83 W):
 *   +x = east, +y = south, 62 px per km.  Fine at this scale (~25 km across).
 */
export const LAT0 = 41.8;
export const LNG0 = -72.83;
export const PX_PER_KM = 62;

const KX = 111.32 * Math.cos((LAT0 * Math.PI) / 180); // km per degree longitude
const KY = 110.57; // km per degree latitude

/** lat/lng -> map pixels (origin = LAT0/LNG0). */
export const project = (lat: number, lng: number): [number, number] => [
	(lng - LNG0) * KX * PX_PER_KM,
	-(lat - LAT0) * KY * PX_PER_KM,
];
