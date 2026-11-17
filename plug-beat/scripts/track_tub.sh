#!/usr/bin/env bash
# One command: sets up a private Python environment (first time only), then locks the outline to the tub.
#   npm run track-tub                      (tracks 1.0s-6.0s of your video)
#   npm run track-tub -- --start 1 --end 8 (any scripts/track_tub.py option goes after the --)
set -e
cd "$(dirname "$0")/.."

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 was not found. On a Mac, install it with:  xcode-select --install   (then run this again)"; exit 1
fi

if [ ! -x .venv-track/bin/python ]; then
  echo "First run: creating a private Python environment (.venv-track) and installing OpenCV (about 1 minute)..."
  python3 -m venv .venv-track
  .venv-track/bin/pip install --quiet --upgrade pip
  .venv-track/bin/pip install --quiet opencv-contrib-python numpy scipy
fi

if [ "$#" -eq 0 ]; then
  set -- --start 1.0 --end 6.0 --debug
fi
.venv-track/bin/python scripts/track_tub.py "$@"

echo
echo "Done. Now: restart/refresh Studio, open Video1Overlay and turn on the showTubGuide prop."
echo "It should say 'tracked pose' (not 'static (no track)'). Look at out/track-debug/ to see where the tub was found."
