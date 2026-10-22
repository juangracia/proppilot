#!/usr/bin/env bash
# Install deps if needed and start the Vite dev server in the background. Idempotent.
set -euo pipefail
. "$(dirname "$0")/_lib.sh"

if owned frontend "$FRONTEND_PORT"; then
  echo "frontend: ours, already up on :$FRONTEND_PORT"; exit 0
fi
other="$(port_pid "$FRONTEND_PORT" || true)"
if [ -n "$other" ]; then
  echo "frontend: port $FRONTEND_PORT is taken by pid $other, not started by this checkout. Stop it or set FRONTEND_PORT." >&2
  exit 1
fi
cd "$ROOT/proppilot-frontend"
# plain `npm ci` fails with ERESOLVE (capacitor-google-auth peer range), so --legacy-peer-deps.
[ -d node_modules/.bin ] || npm ci --legacy-peer-deps
# vite.config.js hardcodes 3000 and the /api proxy to 8080; --port/--strictPort keep the .dev.env value honest.
nohup ./node_modules/.bin/vite --port "$FRONTEND_PORT" --strictPort >"$STATE_DIR/frontend.log" 2>&1 &
echo $! >"$STATE_DIR/frontend.pid"
wait_http "http://localhost:$FRONTEND_PORT/" frontend 60
echo "frontend: up on :$FRONTEND_PORT (pid $(cat "$STATE_DIR/frontend.pid"), log .dev/frontend.log)"
