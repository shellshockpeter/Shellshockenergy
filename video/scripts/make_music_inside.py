"""EVERYTHING INSIDE v2 soundtrack: uplifting premium-launch house, D major, 120 bpm.
# NOTE: public/audio/inside-music.wav is now the user-supplied track (Thunderstruck, 27.5s-54.5s); running this script would overwrite it with the old SFX-only mix.

Different from the TRAINER cut (A minor, dark trap): four-on-the-floor kick,
sidechain-pumped pads, bright pluck stabs + 16th arps, whooshes on every
transition, a stripped Bm breakdown for THE TURN, and a major-chord bloom on the CTA.
Usage: python3 make_music_inside.py out.wav [--music]
Default is SFX ONLY (whooshes, booms, risers, chimes; no background music). Pass --music for the full groove.
"""
import sys
import wave

import numpy as np

SR = 44100
FPS = 30
DUR = 27.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(21)
BUS_PAD = np.zeros((N, 2))   # sidechained
BUS_MAIN = np.zeros((N, 2))  # not ducked


def t_arr(d):
    return np.arange(int(SR * d)) / SR


def put(bus, sig, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    bus[i : i + len(sig), 0] += sig * g * np.cos((pan + 1) * np.pi / 4)
    bus[i : i + len(sig), 1] += sig * g * np.sin((pan + 1) * np.pi / 4)


def lp(x, c):
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    p = 0.0
    for i in range(len(x)):
        p = (1 - a) * x[i] + a * p
        y[i] = p
    return y


def hp(x, c):
    return x - lp(x, c)


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
    t = t_arr(0.3)
    ph = 2 * np.pi * np.cumsum(50 + 95 * np.exp(-t * 32)) / SR
    s = np.sin(ph) * np.exp(-t * 10) + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 120) * 0.1
    put(BUS_MAIN, s, at, 0.85 * g)


def hat(at, g=1.0, open_=False, pan=0.2):
    t = t_arr(0.2 if open_ else 0.045)
    n = hp(rng.standard_normal(len(t)), 8000) * np.exp(-t * (16 if open_ else 90))
    put(BUS_MAIN, n, at, 0.075 * g, pan)


def snap(at, g=1.0):
    t = t_arr(0.2)
    n = lp(hp(rng.standard_normal(len(t)), 1500), 7000) * (np.exp(-t * 30) + 0.5 * np.exp(-((t - 0.01) ** 2) * 1e5))
    s = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22) * 0.4
    put(BUS_MAIN, n + s, at, 0.17 * g)


def sub(at, note, d=0.24, g=1.0):
    t = t_arr(d)
    s = np.sin(2 * np.pi * hz(note) * t) * env(len(t), 0.004, d, 0.0, 0.03) * np.exp(-t * 2.5)
    put(BUS_MAIN, np.tanh(s * 1.8), at, 0.30 * g)


def pad(at, notes, d, g=1.0):
    t = t_arr(d)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.1, 0.0, 0.1):
            ph = 2 * np.pi * hz(n) * 2 ** (det / 12) * t
            out += (2 * ((ph / (2 * np.pi)) % 1) - 1) * 0.5 + np.sin(ph) * 0.5  # soft saw
    out = lp(out, 2600) * env(len(t), 0.25, 0.2, 0.9, 0.35)
    put(BUS_PAD, out, at, 0.028 * g, 0.0)


def stab(at, notes, g=1.0):
    t = t_arr(0.38)
    out = np.zeros_like(t)
    for n in notes:
        f = hz(n)
        out += np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9) + 0.2 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 14)
    out *= np.exp(-t * 7) * env(len(t), 0.002, 0.38)
    put(BUS_PAD, out / max(1, len(notes)) * 1.3, at, 0.12 * g, 0.15)


def arp(at, note, g=1.0, pan=0.0):
    t = t_arr(0.26)
    f = hz(note)
    s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 18)) * np.exp(-t * 12) * env(len(t), 0.002, 0.26)
    put(BUS_PAD, s, at, 0.075 * g, pan)
    put(BUS_PAD, s * 0.45, at + 0.1875, 0.075 * g, -pan)  # dotted-8th echo


