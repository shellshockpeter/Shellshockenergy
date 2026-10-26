"""Soundtrack for EVERYTHING INSIDE (25.0s): A minor, 120 bpm, cuts on the beat.

Sections: hook slam (0-2s) -> full groove (2-17.5s) -> half-time breakdown for
THE TURN (17.5-20.5s, riser out of it) -> full groove + arps for the perk
(20.5-23s) -> final hit on the CTA (23s).
Usage: python3 make_music_inside.py out.wav
"""
import sys
import wave

import numpy as np

SR = 44100
FPS = 30
DUR = 25.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * np.cos((pan + 1) * np.pi / 4)
    R[i : i + len(sig)] += sig * gain * np.sin((pan + 1) * np.pi / 4)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    p = 0.0
    for i in range(len(x)):
        p = (1 - a) * x[i] + a * p
        y[i] = p
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.005, d=0.2, s=0.0, r=0.0):
    e = np.ones(n)
    ai = max(1, int(a * SR))
    e[:ai] = np.linspace(0, 1, ai)
    di = int(d * SR)
    if di > 0 and ai + di < n:
        e[ai : ai + di] = np.linspace(1, s, di)
        e[ai + di :] = s
    if r > 0:
        ri = min(int(r * SR), n)
        e[-ri:] *= np.linspace(1, 0, ri)
    return e


def kick(at, g=1.0):
    t = t_arr(0.32)
    ph = 2 * np.pi * np.cumsum(48 + 110 * np.exp(-t * 28)) / SR
    s = np.sin(ph) * np.exp(-t * 11)
    s += highpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 90) * 0.15
    add(s, at, 0.9 * g)


def hat(at, g=1.0, open_=False):
    t = t_arr(0.18 if open_ else 0.05)
    n = highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * (22 if open_ else 80))
    add(n, at, 0.10 * g, 0.25)


def clap(at, g=1.0):
    t = t_arr(0.22)
    n = lowpass(highpass(rng.standard_normal(len(t)), 1200), 6500)
    n *= np.exp(-t * 28) + 0.6 * np.exp(-((t - 0.012) ** 2) * 9e4)
    add(n, at, 0.20 * g)


def bass(at, note, d=0.45, g=1.0):
    t = t_arr(d)
    f = hz(note)
    s = np.tanh((np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)) * 1.6)
    s *= env(len(t), 0.004, d, 0.0, 0.05) * np.exp(-t * 3.0)
    add(s, at, 0.34 * g)


def pad(at, notes, d, g=1.0):
    t = t_arr(d)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.12, 0.0, 0.12):
            ph = 2 * np.pi * hz(n) * 2 ** (det / 12) * t
            out += np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
    add(lowpass(out, 1800) * env(len(t), 0.5, 0.2, 0.9, 0.6), at, 0.030 * g)


def pluck(at, note, g=1.0, pan=0.0):
    t = t_arr(0.32)
    f = hz(note)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) * np.exp(-t * 14)
    s += 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 20)
    add(s * np.exp(-t * 9) * env(len(t), 0.002, 0.32), at, 0.10 * g, pan)


def ping(at, note, g=1.0):
    t = t_arr(0.7)
    f = hz(note)
    s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 6.5)
    add(s, at, 0.16 * g, 0.1)
    add(s * 0.5, at + 0.19, 0.16 * g, -0.3)


def impact(at, g=1.0, pitch=33):
    t = t_arr(1.6)
    ph = 2 * np.pi * np.cumsum(hz(pitch) * (1 + 1.2 * np.exp(-t * 14))) / SR
    boom = np.sin(ph) * np.exp(-t * 2.4)
    n = lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t * 3.2) * 0.5
    sh = highpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 10) * 0.15
    add(boom + n + sh, at, 0.6 * g)


