#!/usr/bin/env python3
"""
Cut-consistency check for the map segments.

Renders nothing itself: feed it stills you rendered with `npx remotion still`:
  out/map/MapSlam1_89.png  vs  out/map/MapSlam2_0.png    (pin 1 must be identical)
  out/map/MapSlam2_89.png  vs  out/map/MapSlam3_0.png    (pins 1 + 2 must be identical)

Compares the RGBA pixels in a box around each DONE pin (pin + glow + label + stamp) and
reports the max per-channel difference and the number of differing pixels. Anything other than
0 means a done pin drifted between clips.

  python3 scripts/compare-cuts.py            (run from plug-beat/, needs numpy + pillow)
"""
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, 'out', 'map')

# Screen boxes (x0, y0, x1, y1) at HOME around the DONE pin body (+glow) and its label + DONE stamp.
# Deliberately excludes the ground ring / route: the dashed route is meant to keep flowing.
# Pin tips at HOME: 1 (386,426)  2 (234,486)  3 (844,673)
BOXES = {
    'pin 1 body': (320, 280, 455, 405),
    'pin 1 label+stamp': (440, 320, 930, 395),
    'pin 2 body': (185, 360, 252, 440),
    'pin 2 label+stamp': (100, 255, 380, 335),
}


def load(name):
    return np.asarray(Image.open(os.path.join(OUT, name)).convert('RGBA')).astype(int)


def compare(a_name, b_name, pins):
    a, b = load(a_name), load(b_name)
    print(f'\n{a_name}  vs  {b_name}')
    ok = True
    for p in pins:
        x0, y0, x1, y1 = BOXES[p]
        d = np.abs(a[y0:y1, x0:x1] - b[y0:y1, x0:x1])
        n = int((d.max(axis=2) > 0).sum())
        where = ''
        if n:
            ys, xs = np.where(d.max(axis=2) > 0)
            where = f'   at x {xs.min() + x0}-{xs.max() + x0}, y {ys.min() + y0}-{ys.max() + y0}'
        print(f'  {p:18s} max channel diff = {d.max():3d}   differing px = {n}{where}')
        ok &= d.max() == 0
    return ok


if __name__ == '__main__':
    ok1 = compare('MapSlam1_89.png', 'MapSlam2_0.png', ['pin 1 body', 'pin 1 label+stamp'])
    ok2 = compare('MapSlam2_89.png', 'MapSlam3_0.png', ['pin 1 body', 'pin 1 label+stamp', 'pin 2 body', 'pin 2 label+stamp'])
    print('\nRESULT:', 'PASS - done pins are pixel-identical across cuts' if ok1 and ok2 else 'FAIL - drift detected')
    sys.exit(0 if ok1 and ok2 else 1)
