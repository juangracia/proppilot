#!/usr/bin/env bash
# Start db, backend, frontend. Idempotent. Add --seed to load demo data.
set -euo pipefail
. "$(dirname "$0")/_lib.sh"
"$ROOT/scripts/dev-db.sh"
"$ROOT/scripts/dev-backend.sh"
"$ROOT/scripts/dev-frontend.sh"
[ "${1:-}" = "--seed" ] && "$ROOT/scripts/seed.sh"
echo
echo "frontend  http://localhost:$FRONTEND_PORT"
echo "backend   http://localhost:$BACKEND_PORT/api  (swagger: /swagger-ui.html)"
echo "postgres  localhost:$DB_PORT  db/user proppilot"
