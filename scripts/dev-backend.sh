#!/usr/bin/env bash
# Build and start the Spring Boot backend (JDK 17, profile local) in the background. Idempotent.
set -euo pipefail
. "$(dirname "$0")/_lib.sh"

if owned backend "$BACKEND_PORT"; then
  curl -fsS -o /dev/null "$API/countries" && { echo "backend: ours, already up on :$BACKEND_PORT"; exit 0; }
fi
other="$(port_pid "$BACKEND_PORT" || true)"
if [ -n "$other" ]; then
  echo "backend: port $BACKEND_PORT is taken by pid $other, not started by this checkout. Stop it or set BACKEND_PORT." >&2
  exit 1
fi
"$ROOT/scripts/dev-db.sh"
cd "$ROOT/proppilot-backend"
echo "backend: building with $(java -version 2>&1 | head -1)"
mvn -B -q -DskipTests package
SPRING_PROFILES_ACTIVE=local \
DATABASE_URL="jdbc:postgresql://localhost:$DB_PORT/proppilot" \
PORT="$BACKEND_PORT" \
  nohup java -jar target/prop-pilot-backend-1.0.0.jar >"$STATE_DIR/backend.log" 2>&1 &
echo $! >"$STATE_DIR/backend.pid"
wait_http "$API/countries" backend 90
echo "backend: up on :$BACKEND_PORT (pid $(cat "$STATE_DIR/backend.pid"), log .dev/backend.log)"
