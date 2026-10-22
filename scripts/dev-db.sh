#!/usr/bin/env bash
# Start Postgres (compose service in proppilot-backend). Idempotent.
set -euo pipefail
. "$(dirname "$0")/_lib.sh"

if [ "$(docker inspect -f '{{.State.Running}}' "$PG_CONTAINER" 2>/dev/null || true)" = "true" ]; then
  echo "db: $PG_CONTAINER already running"
else
  other="$(port_pid "$DB_PORT" || true)"
  if [ -n "$other" ]; then
    echo "db: port $DB_PORT is used by pid $other, not by $PG_CONTAINER. Free it first." >&2
    exit 1
  fi
  docker compose -p "$COMPOSE_PROJECT" -f "$ROOT/proppilot-backend/docker-compose.yml" up -d
  touch "$STATE_DIR/db.started"
fi
for _ in $(seq 1 30); do
  docker exec "$PG_CONTAINER" pg_isready -U proppilot -d proppilot >/dev/null 2>&1 && { echo "db: ready on :$DB_PORT"; exit 0; }
  sleep 1
done
echo "db: not ready after 30s" >&2
exit 1
