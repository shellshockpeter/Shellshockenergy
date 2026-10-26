#!/usr/bin/env bash
# Prepares raw iPhone recordings (public/clips/raw/*) into the clip files the composition uses.
# Raw files stay out of git. Privacy: D is cut before a real person's Instagram notification
# appears; E is cut to the friends list only.
set -euo pipefail
cd "$(dirname "$0")/../public/clips"
enc() { ffmpeg -v error -y "$@" -an -r 30 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart; }
V="scale=720:1560:flags=lanczos"
enc -i raw/A.mov -vf "$V" clip05.mp4                                  # MAP: tap chest, tap legs
enc -i raw/B.mp4 -vf "$V" clip06.mp4                                  # NUTRITION: diary, weigh-in, GOAL REACHED, GOALS
cp clip06.mp4 clip07.mp4
enc -i raw/C.mov -vf "$V" clip09.mp4                                  # BADGES: 5/30 UNLOCKED, DEMIGOD STATUS
enc -i raw/D.mp4 -t 5.8 -vf "$V" clip10.mp4                           # CHALLENGES: JOIN CHALLENGE (cut before IG banner)
enc -i raw/E.mov -ss 1.5 -t 1.7 -vf "$V" clip11.mp4   # FRIENDS list (names visible)

# ── batch 2 ──
# F: RANK UP screen (1094x2068 -> cover-crop to 720x1560); cut before Control Center at the end
enc -i raw/F.mov -t 6.2 -vf "scale=-2:1560:flags=lanczos,crop=720:1560" clip01.mp4
# G: LOG AN EXERCISE (pick, 150 x 10, est 1RM 200, save) - 5x speed ramp
enc -i raw/G.mov -ss 0.4 -t 8.6 -vf "${V},setpts=PTS/5" clip04.mp4
# H: LOG A PERSONAL RECORD 500 x 2 -> 533 est 1RM -> VERIFICATION REQUIRED
enc -i raw/H.mov -vf "$V" clip02.mp4
# I: nutrition add food -> diary -> calories remaining - 4x speed
enc -i raw/I.mov -ss 0.4 -t 8.0 -vf "${V},setpts=PTS/4" clip13.mp4
# J: routines (new split -> template -> this week A/B -> workout)
enc -i raw/J.mov -vf "$V" clip03.mp4
ls -la clip*.mp4
