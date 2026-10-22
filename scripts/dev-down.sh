#!/usr/bin/env bash
# Stop only what dev-up started (pid files in .dev/). Add --db to also stop the db container
# if dev-db started it. Data volume is kept.
set -euo pipefail
. "$(dirname "$0")/_lib.sh"

stop_pidfile() {
  local f="$STATE_DIR/$1.pid"
  [ -f "$f" ] || { echo "$1: no pid file, nothing to stop"; return 0; }
  local pid; pid="$(cat "$f")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    echo "$1: stopped pid $pid"
  else
    echo "$1: pid $pid already gone"
  fi
  rm -f "$f"
}
stop_pidfile frontend
stop_pidfile backend
if [ "${1:-}" = "--db" ]; then
  if [ -f "$STATE_DIR/db.started" ]; then
    docker compose -p "$COMPOSE_PROJECT" -f "$ROOT/proppilot-backend/docker-compose.yml" down
    rm -f "$STATE_DIR/db.started"
    echo "db: container removed, data volume kept"
  else
    echo "db: not started by dev-up, leaving it"
  fi
fi
