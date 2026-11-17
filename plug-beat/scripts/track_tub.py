#!/usr/bin/env python3
"""
Lock the golden outline to the tub: find the tub in YOUR video on every frame and write src/video1/tubTrack.ts.

  pip install opencv-contrib-python numpy
  python3 scripts/track_tub.py --start 1.0 --end 6.0

MODE auto (default) - no box, no clicking.
  Matches the printed label (turtle logo, SHELLSHOCK text, icons) of public/tub.png against every video frame
  (SIFT features + RANSAC homography). That recovers the tub's full pose on each frame: position, size, rotation AND
  perspective. The outline is warped to that pose, so it stays glued to the tub as it moves, tilts and turns.
  Frames where the label is hidden (hand over it, turned away, motion blur) are filled in between good frames.

MODE box (fallback) - python3 scripts/track_tub.py --mode box --select   (or --box x,y,w,h)
  Follows a rectangle you draw around the tub (CSRT tracker). Position + size only (no rotation/perspective).
  Use it if the label is never clearly visible.

Options:
  --video  public/A57BF0BA-....mp4    default: auto-finds A57BF0BA... or source.* in public/
  --start / --end                     seconds of the (already trimmed) video to track
  --ref public/tub.png                the product photo to look for (use a photo of the SAME tub label if yours differs)
  --min-inliers 12                    how many matching label points count as "found" (lower = more frames, riskier)
  --smooth 5                          moving-average window in frames (0 = off)
  --debug                             saves annotated frames to out/track-debug/ - LOOK AT THEM to confirm the lock
"""
import argparse
import glob
import os
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMP_W, COMP_FPS = 1080, 30


def find_video():
    for base in ('A57BF0BA-A76E-42EB-AD03-2F7AE0100196', 'source'):
        for ext in ('mp4', 'mov', 'MOV', 'MP4', 'm4v', 'webm'):
            p = os.path.join(ROOT, 'public', f'{base}.{ext}')
            if os.path.exists(p):
                return p
    hits = glob.glob(os.path.join(ROOT, 'public', '*.mp4')) + glob.glob(os.path.join(ROOT, 'public', '*.mov'))
    return hits[0] if hits else None


# ----------------------------------------------------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------------------------------------------------
def smooth(a, win):
    a = np.asarray(a, float)
    if win <= 1 or len(a) < 3:
        return a
    win = win if win % 2 else win + 1
    pad = win // 2
    return np.convolve(np.pad(a, (pad, pad), mode='edge'), np.ones(win) / win, mode='valid')


def fill_gaps(series, valid):
    """Linear-interpolate invalid entries from the nearest valid ones (holds at the ends)."""
    idx = np.arange(len(series))
    if valid.sum() == 0:
        return series
    return np.interp(idx, idx[valid], series[valid])


def rolling_median(a, win):
    pad = win // 2
    p = np.pad(a, (pad, pad), mode='edge')
    return np.array([np.median(p[i : i + win]) for i in range(len(a))])


