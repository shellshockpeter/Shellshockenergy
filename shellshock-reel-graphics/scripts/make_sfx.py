#!/usr/bin/env python3
"""
Procedural UI sound design for the Shell Shock reel (Apple / Stripe / Linear launch-trailer feel).

  python3 scripts/make_sfx.py

* Synthesises every effect (numpy + scipy only) -> ./sfx/*.wav   (48 kHz, 24-bit, stereo)
* Reads the cue timeline from src/config.ts (so it follows AUDIO_OFFSET) via scripts/export-cues.mjs
* Mixes the effects + ambient bed into ./sfx/sfx_stem.wav (reel length, NO voice)
  and copies it to ./public/ (for Remotion) and ./out/ (for your editor).

House rules baked in: everything low-passed at 9 kHz, every sound faded in/out (>= 3 ms),
high-pass at 120 Hz on everything except slam, the gold sub swell and the whoosh.
"""
import json
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
SFX = ROOT / "sfx"
rng = np.random.default_rng(20)


# ------------------------------------------------------------------ helpers
def tt(sec):
    return np.arange(int(round(sec * SR))) / SR


def dbv(x):
    return 10 ** (x / 20)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "highpass", fs=SR, output="sos"), x, axis=0)


def lp(x, fc=9000, order=4):
    return signal.sosfilt(signal.butter(order, fc, "lowpass", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x, axis=0)


def fade(x, fin=0.003, fout=0.010):
    """Raised-cosine fade at both edges: no clicks, ever."""
    n = len(x)
    w = np.ones(n)
    a, b = int(fin * SR), int(fout * SR)
    if a:
        w[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if b:
        w[-b:] *= np.cos(np.linspace(0, np.pi / 2, b)) ** 2
    return x * (w if x.ndim == 1 else w[:, None])


def peak_to(x, dbfs):
    return x * (dbv(dbfs) / np.max(np.abs(x)))


def stereo(x):
    return np.stack([x, x], axis=1) if x.ndim == 1 else x


def make_ir(sec, rt60, seed, lp_fc):
    n = int(sec * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed).standard_normal(n) * np.exp(-t * np.log(1000) / rt60)
    r = lp(r, lp_fc, 2)
    return r / np.sqrt(np.sum(r ** 2))


def reverb(x, tail, rt60, wet, seed, lp_fc=6000):
    """Equal-power dry/wet convolution reverb with decorrelated L/R impulse responses."""
    x = stereo(x)
    n = len(x) + int(tail * SR)
    dry = np.zeros((n, 2))
    dry[: len(x)] = x
    out = np.zeros((n, 2))
    for ch in range(2):
        ir = make_ir(tail + 0.05, rt60, seed + ch * 17, lp_fc)
        w = signal.fftconvolve(x[:, ch], ir)[:n]
        out[: len(w), ch] = w
    return np.sqrt(1 - wet) * dry + np.sqrt(wet) * out


def write_wav(path, x):
    x = np.clip(stereo(x), -1.0, 1.0)
    i32 = (x * 8388607).astype("<i4")
    raw = i32.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()  # little-endian 24-bit
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(raw)


def finish(x, peak_db, hp_hz=120, lp_hz=9000, fin=0.003, fout=0.010):
    x = stereo(x)
    if hp_hz:
        x = hp(x, hp_hz)
    x = lp(x, lp_hz)
    x = fade(x, fin, fout)
    return peak_to(x, peak_db)


# ------------------------------------------------------------------ effects
def make_check(n):
    """Glassy tick. 2.4 kHz + 3.6 kHz overtone, ~90 ms decay, 400 ms plate tail @12% wet.
    +1 semitone per level (n = 1..7) so the sequence 'levels up'."""
    f0 = 2400 * 2 ** ((n - 1) / 12)
    t = tt(0.35)
    att = 1 - np.exp(-t / 0.0006)
    body = np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.026)
    over = 0.42 * np.sin(2 * np.pi * f0 * 1.5 * t) * np.exp(-t / 0.018)
    x = (body + over) * att
    x = reverb(x, 0.4, 0.4, 0.12, seed=100 + n, lp_fc=7000)
    return finish(x, -18)


def make_slam():
    """Sub thump: 110 -> 45 Hz over 180 ms + soft 2-4 kHz noise transient (30 ms). Peak -10 dBFS."""
    t = tt(0.6)
    f = np.where(t < 0.18, 110 * (45 / 110) ** (t / 0.18), 45.0)
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.exp(-t / 0.15) * (1 - np.exp(-t / 0.004))
    body = np.sin(ph) * env + 0.22 * np.sin(2 * ph) * np.exp(-t / 0.07)  # 2nd harmonic: audible on phone speakers
    noise = bp(rng.standard_normal(len(t)), 2000, 4000) * np.exp(-t / 0.009) * (t < 0.03) * 0.32
    x = np.tanh(1.35 * (body + noise))
    return finish(x, -10, hp_hz=0, fin=0.003, fout=0.040)


def make_pop():
    """Soft bubble pop: sine glide 500 -> 850 Hz over 45 ms, low-passed, very quiet."""
    t = tt(0.07)
    f = 500 + 350 * np.clip(t / 0.045, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.016) * (1 - np.exp(-t / 0.002))
    x = lp(x, 3200, 2)
    return finish(x, -26, fout=0.015)


def make_whoosh():
    """Filtered noise sweep 400 Hz -> 5 kHz over 280 ms, soft attack, smooth release, wide stereo."""
    dur = 0.36
    n = int(dur * SR)
    common = rng.standard_normal(n)
    chans = []
    for c in range(2):
        noise = 0.62 * rng.standard_normal(n) + 0.38 * common
        fr, tg, z = signal.stft(noise, SR, nperseg=1024, noverlap=896)
        fc = 400 * (5000 / 400) ** np.clip(tg / 0.28, 0, 1)
        fr_safe = np.maximum(fr, 1.0)[:, None]
        mask = np.exp(-0.5 * (np.log2(fr_safe / fc[None, :]) / 0.85) ** 2)
        _, y = signal.istft(z * mask, SR, nperseg=1024, noverlap=896)
        y = np.pad(y, (0, max(0, n - len(y))))[:n]
        chans.append(y)
    # tiny inter-channel delay = extra width
    d = int(0.0004 * SR)
    chans[1] = np.concatenate([np.zeros(d), chans[1][:-d]])
    x = np.stack(chans, axis=1)
    t = tt(dur)
    env = np.sin(np.pi / 2 * np.clip(t / 0.11, 0, 1)) ** 2 * np.cos(np.pi / 2 * np.clip((t - 0.22) / 0.14, 0, 1)) ** 2
    x = x * env[:, None]
    return finish(x, -18, hp_hz=0, fin=0.004, fout=0.02)


def make_chip():
    """Soft glass click (4 kHz, 20 ms) over a low thud (80 Hz + 160 Hz body, 120 ms)."""
    t = tt(0.22)
    click = np.sin(2 * np.pi * 4000 * t) * np.exp(-t / 0.005) * (1 - np.exp(-t / 0.0004)) * (t < 0.02)
    thud = (np.sin(2 * np.pi * 80 * t) * np.exp(-t / 0.04) + 0.6 * np.sin(2 * np.pi * 160 * t) * np.exp(-t / 0.03)) * (t < 0.12)
    x = 0.55 * click + 1.0 * thud
    return finish(x, -16, fout=0.03)


def make_tick():
    """Barely-there 1.8 kHz tick, 15 ms."""
    t = tt(0.015)
    x = np.sin(2 * np.pi * 1800 * t) * np.sin(np.pi * t / 0.015) ** 2
    return finish(x, -30, fin=0.002, fout=0.004)


def make_tag():
    """Quiet airy swish + soft low tone, 150 ms."""
    t = tt(0.15)
    swish = bp(rng.standard_normal(len(t)), 2500, 6500) * np.sin(np.pi * t / 0.15) ** 2 * 0.55
    tone = (np.sin(2 * np.pi * 220 * t) + 0.35 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t / 0.05) * (1 - np.exp(-t / 0.004))
    return finish(swish + 0.8 * tone, -20, fin=0.004, fout=0.03)


def make_gold():
    """Finale: A major add9 glass-harmonica chord (A4 C#5 E5 B5, slow shimmer) + hall reverb,
    rising sparkle chimes (5-8 kHz) and a warm 55 Hz sub swell. Peak -10 dBFS."""
    T = 5.4
    t = tt(T)
    n = len(t)

    # sub swell: 55 Hz rising over 1.2 s, then released (not high-passed)
    swell_env = np.where(t < 1.2, np.sin(np.pi / 2 * (t / 1.2)) ** 2, np.exp(-(t - 1.2) / 0.55))
    sub = (np.sin(2 * np.pi * 55 * t) + 0.35 * np.sin(2 * np.pi * 110 * t)) * swell_env
    sub = lp(sub, 400, 2)

    # chord, lands as the card settles (~0.85 s in)
    onset = 0.85
    tc = np.clip(t - onset, 0, None)
    chord = np.zeros(n)
    for i, f in enumerate([440.0, 554.37, 659.26, 987.77]):
        shimmer = 1 + 0.18 * np.sin(2 * np.pi * (0.35 + 0.12 * i) * t + i * 1.7)
        vib = 1 + 0.0012 * np.sin(2 * np.pi * (0.5 + 0.07 * i) * t + i)
        env = (1 - np.exp(-tc / 0.03)) * np.exp(-tc / 0.95) * (t >= onset)
        chord += np.sin(2 * np.pi * f * vib * t + i) * env * shimmer * (0.5 if i == 3 else 0.7)

    # sparkle: tiny rising chimes timed to the gold dust drifting in
    spark = np.zeros((n, 2))
    times = np.sort(rng.uniform(onset + 0.05, 3.7, 26))
    for k, s in enumerate(times):
        prog = (s - onset) / (3.7 - onset)
        f = 5000 + 3000 * prog * rng.uniform(0.75, 1.0)
        i0 = int(s * SR)
        tl = np.arange(int(0.12 * SR)) / SR
        c = (np.sin(2 * np.pi * f * tl) + 0.3 * np.sin(2 * np.pi * f * 1.5 * tl)) * np.exp(-tl / 0.022) * rng.uniform(0.04, 0.12)
        c = fade(c, 0.002, 0.01)
        pan = rng.uniform(0.2, 0.8)
        seg = spark[i0 : i0 + len(c)]
        seg[:, 0] += c[: len(seg)] * (1 - pan)
        seg[:, 1] += c[: len(seg)] * pan

    bright = stereo(chord) * 0.55 + spark
    bright = hp(bright, 120)
    bright = reverb(bright, 2.2, 2.0, 0.38, seed=700, lp_fc=5200)
    bright = bright[:n]

    x = bright + stereo(sub) * 0.62
    return finish(x, -10, hp_hz=0, fin=0.01, fout=0.15)


def make_ambient(dur, fade_sec):
    """Warm pad, A major add9, slow movement. Peak -32 dBFS. Starts/ends silent."""
    t = tt(dur)
    out = np.zeros((len(t), 2))
    notes = [164.81, 220.0, 277.18, 329.63, 493.88]
    for i, f in enumerate(notes):
        for ch in range(2):
            for d in (-1, 0, 1):
                det = 1 + d * 0.0016 * (1 + 0.3 * ch)
                lfo = 0.65 + 0.35 * np.sin(2 * np.pi * (0.05 + 0.017 * i) * t + i * 2.1 + ch * 0.9 + d)
                out[:, ch] += np.sin(2 * np.pi * f * det * t + i + d) * lfo * (0.9 if i < 3 else 0.5)
    out = lp(out, 1500, 2)
    out = hp(out, 120)
    env = np.sin(np.pi / 2 * np.clip(t / fade_sec, 0, 1)) ** 2 * np.cos(np.pi / 2 * np.clip((t - (dur - fade_sec)) / fade_sec, 0, 1)) ** 2
    out = out * env[:, None]
    return peak_to(out, -32)


# ------------------------------------------------------------------ build
def build_effects():
    fx = {"slam": make_slam(), "pop": make_pop(), "whoosh": make_whoosh(), "chip": make_chip(),
          "tick": make_tick(), "tag": make_tag(), "gold": make_gold()}
    for n in range(1, 8):
        fx[f"check_{n}"] = make_check(n)
    fx["check"] = fx["check_1"]
    return fx


def load_cues():
    node = shutil.which("node")
    if not node:
        sys.exit("node is required to read src/config.ts")
    r = subprocess.run([node, "--no-warnings", str(ROOT / "scripts" / "export-cues.mjs")], capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        sys.exit(r.stderr)
    return json.loads(r.stdout)


def main():
    SFX.mkdir(exist_ok=True)
    (ROOT / "out").mkdir(exist_ok=True)
    (ROOT / "public").mkdir(exist_ok=True)

    cfg = load_cues()
    fx = build_effects()
    for name, x in fx.items():
        write_wav(SFX / f"{name}.wav", x)

    amb_cfg = cfg["ambient"]
    amb = make_ambient(amb_cfg["to"] - amb_cfg["from"], amb_cfg["fadeSec"])
    write_wav(SFX / "ambient.wav", amb)

    total = int(round(cfg["reelDuration"] * SR))
    stem = np.zeros((total, 2))
    i0 = int(round(amb_cfg["from"] * SR))
    stem[i0 : i0 + len(amb)] += amb[: total - i0]

    placed = skipped = 0
    for c in cfg["cues"]:
        x = fx[Path(c["file"]).stem] * dbv(c["gainDb"])
        s = int(round(c["time"] * SR))
        if s < 0:
            x = x[-s:]
            s = 0
        if s >= total:
            skipped += 1
            continue
        end = min(total, s + len(x))
        stem[s:end] += x[: end - s]
        placed += 1

    peak = float(np.max(np.abs(stem)))
    if peak > dbv(-1.0):
        stem *= dbv(-1.0) / peak  # safety limiter, never hit with the default cues
    write_wav(SFX / "sfx_stem.wav", stem)
    for d in (ROOT / "out", ROOT / "public"):
        shutil.copyfile(SFX / "sfx_stem.wav", d / "sfx_stem.wav")

    # ---- report
    print(f"\nAUDIO_OFFSET = {cfg['audioOffset']:+.2f}s   cues placed: {placed}   skipped (past end): {skipped}")
    print(f"stem peak: {20*np.log10(max(np.max(np.abs(stem)),1e-9)):.1f} dBFS   length: {len(stem)/SR:.2f}s\n")
    print("effect files (48 kHz / 24-bit stereo):")
    for name, x in {**fx, "ambient": amb}.items():
        y = stereo(x)
        pk = 20 * np.log10(np.max(np.abs(y)))
        spec = np.abs(np.fft.rfft(y[:, 0])) ** 2
        fr = np.fft.rfftfreq(len(y), 1 / SR)
        hi = spec[fr > 9500].sum() / max(spec.sum(), 1e-20)
        print(f"  {name+'.wav':14s} {len(y)/SR:5.2f}s  peak {pk:6.1f} dBFS   edges {abs(y[0]).max():.5f}/{abs(y[-1]).max():.5f}   >9.5kHz {10*np.log10(hi+1e-20):6.1f} dB")

    lines = ["| # | cue | time (s) | file |", "|---|-----|---------:|------|"]
    for i, c in enumerate(cfg["cues"], 1):
        lines.append(f"| {i} | {c['name']} | {c['time']:.3f} | {c['file']} |")
    lines.append(f"| – | ambient bed | {amb_cfg['from']:.3f} → {amb_cfg['to']:.3f} | ambient.wav |")
    (SFX / "CUES.md").write_text("# SFX cue table (reel seconds, AUDIO_OFFSET and lead already applied)\n\n" + "\n".join(lines) + "\n")
    print(f"\nwrote {len(cfg['cues'])} cues -> sfx/CUES.md   stem -> sfx/sfx_stem.wav, out/sfx_stem.wav, public/sfx_stem.wav")


if __name__ == "__main__":
    main()
