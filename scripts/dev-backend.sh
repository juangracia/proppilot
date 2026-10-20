#!/usr/bin/env bash
# Starts Postgres (Docker) and the Spring Boot backend with the `local` profile (no auth).
# Settings come from .dev.env (see .dev.env.example): POSTGRES_PORT, PROPPILOT_JAVA_HOME.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/env.sh"
source "$ROOT/scripts/lib/java.sh"
load_dev_env "$ROOT"
use_project_jdk

cd "$ROOT/proppilot-backend"
docker compose up -d
until docker exec proppilot-postgres pg_isready -U proppilot >/dev/null 2>&1; do sleep 1; done

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-local}"
export SHOW_SQL="${SHOW_SQL:-false}"
exec mvn -q spring-boot:run