# ----------------------------------------------------------------------------------------------------------------
# AUTO mode: SIFT label matching -> homography
# ----------------------------------------------------------------------------------------------------------------
def load_reference(path, ref_h):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if im is None:
        sys.exit(f'Cannot read {path}')
    if im.ndim == 3 and im.shape[2] == 4:
        alpha = im[..., 3]
        bgr = im[..., :3]
    else:
        bgr = im
        alpha = np.full(im.shape[:2], 255, np.uint8)
    h, w = bgr.shape[:2]
    s = ref_h / h
    size = (int(round(w * s)), ref_h)
    gray = cv2.cvtColor(cv2.resize(bgr, size, interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    mask = cv2.resize((alpha > 128).astype(np.uint8) * 255, size, interpolation=cv2.INTER_NEAREST)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    sift = cv2.SIFT_create(nfeatures=2500)
    kp, des = sift.detectAndCompute(clahe.apply(gray), mask)
    if des is None or len(kp) < 20:
        sys.exit('Not enough detail in the reference image to match against.')
    return sift, clahe, kp, des, size


def quad_ok(q, ref_aspect):
    """Sanity checks so a bad homography never becomes a keyframe."""
    q = q.reshape(4, 2)
    if not cv2.isContourConvex(q.astype(np.float32)):
        return False
    top = np.linalg.norm(q[1] - q[0])
    bottom = np.linalg.norm(q[2] - q[3])
    left = np.linalg.norm(q[3] - q[0])
    right = np.linalg.norm(q[2] - q[1])
    if min(top, bottom, left, right) < 20:
        return False
    # perspective must stay plausible (no wildly squashed / mirrored quads)
    if max(top, bottom) / max(1.0, min(top, bottom)) > 2.2 or max(left, right) / max(1.0, min(left, right)) > 2.2:
        return False
    aspect = ((top + bottom) / 2) / ((left + right) / 2)
    return 0.4 * ref_aspect < aspect < 2.2 * ref_aspect


def track_auto(a, cap, fps, i0, i1, vw, vh, debug_dir):
    sift, clahe, kp_ref, des_ref, (rw, rh) = load_reference(a.ref, a.ref_height)
    ref_corners = np.float32([[0, 0], [rw, 0], [rw, rh], [0, rh]]).reshape(-1, 1, 2)
    ref_pts = np.float32([k.pt for k in kp_ref])
    matcher = cv2.BFMatcher(cv2.NORM_L2)
    fs = a.frame_scale
    quads = {}  # video frame idx -> 4x2 array in ORIGINAL video pixels
    inl = {}
    cap.set(cv2.CAP_PROP_POS_FRAMES, i0)
    for idx in range(i0, i1 + 1):
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.resize(frame, None, fx=fs, fy=fs, interpolation=cv2.INTER_AREA)
        gray = clahe.apply(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY))
        kp, des = sift.detectAndCompute(gray, None)
        found = None
        if des is not None and len(kp) >= 8:
            good = []
            for pair in matcher.knnMatch(des_ref, des, k=2):
                if len(pair) == 2 and pair[0].distance < a.ratio * pair[1].distance:
                    good.append(pair[0])
            if len(good) >= a.min_inliers:
                src = ref_pts[[m.queryIdx for m in good]].reshape(-1, 1, 2)
                dst = np.float32([kp[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
                H, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
                if H is not None and inliers is not None and int(inliers.sum()) >= a.min_inliers:
                    q = cv2.perspectiveTransform(ref_corners, H).reshape(4, 2) / fs  # -> original video px
                    if quad_ok(q, rw / rh):
                        found = q
                        inl[idx] = int(inliers.sum())
        if found is not None:
            quads[idx] = found
        if debug_dir and (idx - i0) % 10 == 0:
            vis = frame.copy()
            if found is not None:
                cv2.polylines(vis, [found.astype(np.int32)], True, (20, 255, 60), 8)
                cv2.putText(vis, f'f{idx} inliers {inl[idx]}', (30, 90), cv2.FONT_HERSHEY_SIMPLEX, 2.4, (20, 255, 60), 6)
            else:
                cv2.putText(vis, f'f{idx} NOT FOUND', (30, 90), cv2.FONT_HERSHEY_SIMPLEX, 2.4, (40, 40, 255), 6)
            cv2.imwrite(os.path.join(debug_dir, f'f{idx:05d}.jpg'), cv2.resize(vis, (vw // 3, vh // 3)))
    n = i1 - i0 + 1
    print(f'label found on {len(quads)}/{n} frames ({100 * len(quads) / max(1, n):.0f}%)')
    if len(quads) < max(5, 0.15 * n):
        sys.exit('The tub label was found on too few frames to track. Try --min-inliers 8, check --debug frames, '
                 'or use --mode box (draw a box around the tub).')
    return quads


# ----------------------------------------------------------------------------------------------------------------
# BOX mode: CSRT on a hand-drawn rectangle
# ----------------------------------------------------------------------------------------------------------------
def make_tracker(name):
    table = {
        'csrt': ['legacy.TrackerCSRT_create', 'TrackerCSRT_create'],
        'kcf': ['legacy.TrackerKCF_create', 'TrackerKCF_create'],
        'mil': ['TrackerMIL_create', 'legacy.TrackerMIL_create'],
    }
    for path in table[name]:
        obj = cv2
        try:
            for part in path.split('.'):
                obj = getattr(obj, part)
            return obj()
        except AttributeError:
            continue
    sys.exit(f"This OpenCV build has no '{name}' tracker. Install the full build:  pip install opencv-contrib-python")


def track_box(a, cap, i0, i1, vw, vh):
    ok, frame = cap.read()
    if not ok:
        sys.exit('Could not read the first frame')
    if a.select:
        r = cv2.selectROI('Drag a box around the tub, then press ENTER', frame, showCrosshair=False)
        cv2.destroyAllWindows()
        box = tuple(int(v) for v in r)
    elif a.box:
        box = tuple(int(float(v)) for v in a.box.split(','))
    else:
        sys.exit('box mode needs --select or --box x,y,w,h')
    if len(box) != 4 or box[2] < 8 or box[3] < 8:
        sys.exit('The box is empty')
    tracker = make_tracker(a.tracker)
    tracker.init(frame, box)
    boxes, last, lost = {i0: box}, box, 0
    for idx in range(i0 + 1, i1 + 1):
        ok, frame = cap.read()
        if not ok:
            break
        found, b = tracker.update(frame)
        if found:
            last = tuple(float(v) for v in b)
        else:
            lost += 1
        boxes[idx] = last
    if lost:
        print(f'WARNING: the tracker lost the tub on {lost} frame(s) (held the last position).')
    # express as quads so both modes share the same pipeline (axis-aligned rectangles)
    return {i: np.float32([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]) for i, (x, y, w, h) in boxes.items()}


# ----------------------------------------------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description='Track the tub and write src/video1/tubTrack.ts')
    ap.add_argument('--mode', default='auto', choices=['auto', 'box'])
    ap.add_argument('--video')
    ap.add_argument('--start', type=float, default=1.0)
    ap.add_argument('--end', type=float, default=6.0)
    ap.add_argument('--ref', default=os.path.join(ROOT, 'public', 'tub.png'))
    ap.add_argument('--ref-height', type=int, default=560)
    ap.add_argument('--frame-scale', type=float, default=0.5)
    ap.add_argument('--ratio', type=float, default=0.78)
    ap.add_argument('--min-inliers', type=int, default=12)
    ap.add_argument('--box', help='box mode: x,y,w,h in the video pixels at --start')
    ap.add_argument('--select', action='store_true', help='box mode: draw the box with the mouse')
    ap.add_argument('--tracker', default='csrt', choices=['csrt', 'kcf', 'mil'])
    ap.add_argument('--smooth', type=int, default=5)
    ap.add_argument('--debug', action='store_true')
    ap.add_argument('--out', default=os.path.join(ROOT, 'src', 'video1', 'tubTrack.ts'))
    a = ap.parse_args()

    path = a.video or find_video()
    if not path or not os.path.exists(path):
        sys.exit('No video found. Put it in public/ or pass --video path')
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    vw, vh = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    i0 = int(round(a.start * fps))
    i1 = min(int(round(a.end * fps)), total - 1)
    print(f'{os.path.relpath(path, ROOT)}: {vw}x{vh} @ {fps:.2f} fps, tracking frames {i0}-{i1}, mode {a.mode}')
    cap.set(cv2.CAP_PROP_POS_FRAMES, i0)

    debug_dir = None
    if a.debug:
        debug_dir = os.path.join(ROOT, 'out', 'track-debug')
        os.makedirs(debug_dir, exist_ok=True)

    quads = track_auto(a, cap, fps, i0, i1, vw, vh, debug_dir) if a.mode == 'auto' else track_box(a, cap, i0, i1, vw, vh)
    cap.release()

    # ---- per-video-frame arrays with gaps -> clean per-composition-frame keyframes ----
    idxs = np.arange(i0, i1 + 1)
    valid = np.array([i in quads for i in idxs])
    coords = np.full((len(idxs), 8), np.nan)
    for k, i in enumerate(idxs):
        if i in quads:
            coords[k] = quads[i].reshape(8)
    # 1) reject outliers (a coordinate far from its rolling median = a bad match)
    if a.mode == 'auto' and valid.sum() > 8:
        scale_px = np.nanmedian(np.hypot(coords[:, 2] - coords[:, 0], coords[:, 3] - coords[:, 1]))
        for c in range(8):
            col = fill_gaps(coords[:, c], valid)
            med = rolling_median(col, 9)
            bad = np.abs(coords[:, c] - med) > 0.18 * scale_px
            valid &= ~(bad & ~np.isnan(coords[:, c]))
    # 2) fill gaps + smooth
    cols = [smooth(fill_gaps(np.nan_to_num(coords[:, c], nan=0.0), valid), a.smooth) for c in range(8)]
    scale = COMP_W / vw
    cf0 = int(round(idxs[0] / fps * COMP_FPS))
    cf1 = int(round(idxs[-1] / fps * COMP_FPS))
    frames, series = [], [[] for _ in range(8)]
    for cf in range(cf0, cf1 + 1):
        vi = int(np.argmin(np.abs(idxs / fps * COMP_FPS - cf)))
        frames.append(cf)
        for c in range(8):
            series[c].append(cols[c][vi] * scale)
    X = np.array(series[0::2])  # 4 x N
    Y = np.array(series[1::2])
    cx, cy = X.mean(0), Y.mean(0)
    bw, bh = X.max(0) - X.min(0), Y.max(0) - Y.min(0)

    def arr(v):
        return '[' + ', '.join(f'{x:.1f}' for x in v) + ']'

    header = ''
    if os.path.exists(a.out):
        text = open(a.out).read()
        if 'export const TUB_TRACK' in text:
            header = text[: text.index('export const TUB_TRACK')]
    if not header:
        header = 'export type TubTrack = {frames: number[]; x: number[]; y: number[]; w: number[]; h: number[]; rotate?: number[]; quad?: number[][]};\n\n'
    with open(a.out, 'w') as f:
        f.write(header)
        f.write(f'// GENERATED by scripts/track_tub.py — video: {os.path.basename(path)}, {a.start}s-{a.end}s, mode: {a.mode}, smooth: {a.smooth}\n')
        f.write('export const TUB_TRACK: TubTrack = {\n')
        f.write(f'\tframes: [{", ".join(str(v) for v in frames)}],\n')
        f.write(f'\tx: {arr(cx)},\n\ty: {arr(cy)},\n\tw: {arr(bw)},\n\th: {arr(bh)},\n')
        if a.mode == 'auto':
            f.write('\t// the tub\'s 4 corners (top-left, top-right, bottom-right, bottom-left) as x0,y0,x1,y1,x2,y2,x3,y3 — the outline is warped onto this quad\n')
            f.write('\tquad: [\n')
            for c in range(8):
                f.write(f'\t\t{arr(series[c])},\n')
            f.write('\t],\n')
        f.write('};\n')
    print(f'wrote {os.path.relpath(a.out, ROOT)}: {len(frames)} keyframes (composition frames {cf0}-{cf1})')
    print('Check it: Studio -> Video1Overlay -> turn on the showTubGuide prop and scrub. Also look at out/track-debug/ if you used --debug.')


if __name__ == '__main__':
    main()
