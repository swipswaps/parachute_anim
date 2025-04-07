#!/bin/bash
# launch_windsurf.sh — clean, fast, extension-free Windsurf launcher

set -euo pipefail

PROFILE="$HOME/.windsurf_clean"
LOG_DIR="$HOME/.windsurf_logs"
mkdir -p "$PROFILE" "$LOG_DIR"
LOG_FILE="$LOG_DIR/windsurf_$(date +'%Y_%m_%d_%H_%M_%S').log"

# Safe fallback: enforce software rendering
export LIBGL_ALWAYS_SOFTWARE=1
export MESA_GL_VERSION_OVERRIDE=3.3

echo "[*] Launching Windsurf..." | tee -a "$LOG_FILE"
exec windsurf \
  --disable-gpu \
  --disable-extensions \
  --user-data-dir="$PROFILE" \
  --verbose . 2>&1 | tee -a "$LOG_FILE"
