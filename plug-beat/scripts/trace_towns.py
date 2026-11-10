#!/usr/bin/env python3
"""
Trace clean town outlines out of the low-res reference map (public/ref/hartford-towns.jpg)
and write them as data the Remotion project can render.

WHY THIS EXISTS
  Real boundary downloads (Census TIGER / CT Open Data) were blocked in the sandbox this was
  built in, so the outlines are *traced from the reference picture* and georeferenced with an
  affine fit against approximate town-centre coordinates. They are good for a stylised overlay
  (right neighbours, right relative positions) but are NOT survey-accurate. To swap in real
  data later, replace src/geo/townPaths.ts (same shape: town -> SVG path in map px, 62 px/km,
  origin 41.80N/72.83W, +y south) - e.g. generate it with d3-geo from a Census TIGER / CT Open Data
  GeoJSON using the projection in src/geo/projection.ts - then re-run scripts/place-labels.ts.

USAGE (from plug-beat/):
  pip install opencv-python-headless scipy numpy
  python3 scripts/trace_towns.py

OUTPUT
  src/geo/townsGeo.ts   town rings in [lng, lat] + label points (editable / replaceable)
  src/geo/townPaths.ts  the same rings projected into map pixels as SVG path strings

The projection constants below MUST match src/geo/projection.ts.
"""
import json
import math
import os

import cv2
import numpy as np
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public', 'ref', 'hartford-towns.jpg')
OUT_DIR = os.path.join(ROOT, 'src', 'geo')

# --- keep in sync with src/geo/projection.ts -------------------------------------------------
LAT0, LNG0 = 41.80, -72.83          # map origin (px 0,0) == this lat/lng
PX_PER_KM = 62.0
KX = 111.32 * math.cos(math.radians(LAT0))   # km per degree longitude
KY = 110.57                                  # km per degree latitude
# ---------------------------------------------------------------------------------------------

# Label position of every town on the reference image (px) = watershed seed.
SEEDS = {
    'Hartland': (97, 62), 'Granby': (216, 113), 'Suffield': (382, 78), 'Enfield': (510, 93),
    'East Granby': (315, 150), 'Windsor Locks': (405, 172), 'East Windsor': (497, 203),
    'Canton': (139, 268), 'Simsbury': (225, 248), 'Bloomfield': (312, 300), 'Windsor': (385, 250),
    'South Windsor': (484, 310), 'Avon': (182, 380), 'West Hartford': (300, 410),
    'Hartford': (372, 392), 'East Hartford': (440, 410), 'Manchester': (543, 387),
    'Burlington': (85, 410), 'Farmington': (209, 453), 'Glastonbury': (520, 504),
    'Wethersfield': (389, 492), 'Newington': (323, 495), 'Bristol': (105, 519),
    'New Britain': (267, 528), 'Plainville': (191, 530), 'Rocky Hill': (398, 552),
    'Marlborough': (619, 588), 'Southington': (169, 625), 'Berlin': (277, 616),
}

# Approximate real (lat, lng) of towns near the stops, used only to georeference the picture.
CONTROL = {
    'Avon': (41.8097, -72.8301), 'West Hartford': (41.7621, -72.7420),
    'Simsbury': (41.8764, -72.8012), 'Canton': (41.8256, -72.8943),
    'Burlington': (41.7716, -72.9603), 'Farmington': (41.7198, -72.8317),
    'Bloomfield': (41.8264, -72.7298), 'Hartford': (41.7637, -72.6851),
    'Newington': (41.6989, -72.7237), 'New Britain': (41.6612, -72.7795),
    'Plainville': (41.6745, -72.8587), 'Windsor': (41.8523, -72.6437),
    'East Hartford': (41.7823, -72.6125),
}


def segment(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = g.shape
    # outer background (white area outside the thick county outline)
    dark = g < 110
    dark = cv2.morphologyEx(dark.astype('uint8'), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)) > 0
    lab, _ = ndi.label(~dark)
    outer = lab[5, 5]
    markers = np.zeros((h, w), np.int32)
    markers[lab == outer] = 1
    names = list(SEEDS)
    for i, n in enumerate(names, start=2):
        x, y = SEEDS[n]
        cv2.circle(markers, (x, y), 5, i, -1)
    res = cv2.watershed(cv2.GaussianBlur(img, (3, 3), 0), markers.copy())
    return names, res


