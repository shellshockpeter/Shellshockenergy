import {staticFile} from 'remotion';

/**
 * True if public/<path> exists. Never throws: a missing sound file must not crash a render.
 * (The dev server can answer unknown paths with index.html, so HTML responses count as missing.)
 */
export const fileExists = async (path: string): Promise<boolean> => {
	try {
		const res = await fetch(staticFile(path));
		const type = res.headers.get('content-type') ?? '';
		const ok = res.ok && !type.includes('text/html');
		void res.body?.cancel();
		return ok;
	} catch {
		return false;
	}
};

/** Check a list of sfx files, print a TODO for each missing one, return availability flags. */
export const detectSfx = async (
	tag: string,
	files: Record<string, string>,
): Promise<Record<string, boolean>> => {
	const entries = await Promise.all(
		Object.entries(files).map(async ([key, path]) => {
			const ok = await fileExists(path);
			if (!ok) console.warn(`[${tag}] TODO: add public/${path} — rendering without that sound.`);
			return [key, ok] as const;
		}),
	);
	return Object.fromEntries(entries);
};