def riser(at, d, g=1.0):
    t = t_arr(d)
    n = rng.standard_normal(len(t))
    sweep = (lowpass(n, 6000) - lowpass(n, 300)) * (t / d) ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(hz(57) * 2 ** (t / d)) / SR) * (t / d) ** 2 * 0.4
    add(sweep * 0.22 + tone * 0.25, at, g)


def zap(at, g=1.0):
    t = t_arr(0.25)
    s = np.sin(2 * np.pi * np.cumsum(3200 * np.exp(-t * 11) + 200) / SR) * np.exp(-t * 14)
    add(s, at, 0.18 * g, 0.3)


def tick(at, g=1.0):
    """Tiny cut marker: high click so every hard cut is felt on the beat."""
    t = t_arr(0.05)
    s = highpass(rng.standard_normal(len(t)), 4500) * np.exp(-t * 110)
    s += np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 90) * 0.5
    add(s, at, 0.10 * g, -0.1)


def fr(x):
    return x / FPS


# ---- cut points (frames) — keep in sync with BEATS in EverythingInside.tsx ----
CUTS = [0, 60, 105, 150, 195, 240, 300, 330, 360, 390, 435, 465, 495, 525, 570,
        615, 645, 690, 750]
SCENE = [0, 60, 195, 300, 390, 525, 615, 690]  # scene / big-beat starts

# ---- sfx ----
for c in CUTS[1:-1]:
    tick(fr(c))
impact(0.0, 0.9)
for s, n in zip([60, 195, 300, 390], [69, 72, 74, 76]):  # A C D E ascending
    impact(fr(s), 0.55)
    ping(fr(s), n + 12)
zap(fr(570))                      # strike lands on the cut to 6B
impact(fr(570), 0.45, pitch=31)
riser(fr(615) - 1.0, 1.0, 0.9)    # into the perk
impact(fr(615), 0.8)
for k, n in enumerate([57, 64, 69, 72, 76]):
    ping(fr(615) + k * 0.04, n + 12, 0.7)
ping(fr(645), 88, 0.8)            # second perk line
impact(fr(690), 1.0, pitch=33)    # CTA
for k, n in enumerate([57, 64, 69, 72, 76, 81]):
    ping(fr(690) + 0.03 + k * 0.05, n + 12, 0.7)

# ---- music ----
chords = [([57, 60, 64], 33), ([53, 57, 60], 29), ([48, 52, 55], 36), ([55, 59, 62], 31)]
BAR = 4 * BEAT
HALF = (17.5, 20.5)
for b in range(int(np.ceil(DUR / BAR))):
    at = b * BAR
    notes, root = chords[b % 4]
    pad(at, notes, BAR + 0.4, 1.0)
    in_half = HALF[0] <= at < HALF[1]
    if at < 2.0:
        bass(at, root, BAR, 0.6)
    elif at >= 23.0:
        if at < 23.01:
            bass(at, root, 2.0, 0.8)
    elif in_half:
        bass(at, root, BAR, 0.7)
        kick(at, 0.8)
        kick(at + 2 * BEAT, 0.7)
    else:
        for beat in range(4):
            tb = at + beat * BEAT
            kick(tb)
            bass(tb, root + (12 if beat == 3 else 0), 0.4)
            bass(tb + BEAT / 2, root, 0.22, 0.7)
            hat(tb + BEAT / 2, 1.0, open_=(beat % 2 == 1))
            if beat in (1, 3) and tb >= 6.5:
                clap(tb)
        if at >= 10.0 or at >= 20.5:
            pent = [57, 60, 62, 64, 67, 69, 72, 76]
            pat = [0, 2, 4, 2, 5, 4, 2, 1]
            for s16 in range(16):
                note = pent[(pat[s16 % 8] + (b % 2)) % len(pent)] + 12
                pluck(at + s16 * BEAT / 4, note, 0.8 if s16 % 4 else 1.1, -0.3 + 0.6 * (s16 % 2))

# ---- master ----
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix = mix / np.max(np.abs(mix)) * 0.84
fade = int(0.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
out = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print("wrote", sys.argv[1])
