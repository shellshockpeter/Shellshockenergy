#!/usr/bin/env bash
# Prepares raw iPhone recordings (public/clips/raw/*) into the clip files the composition uses.
# Raw files stay out of git. Privacy: D is cut before a real person's Instagram notification
# appears; E is cut to the friends list only and its name column is blurred.
set -euo pipefail
cd "$(dirname "$0")/../public/clips"
enc() { ffmpeg -v error -y "$@" -an -r 30 -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart; }
V="scale=720:1560:flags=lanczos"
enc -i raw/A.mov -vf "$V" clip05.mp4                                  # MAP: tap chest, tap legs
enc -i raw/B.mp4 -vf "$V" clip06.mp4                                  # NUTRITION: diary, weigh-in, GOAL REACHED, GOALS
cp clip06.mp4 clip07.mp4
enc -i raw/C.mov -vf "$V" clip09.mp4                                  # BADGES: 5/30 UNLOCKED, DEMIGOD STATUS
enc -i raw/D.mp4 -t 5.8 -vf "$V" clip10.mp4                           # CHALLENGES: JOIN CHALLENGE (cut before IG banner)
enc -i raw/E.mov -ss 1.5 -t 1.7 \
  -filter_complex "[0:v]${V},split[a][b];[b]crop=w=iw*0.55:h=ih*0.89:x=iw*0.11:y=ih*0.11,boxblur=26:4[bl];[a][bl]overlay=x=W*0.11:y=H*0.11" clip11.mp4   # FRIENDS (names blurred)
ls -la clip*.mp4
