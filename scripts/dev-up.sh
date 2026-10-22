#!/usr/bin/env bash
# Start db, backend, frontend. Idempotent. Add --seed to load demo data.
# Checks all three ports first, so a taken port never leaves a new DB container behind.
set -euo pipefail
. "$(dirname "$0")/_lib.sh"

busy=0
check_port() { # name port ok_if_running_check...
  local name="$1" port="$2" pid; shift 2
  "$@" && return 0
  pid="$(port_pid "$port" || true)"
  if [ -n "$pid" ]; then echo "$name: port $port is taken by pid $pid, not by this checkout. Free it or change the port." >&2; busy=1; fi
}
db_running() { [ "$(docker inspect -f '{{.State.Running}}' "$PG_CONTAINER" 2>/dev/null || true)" = "true" ]; }
check_port db "$DB_PORT" db_running
check_port backend "$BACKEND_PORT" owned backend "$BACKEND_PORT"
check_port frontend "$FRONTEND_PORT" owned frontend "$FRONTEND_PORT"
[ "$busy" = 0 ] || { echo "dev-up: aborted before starting anything." >&2; exit 1; }

"$ROOT/scripts/dev-db.sh"
"$ROOT/scripts/dev-backend.sh"
"$ROOT/scripts/dev-frontend.sh"
[ "${1:-}" = "--seed" ] && "$ROOT/scripts/seed.sh"
echo
echo "frontend  http://localhost:$FRONTEND_PORT"
echo "backend   http://localhost:$BACKEND_PORT/api  (swagger: /swagger-ui.html)"
echo "postgres  localhost:$DB_PORT  db/user proppilot"
