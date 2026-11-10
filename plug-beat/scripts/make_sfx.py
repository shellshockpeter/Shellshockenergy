#!/usr/bin/env python3
"""
Synthesise the four sound effects used by the overlays (no downloads, no samples):

  public/sfx/tick.mp3    PlugBeat: one tick per flipping letter (short click)
  public/sfx/stamp.mp3   PlugBeat coupon slam + every map pin slam (impact + coin "ching")
  public/sfx/whoosh.mp3  MapIntro spin (swelling filtered-noise sweep)
  public/sfx/thud.mp3    MapIntro pins landing (low thump)

These are simple placeholders-that-work. To use real sounds, just drop your own files with the
same names into public/sfx/ (this script never runs automatically).

  pip install numpy scipy ; ffmpeg must be installed
  python3 scripts/make_sfx.py
"""
import os
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'sfx')
rng = np.random.default_rng(7)  # fixed seed -> identical files every run


def t(dur):
    return np.arange(int(SR * dur)) / SR


def env_exp(x, tau):
    return np.exp(-x / tau)


def normalise(x, peak_db=-3.0):
    x = x - x.mean()
    return x / (np.abs(x).max() + 1e-9) * (10 ** (peak_db / 20))


def fade(x, ms=4):
    n = int(SR * ms / 1000)
    x = x.copy()
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    return x


def swept_noise(dur, f0, f1, q_width=0.6, shape=None):
    """White noise through a band-pass whose centre moves f0 -> f1 (processed in short blocks)."""
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    block = 256
    zi = None
    for i in range(0, n, block):
        frac = i / n
        f = f0 * (f1 / f0) ** (shape(frac) if shape else frac)
        lo, hi = f * (1 - q_width / 2), f * (1 + q_width / 2)
        sos = butter(2, [max(lo, 40), min(hi, SR / 2 - 100)], btype='band', fs=SR, output='sos')
        if zi is None or zi.shape != (sos.shape[0], 2):
            zi = sosfilt_zi(sos) * 0
        seg, zi = sosfilt(sos, noise[i : i + block], zi=zi)
        out[i : i + block] = seg
    return out


def tick():
    x = t(0.06)
    click = np.sin(2 * np.pi * 2600 * x) * env_exp(x, 0.006)
    knock = np.sin(2 * np.pi * 900 * x) * env_exp(x, 0.012) * 0.6
    air = rng.standard_normal(len(x)) * env_exp(x, 0.003) * 0.35
    return fade(normalise(click + knock + air, -0.8))


def thud():
    x = t(0.45)
    f = 48 + 60 * np.exp(-x / 0.05)  # pitch drops 108 -> 48 Hz
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(x, 0.11)
    punch = sosfilt(butter(2, 400, 'low', fs=SR, output='sos'), rng.standard_normal(len(x))) * env_exp(x, 0.02) * 0.9
    return fade(normalise(body + punch, -2.5), 6)


def stamp():
    x = t(0.85)
    f = 55 + 90 * np.exp(-x / 0.035)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(x, 0.14)
    crack = sosfilt(butter(2, [1200, 7000], 'band', fs=SR, output='sos'), rng.standard_normal(len(x))) * env_exp(x, 0.012) * 0.8

    def bell(freq, start, tau, amp):
        y = np.zeros_like(x)
        s = int(start * SR)
        xs = x[: len(x) - s]
        partials = [(1, 1.0), (2.76, 0.45), (5.4, 0.2)]
        y[s:] = sum(a * np.sin(2 * np.pi * freq * k * xs) for k, a in partials) * env_exp(xs, tau) * amp
        return y

    ching = bell(1568, 0.045, 0.22, 0.38) + bell(2349, 0.115, 0.30, 0.34)  # "cha-ching"
    return fade(normalise(thump * 1.0 + crack + ching, -2.5), 6)


def whoosh():
    dur = 1.8
    x = t(dur)
    n = swept_noise(dur, 250, 5200, 0.9, shape=lambda p: np.sin(np.pi * p) ** 1.0 * 0.0 + p ** 1.4)
    swell = np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 2.2  # rises, peaks mid-spin, falls
    air = sosfilt(butter(2, 6000, 'high', fs=SR, output='sos'), rng.standard_normal(len(x))) * 0.05 * swell
    return fade(normalise(n * swell + air, -4), 20)


def write_mp3(name, samples):
    os.makedirs(OUT, exist_ok=True)
    pcm = (np.clip(samples, -1, 1) * 32767).astype('<i2')
    with tempfile.TemporaryDirectory() as d:
        wav = os.path.join(d, name + '.wav')
        with wave.open(wav, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        dst = os.path.join(OUT, name + '.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '192k', dst], check=True)
    print(f'wrote {os.path.relpath(dst, ROOT)}  ({len(samples) / SR:.2f}s)')


if __name__ == '__main__':
    write_mp3('tick', tick())
    write_mp3('thud', thud())
    write_mp3('stamp', stamp())
    write_mp3('whoosh', whoosh())
