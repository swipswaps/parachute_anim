#!/bin/bash
# windsurf-fix.sh — Optimized Windsurf launcher for slow/legacy systems (A1286, Debian 12)

set -euo pipefail

# === 📂 Timestamped log path ===
LOG_DIR="$HOME/.windsurf_logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/windsurf_log_$(date +'%Y_%m_%d_%H_%M_%S').txt"

# === 🧠 Environment Setup for Electron ===
export ELECTRON_ENABLE_LOGGING=true
export ELECTRON_FORCE_IS_PACKAGED=true
export LIBGL_ALWAYS_SOFTWARE=1
export MESA_GL_VERSION_OVERRIDE=3.3
#export VDPAU_DRIVER=va_gl
export LIBVA_DRIVER_NAME=i965

# === ⚙️ Check for basic GLX support ===
echo "[*] Checking for GLX support..." | tee -a "$LOG_FILE"
if ! glxinfo > /dev/null 2>&1; then
    echo "[!] GLX not available. Expect software fallback only." | tee -a "$LOG_FILE"
else
    echo "[+] GLX detected: $(glxinfo | grep 'OpenGL renderer' | head -1)" | tee -a "$LOG_FILE"
fi

# === 🚀 Launch Windsurf with safe flags ===
echo "[*] Launching Windsurf..." | tee -a "$LOG_FILE"

windsurf \
    --disable-extensions \
    --disable-gpu \
    --disable-gpu-compositing \
    --disable-software-rasterizer \
    --disable-accelerated-2d-canvas \
    --disable-renderer-accessibility \
    --disable-features=UseOzonePlatform,WebGL \
    --use-gl=swiftshader \
    --enable-logging \
    --log-level=error \
    --verbose \
    --user-data-dir="$HOME/.windsurf_clean_profile" \
    . 2>&1 | tee -a "$LOG_FILE"