def smooth_ring(mask):
    """Dense, smoothed outline of a binary mask as float (x, y) px."""
    mask = cv2.dilate(mask.astype('uint8'), np.ones((3, 3), np.uint8))  # grow onto the shared watershed line so neighbours share one edge
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)[:, 0, :].astype(float)
    c = np.stack([ndi.gaussian_filter1d(c[:, k], 2.2, mode='wrap') for k in (0, 1)], axis=1)
    approx = cv2.approxPolyDP(c.astype(np.float32).reshape(-1, 1, 2), 0.7, True)[:, 0, :]
    return approx


def main():
    img = cv2.imread(SRC)
    names, res = segment(img)

    # affine: image px -> km (east, north) from the control towns
    pts, tgt = [], []
    for i, n in enumerate(names, start=2):
        if n not in CONTROL:
            continue
        ys, xs = np.where(res == i)
        pts.append((xs.mean(), ys.mean()))
        la, ln = CONTROL[n]
        tgt.append(((ln - LNG0) * KX, (la - LAT0) * KY))
    P, T = np.array(pts), np.array(tgt)
    M, *_ = np.linalg.lstsq(np.c_[P, np.ones(len(P))], T, rcond=None)
    rms = float(np.sqrt(((np.c_[P, np.ones(len(P))] @ M - T) ** 2).sum(1).mean()))
    print(f'georeference rms residual: {rms:.2f} km')

    def px_to_lnglat(p):
        e, n = np.array([p[0], p[1], 1.0]) @ M
        return (LNG0 + e / KX, LAT0 + n / KY)

    def lnglat_to_map(lng, lat):
        return ((lng - LNG0) * KX * PX_PER_KM, -(lat - LAT0) * KY * PX_PER_KM)

    geo, paths = {}, {}
    for i, n in enumerate(names, start=2):
        ring = smooth_ring(res == i)
        ys, xs = np.where(res == i)
        ll = [px_to_lnglat(p) for p in ring]
        lab_ll = px_to_lnglat((xs.mean(), ys.mean()))
        geo[n] = {'ring': [[round(a, 5), round(b, 5)] for a, b in ll],
                  'label': [round(lab_ll[0], 5), round(lab_ll[1], 5)]}
        mp = [lnglat_to_map(a, b) for a, b in ll]
        d = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in mp) + 'Z'
        lx, ly = lnglat_to_map(*lab_ll)
        paths[n] = {'d': d, 'label': [round(lx, 1), round(ly, 1)]}

    os.makedirs(OUT_DIR, exist_ok=True)
    hdr = '// GENERATED by scripts/trace_towns.py — traced from public/ref/hartford-towns.jpg.\n' \
          '// Stylised outlines, not survey-accurate. Safe to replace with real boundary data.\n'
    with open(os.path.join(OUT_DIR, 'townsGeo.ts'), 'w') as f:
        f.write(hdr + 'export type TownGeo = {ring: [number, number][]; label: [number, number]};\n')
        f.write('/** Rings are [lng, lat]. */\nexport const TOWNS_GEO: Record<string, TownGeo> = ')
        f.write(json.dumps(geo, indent=1) + ';\n')
    with open(os.path.join(OUT_DIR, 'townPaths.ts'), 'w') as f:
        f.write(hdr + '// Map-pixel space: origin = projection origin, +x east, +y south, 62 px / km.\n')
        f.write('export type TownPath = {d: string; label: [number, number]};\n')
        f.write('export const TOWN_PATHS: Record<string, TownPath> = ')
        f.write(json.dumps(paths, indent=1) + ';\n')
    print('wrote', OUT_DIR, f'({len(names)} towns)')

    # sanity: placeholder stops must fall inside the right towns
    inv = np.linalg.inv(np.array([[M[0, 0], M[1, 0], M[2, 0]], [M[0, 1], M[1, 1], M[2, 1]], [0, 0, 1]]))
    for label, (la, ln) in {'Whole Foods': (41.80, -72.83), 'CVS': (41.79, -72.86),
                            'Vitamin Shopper': (41.76, -72.74)}.items():
        x, y, _ = inv @ np.array([(ln - LNG0) * KX, (la - LAT0) * KY, 1])
        print(f'  {label:16s} -> town', names[res[int(round(y)), int(round(x))] - 2])


if __name__ == '__main__':
    main()
