# Shared helpers. Source this file; do not execute it.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT/.dev"
mkdir -p "$STATE_DIR"
set -a
. "$ROOT/.dev.env"
set +a
export JAVA_HOME PATH="$JAVA_HOME/bin:$PATH"
API="http://localhost:$BACKEND_PORT/api"
PG_CONTAINER=proppilot-postgres

port_pid() { lsof -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null | head -1; }

wait_http() { # url label timeout_seconds
  local i=0
  until curl -fsS -o /dev/null "$1" 2>/dev/null; do
    i=$((i + 1))
    if [ "$i" -ge "${3:-90}" ]; then echo "timeout waiting for $2 ($1)" >&2; return 1; fi
    sleep 1
  done
}

psql_exec() { docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U proppilot -d proppilot "$@"; }