def whoosh(at, d=0.3, up=True, g=1.0):
    t = t_arr(d)
    n = rng.standard_normal(len(t))
    sweep = lp(n, 7000) - lp(n, 400)
    shape = (t / d) ** 1.8 if up else (1 - t / d) ** 1.8
    put(BUS_MAIN, sweep * shape * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.4, at, 0.16 * g, 0.0)


def riser(at, d, g=1.0):
    t = t_arr(d)
    n = rng.standard_normal(len(t))
    sweep = (lp(n, 9000) - lp(n, 500)) * (t / d) ** 2.4
    tone = np.sin(2 * np.pi * np.cumsum(hz(62) * 2 ** (1.4 * t / d)) / SR) * (t / d) ** 2 * 0.35
    put(BUS_MAIN, sweep * 0.2 + tone * 0.2, at, g)


def boom(at, g=1.0, note=26):
    t = t_arr(1.4)
    ph = 2 * np.pi * np.cumsum(hz(note) * (1 + 1.4 * np.exp(-t * 16))) / SR
    s = np.sin(ph) * np.exp(-t * 2.6) + lp(rng.standard_normal(len(t)), 700) * np.exp(-t * 4) * 0.4
    put(BUS_MAIN, s, at, 0.5 * g)


def chime(at, note, g=1.0):
    t = t_arr(1.1)
    f = hz(note)
    s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4)) * np.exp(-t * 3.2)
    put(BUS_PAD, s, at, 0.10 * g, 0.2)
    put(BUS_PAD, s * 0.4, at + 0.26, 0.10 * g, -0.3)


def fr(x):
    return x / FPS


# beat starts (frames) — keep in sync with BEATS durations in EverythingInside.tsx
# 1A0 1B60 2A120 2B165 2C210 3A255 3B300 4A360 4B390 4C420 5A450 5B495 5C525 5D555 6A585 6B630 7A675 7B750 end810
TRANS = {120: "up", 165: "up", 210: "up", 255: "up", 300: "up", 360: "dn", 390: "up",
         450: "up", 495: "up", 525: "up", 555: "up", 585: "dn", 630: "up", 675: "up"}

# progression: D  A  Bm  G  (I V vi IV)
PROG = [([62, 66, 69], 38, [74, 78, 81, 78]), ([57, 61, 64], 33, [73, 76, 81, 76]),
        ([59, 62, 66], 35, [71, 74, 78, 74]), ([55, 59, 62], 31, [71, 74, 79, 74])]
BAR = 4 * BEAT
TURN = (17.5, 20.5)

