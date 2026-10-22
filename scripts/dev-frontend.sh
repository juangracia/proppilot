#!/usr/bin/env bash
# Install deps if needed and start the Vite dev server in the background. Idempotent.
set -euo pipefail
. "$(dirname "$0")/_lib.sh"

if curl -fsS -o /dev/null "http://localhost:$FRONTEND_PORT/" 2>/dev/null; then
  echo "frontend: already answering on :$FRONTEND_PORT"
  exit 0
fi
other="$(port_pid "$FRONTEND_PORT" || true)"
if [ -n "$other" ]; then
  echo "frontend: port $FRONTEND_PORT is used by pid $other but does not answer" >&2
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
