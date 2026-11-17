#!/usr/bin/env python3
"""
Track the tub through YOUR video and write keyframes for the golden outline: src/video1/tubTrack.ts

  pip install opencv-contrib-python numpy
  python3 scripts/track_tub.py --select                     # opens a window: drag a box around the tub, press ENTER
  python3 scripts/track_tub.py --box 380,1180,560,720       # or give the box (x,y,w,h) in the VIDEO's own pixels

Useful options:
  --video  public/A57BF0BA-....mp4     (default: auto-finds the A57BF0BA... file or source.mp4 in public/)
  --start  1.0   --end 6.0             seconds of the (already trimmed) video to track. The box is drawn at --start.
  --tracker csrt|kcf|mil               csrt is the most accurate (default)
  --smooth 7                           moving-average window in frames (0 = off); removes tracker jitter
  --debug                              saves annotated frames to out/track-debug/ so you can check the box visually

The keyframes are written in 1080x1920 composition pixels and in composition frames (30 fps).
Re-run with a different --start/--end or --box any time. If the tracker loses the tub, shorten the range
(--start/--end), draw a tighter box, or run it in pieces.
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


def make_tracker(name):
    """Different OpenCV builds expose trackers in different places; try them all."""
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


def smooth(a, win):
    if win <= 1 or len(a) < 3:
        return a
    win = win if win % 2 else win + 1
    pad = win // 2
    padded = np.pad(a, (pad, pad), mode='edge')
    return np.convolve(padded, np.ones(win) / win, mode='valid')


def main():
    ap = argparse.ArgumentParser(description='Track the tub and write src/video1/tubTrack.ts')
    ap.add_argument('--video')
    ap.add_argument('--start', type=float, default=1.0)
    ap.add_argument('--end', type=float, default=6.0)
    ap.add_argument('--box', help='x,y,w,h in the video pixels at --start')
    ap.add_argument('--select', action='store_true', help='draw the box with the mouse (needs a display)')
    ap.add_argument('--tracker', default='csrt', choices=['csrt', 'kcf', 'mil'])
    ap.add_argument('--smooth', type=int, default=7)
    ap.add_argument('--debug', action='store_true')
    ap.add_argument('--out', default=os.path.join(ROOT, 'src', 'video1', 'tubTrack.ts'))
    a = ap.parse_args()

    path = a.video or find_video()
    if not path or not os.path.exists(path):
        sys.exit('No video found. Put it in public/ or pass --video path')
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    vw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    vh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    i0 = int(round(a.start * fps))
    i1 = min(int(round(a.end * fps)), total - 1)
    print(f'{os.path.relpath(path, ROOT)}: {vw}x{vh} @ {fps:.2f} fps, tracking frames {i0}-{i1}')

    cap.set(cv2.CAP_PROP_POS_FRAMES, i0)
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
        sys.exit('Give --select or --box x,y,w,h')
    if len(box) != 4 or box[2] < 8 or box[3] < 8:
        sys.exit('The box is empty')

    tracker = make_tracker(a.tracker)
    tracker.init(frame, box)
    boxes = {i0: box}
    last = box
    lost = 0
    debug_dir = os.path.join(ROOT, 'out', 'track-debug')
    if a.debug:
        os.makedirs(debug_dir, exist_ok=True)

    def annotate(img, b, idx):
        out = img.copy()
        x, y, w, h = [int(v) for v in b]
        cv2.rectangle(out, (x, y), (x + w, y + h), (20, 255, 60), 6)
        cv2.circle(out, (x + w // 2, y + h // 2), 14, (20, 255, 60), -1)
        cv2.putText(out, f'f{idx}', (x, max(40, y - 14)), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (20, 255, 60), 4)
        return cv2.resize(out, (vw // 3, vh // 3))

    if a.debug:
        cv2.imwrite(os.path.join(debug_dir, f'f{i0:05d}.jpg'), annotate(frame, box, i0))
    for idx in range(i0 + 1, i1 + 1):
        ok, frame = cap.read()
        if not ok:
            break
        found, b = tracker.update(frame)
        if found:
            last = tuple(float(v) for v in b)
        else:
            lost += 1  # hold the last known box
        boxes[idx] = last
        if a.debug and (idx - i0) % 15 == 0:
            cv2.imwrite(os.path.join(debug_dir, f'f{idx:05d}.jpg'), annotate(frame, last, idx))
    cap.release()
    if lost:
        print(f'WARNING: the tracker lost the tub on {lost} frame(s) (held the last position). Check with --debug.')

    # resample to composition frames (30 fps) and convert to 1080-wide composition pixels
    scale = COMP_W / vw
    idxs = sorted(boxes)
    cf0 = int(round(idxs[0] / fps * COMP_FPS))
    cf1 = int(round(idxs[-1] / fps * COMP_FPS))
    frames, xs, ys, ws, hs = [], [], [], [], []
    for cf in range(cf0, cf1 + 1):
        vi = min(idxs, key=lambda k: abs(k / fps * COMP_FPS - cf))
        x, y, w, h = boxes[vi]
        frames.append(cf)
        xs.append((x + w / 2) * scale)
        ys.append((y + h / 2) * scale)
        ws.append(w * scale)
        hs.append(h * scale)
    xs, ys, ws, hs = (smooth(np.array(v), a.smooth) for v in (xs, ys, ws, hs))

    def arr(v):
        return '[' + ', '.join(f'{x:.1f}' for x in v) + ']'

    # keep the explanatory header of the existing file; only the TUB_TRACK data is replaced
    header = ''
    if os.path.exists(a.out):
        text = open(a.out).read()
        if 'export const TUB_TRACK' in text:
            header = text[: text.index('export const TUB_TRACK')]
    if not header:
        header = 'export type TubTrack = {frames: number[]; x: number[]; y: number[]; w: number[]; h: number[]; rotate?: number[]};\n\n'
    with open(a.out, 'w') as f:
        f.write(header)
        f.write(f'// GENERATED by scripts/track_tub.py — video: {os.path.basename(path)}, {a.start}s-{a.end}s, tracker: {a.tracker}, smooth: {a.smooth}\n')
        f.write('export const TUB_TRACK: TubTrack = {\n')
        f.write(f'\tframes: [{", ".join(str(v) for v in frames)}],\n')
        f.write(f'\tx: {arr(xs)},\n\ty: {arr(ys)},\n\tw: {arr(ws)},\n\th: {arr(hs)},\n')
        f.write('};\n')
    print(f'wrote {os.path.relpath(a.out, ROOT)}: {len(frames)} keyframes (composition frames {cf0}-{cf1})')
    print('Next: open Video1Overlay in Studio and turn on the showTubGuide prop to check the track on every frame.')


if __name__ == '__main__':
    main()
