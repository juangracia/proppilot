#!/usr/bin/env bash
# Starts Postgres (Docker) and the Spring Boot backend with the `local` profile (no auth).
# Settings come from .dev.env (see .dev.env.example): POSTGRES_PORT, BACKEND_PORT, DB_NAME, PROPPILOT_JAVA_HOME.
# In a parallel worktree (scripts/wt.sh) the slot's own Postgres container (PG_CONTAINER) already runs; compose is only for slot 0.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/env.sh"
source "$ROOT/scripts/lib/java.sh"
load_dev_env "$ROOT"
use_project_jdk

cd "$ROOT/proppilot-backend"
if [[ "$PG_CONTAINER" == proppilot-postgres && -z "$(docker ps -q -f name=^proppilot-postgres$)" ]]; then
  docker compose up -d
fi
until docker exec "$PG_CONTAINER" pg_isready -U proppilot >/dev/null 2>&1; do sleep 1; done
ensure_database "$DB_NAME"

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-local}"
export SHOW_SQL="${SHOW_SQL:-false}"
exec mvn -q spring-boot:run
