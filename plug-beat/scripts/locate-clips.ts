/**
 * Finds WHERE each of the 4 ingredient clips sits inside your main video, and writes src/clips/clipStarts.ts.
 *
 *   npm run locate-clips                       # main video + clips are found in public/ and public/clips/
 *   npm run locate-clips -- --video public/xyz.mp4
 *
 * How: every video is turned into tiny 32x32 grey frames (a fingerprint of the picture); each clip is slid along
 * your main video until its frames line up best. That works even if the audio was replaced / mixed with the voiceover,
 * and even if only part of a clip is used (the clip's own 0:00 can then be before the start of the match).
 * Uses ffmpeg (system one, else the one bundled with Remotion: nothing to install).
 */
import {spawnSync} from 'node:child_process';
import {existsSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {CLIPS, CLIP_ORDER, type ClipId} from '../src/clips/clips';
import {CLIP_STARTS} from '../src/clips/clipStarts';

const ROOT = path.join(__dirname, '..');
const arg = (name: string) => {
	const i = process.argv.indexOf(name);
	return i >= 0 ? process.argv[i + 1] : undefined;
};

/* ---------------- ffmpeg ---------------- */
const ffmpegCmd = (): {cmd: string; pre: string[]} => {
	if (spawnSync('ffmpeg', ['-version']).status === 0) return {cmd: 'ffmpeg', pre: []};
	const r = spawnSync('npx', ['remotion', 'ffmpeg', '-version'], {cwd: ROOT});
	if (r.status === 0) return {cmd: 'npx', pre: ['remotion', 'ffmpeg']};
	console.error('Could not find ffmpeg (neither a system one nor Remotion\'s). Run `npm install` first.');
	process.exit(1);
};
const FF = ffmpegCmd();

const S = 32; // fingerprint size
/** Decode `file` to z-scored S x S grey frames at `fps` (optionally only [ss, ss+t]). */
const frames = (file: string, fps: number, ss?: number, t?: number): Float32Array[] => {
	const args = [...FF.pre, '-v', 'error'];
	if (ss !== undefined) args.push('-ss', String(Math.max(0, ss)));
	if (t !== undefined) args.push('-t', String(t));
	args.push('-i', file, '-vf', `fps=${fps},scale=${S}:${S}:flags=area,format=gray`, '-f', 'rawvideo', '-');
	const r = spawnSync(FF.cmd, args, {maxBuffer: 1 << 30});
	if (r.status !== 0) {
		console.error(String(r.stderr).slice(0, 400));
		process.exit(1);
	}
	const buf = r.stdout as Buffer;
	const n = Math.floor(buf.length / (S * S));
	const out: Float32Array[] = [];
	for (let f = 0; f < n; f++) {
		const v = new Float32Array(S * S);
		let mean = 0;
		for (let i = 0; i < S * S; i++) {
			v[i] = buf[f * S * S + i];
			mean += v[i];
		}
		mean /= S * S;
		let sd = 0;
		for (let i = 0; i < S * S; i++) {
			v[i] -= mean;
			sd += v[i] * v[i];
		}
		sd = Math.sqrt(sd / (S * S)) || 1; // black frames: avoid dividing by ~0
		for (let i = 0; i < S * S; i++) v[i] /= sd;
		out.push(v);
	}
	return out;
};

const dist = (a: Float32Array, b: Float32Array) => {
	let dot = 0;
	for (let i = 0; i < S * S; i++) dot += a[i] * b[i];
	return 1 - dot / (S * S); // 0 = identical picture, ~1 = unrelated
};

/** Score every alignment k (main frame index = clip frame index + k). Lower is better. */
const slide = (main: Float32Array[], clip: Float32Array[], minOverlap: number, kMin?: number, kMax?: number) => {
	const out: {k: number; score: number; overlap: number}[] = [];
	const lo = kMin ?? -(clip.length - minOverlap);
	const hi = kMax ?? main.length - minOverlap;
	for (let k = lo; k <= hi; k++) {
		const i0 = Math.max(0, -k);
		const i1 = Math.min(clip.length, main.length - k);
		const overlap = i1 - i0;
		if (overlap < minOverlap) continue;
		let sum = 0;
		for (let i = i0; i < i1; i++) sum += dist(main[i + k], clip[i]);
		// a tiny preference for alignments where more of the clip is used
		out.push({k, score: sum / overlap + 0.08 * (1 - overlap / clip.length), overlap});
	}
	return out;
};

/* ---------------- find the main video ---------------- */
const findMain = (): string => {
	const given = arg('--video');
	if (given) return path.resolve(ROOT, given);
	for (const base of ['A57BF0BA-A76E-42EB-AD03-2F7AE0100196', 'source']) {
		for (const ext of ['mp4', 'mov', 'MOV', 'MP4', 'm4v', 'webm']) {
			const p = path.join(ROOT, 'public', `${base}.${ext}`);
			if (existsSync(p)) return p;
		}
	}
	console.error('Main video not found. Put it in public/ (A57BF0BA-....mp4 or .mov) or pass --video <path>.');
	process.exit(1);
};

const main = findMain();
console.log(`main video: ${path.relative(ROOT, main)}`);
const COARSE = 8;
const FINE = 30;
const mainCoarse = frames(main, COARSE);
console.log(`  ${mainCoarse.length} fingerprints (${(mainCoarse.length / COARSE).toFixed(1)} s)\n`);

const found: Partial<Record<ClipId, number>> = {};
for (const id of CLIP_ORDER) {
	const cfg = CLIPS[id];
	const clipPath = path.join(ROOT, 'public', 'clips', cfg.file);
	if (!existsSync(clipPath)) {
		console.log(`${cfg.title.padEnd(13)} clip file missing: public/clips/${cfg.file}`);
		continue;
	}
	const clipCoarse = frames(clipPath, COARSE);
	const minOverlap = Math.round(1.5 * COARSE);
	const all = slide(mainCoarse, clipCoarse, minOverlap);
	if (!all.length) {
		console.log(`${cfg.title.padEnd(13)} the main video is too short to contain this clip`);
		continue;
	}
	all.sort((a, b) => a.score - b.score);
	const best = all[0];
	// runner-up that is not just a neighbouring alignment
	const second = all.find((a) => Math.abs(a.k - best.k) > COARSE) ?? all[all.length - 1];

	// refine at 30 fps around the coarse hit
	const startSec = best.k / COARSE;
	const clipFine = frames(clipPath, FINE);
	const winStart = Math.max(0, startSec - 1);
	const mainFine = frames(main, FINE, winStart, cfg.durationSeconds + 3);
	const base = Math.round((startSec - winStart) * FINE);
	const fine = slide(mainFine, clipFine, Math.round(1.5 * FINE), base - Math.round(0.6 * FINE), base + Math.round(0.6 * FINE));
	fine.sort((a, b) => a.score - b.score);
	const f = fine[0] ?? {k: base, score: best.score, overlap: 0};
	const start = winStart + f.k / FINE;

	const confident = best.score < 0.4 && second.score - best.score > 0.08;
	console.log(
		`${cfg.title.padEnd(13)} starts at ${start.toFixed(2)} s   (match ${(1 - Math.min(1, f.score)).toFixed(2)}, next best ${(1 - Math.min(1, second.score)).toFixed(2)}; ` +
			`${(f.overlap / FINE).toFixed(1)} s of the clip found)  ${confident ? '✓' : '⚠ NOT CONFIDENT'}`,
	);
	if (confident) found[id] = Math.round(start * 100) / 100;
	else console.log(`              -> couldn't find it reliably; keeping ${CLIP_STARTS[id].toFixed(2)} s. Check the clip is in the video, or type the time into src/clips/clipStarts.ts.`);
}

/* ---------------- write src/clips/clipStarts.ts ---------------- */
const all4 = CLIP_ORDER.every((id) => found[id] !== undefined);
const out = arg('--out') ?? path.join(ROOT, 'src', 'clips', 'clipStarts.ts');
const lines = CLIP_ORDER.map((id) => `\t${id}: ${(found[id] ?? CLIP_STARTS[id]).toFixed(2)},`);
const text = `/**
 * WHERE EACH CLIP SITS INSIDE YOUR MAIN VIDEO (the A57BF0BA... file), in seconds from the start of that FILE.
 * "the clip's own 0:00 is at this second of the video" (negative = your video only uses the later part of the clip).
 *
 * ${all4 ? 'GENERATED by scripts/locate-clips.ts (npm run locate-clips). You can also edit the numbers by hand.' : '⚠ Some clips were NOT found: those keep placeholder values. Run npm run locate-clips again or type the times in.'}
 */
import type {ClipId} from './clips';

export const CLIP_STARTS_ARE_PLACEHOLDERS = ${all4 ? 'false' : 'true'};

export const CLIP_STARTS: Record<ClipId, number> = {
${lines.join('\n')}
};
`;
if (process.argv.includes('--print-only')) {
	console.log('\n(--print-only: nothing written)');
} else {
	writeFileSync(out, text);
	console.log(`\nwrote ${path.relative(ROOT, out)}${all4 ? '' : '   (⚠ not every clip was found)'}`);
}