MUSIC = "--music" in sys.argv
kick_times = []
for b in range(int(np.ceil(DUR / BAR)) if MUSIC else 0):
    at = b * BAR
    notes, root, arpn = PROG[b % 4]
    in_turn = TURN[0] <= at < TURN[1]
    if at >= 25.0:
        if abs(at - 25.0) < 1e-6:
            pad(at, [62, 66, 69, 74], 2.6, 1.6)
            chime(at, 86)
        continue
    if in_turn:
        pad(at, [59, 62, 66], BAR + 0.3, 1.2)           # Bm, sparse
        stab(at, [71, 74, 78], 0.8)
        sub(at, 35, 1.6, 0.9)
        kick_times += [at]
        kick(at, 0.7)
        continue
    pad(at, notes, BAR + 0.3, 1.0 if at >= 2.0 else 0.8)
    if at < 2.0:
        sub(at, root, BAR, 0.7)
        continue
    for beat in range(4):
        tb = at + beat * BEAT
        kick(tb)
        kick_times.append(tb)
        hat(tb + BEAT / 2, 1.0, open_=True)
        for q in (0.25, 0.75):
            hat(tb + q * BEAT, 0.55)
        sub(tb + BEAT / 2, root, 0.22, 1.0)
        if beat in (1, 3) and tb >= 6.5:
            snap(tb)
        if beat in (0, 2) or tb >= 10:
            stab(tb + BEAT * 0.75, notes, 0.85)
    if at >= 6.5:
        for s16 in range(16):
            n = arpn[s16 % 4] + (12 if (s16 // 8) % 2 else 0)
            if s16 % 2 == 0 or at >= 13:
                arp(at + s16 * BEAT / 4, n, 0.8 if s16 % 4 else 1.1, -0.35 + 0.7 * (s16 % 2))

# ---- arcade / hook helpers ----
def square(at, note, d=0.09, g=1.0):
    t = t_arr(d)
    s_ = np.sign(np.sin(2 * np.pi * hz(note) * t)) * env(len(t), 0.002, d, 0.6, 0.02)
    put(BUS_MAIN, s_, at, 0.07 * g, 0.0)


def arcade_up(at, g=1.0):
    for k, n in enumerate([72, 76, 79, 84, 88, 91]):
        square(at + k * 0.065, n, 0.1, g)
    square(at + 0.42, 96, 0.28, g)


def glitch_burst(at, g=1.0):
    t = t_arr(0.28)
    n = rng.standard_normal(len(t))
    n = np.round(n * 6) / 6  # bit-crush
    gate = (np.sin(2 * np.pi * 38 * t) > -0.2).astype(float)
    put(BUS_MAIN, hp(n, 900) * gate * np.exp(-t * 7), at, 0.16 * g, 0.0)


def flatline(at, d, g=1.0):
    t = t_arr(d)
    put(BUS_MAIN, np.sin(2 * np.pi * 1000 * t) * env(len(t), 0.05, d, 1.0, 0.02), at, 0.05 * g, 0.0)


def bip(at, g=1.0):
    t = t_arr(0.16)
    put(BUS_MAIN, np.sin(2 * np.pi * 1000 * t) * env(len(t), 0.003, 0.16, 0.0, 0.01) * np.exp(-t * 5), at, 0.10 * g, 0.0)


def sparkle(at, n=30, g=1.0):
    for k in range(n):
        note = 84 + [0, 4, 7, 12, 16, 19][k % 6] + (k // 6) * 2
        t = t_arr(0.14)
        s_ = np.sin(2 * np.pi * hz(min(note, 108)) * t) * np.exp(-t * 26)
        put(BUS_PAD, s_, at + k * 0.045, 0.05 * g, -0.4 + 0.8 * ((k % 5) / 4))


# ---- transitions + impacts ----
for c, kind in TRANS.items():
    whoosh(fr(c) - 0.12, 0.3, up=(kind == "up"), g=0.9 if MUSIC else 2.4)

# 1A: bored flatline, a weak heartbeat blip, then glitch into the game
flatline(fr(4), fr(56) - fr(4), 1.0)
bip(fr(48), 1.0)
glitch_burst(fr(60) - 0.06, 1.0)
arcade_up(fr(60), 1.0)
boom(fr(60), 0.8)
whoosh(fr(60) - 0.1, 0.35, up=True, g=1.0 if MUSIC else 2.4)

for s_, n in zip([120, 255, 360, 450], [74, 78, 81, 86]):
    boom(fr(s_), 0.5)
    chime(fr(s_), n)
chime(fr(630), 76)
boom(fr(630), 0.45, 24)

# 7A: the offer
riser(fr(675) - 1.2, 1.2, 0.9)
boom(fr(675), 0.9)
for k, n in enumerate([74, 78, 81, 86, 90]):
    chime(fr(675) + k * 0.06, n, 0.8)
sparkle(fr(685), 34, 1.0)
chime(fr(720), 93, 0.9)
# 7B: CTA
boom(fr(750), 1.0, 25)
for k, n in enumerate([74, 78, 81, 86, 90, 93]):
    chime(fr(750) + 0.03 + k * 0.05, n, 0.7)

# sidechain: duck pad bus on every kick
duck = np.ones(N)
for kt in kick_times:
    i = int(kt * SR)
    L_ = int(0.32 * SR)
    if i >= N:
        continue
    seg = min(L_, N - i)
    duck[i : i + seg] = np.minimum(duck[i : i + seg], 1 - 0.7 * np.exp(-np.arange(seg) / (0.09 * SR)))
mix = BUS_MAIN + BUS_PAD * duck[:, None]
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix = mix / np.max(np.abs(mix)) * 0.84
fade = int(0.7 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
out = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print("wrote", sys.argv[1])
