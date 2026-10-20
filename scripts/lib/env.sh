# Loads per-machine overrides from $ROOT/.dev.env (gitignored; see .dev.env.example)
# and derives the ports and JDBC URL the backend, frontend and tests use.
# Slot 0 (the main stack) keeps the defaults: backend 8080, frontend 3000, database proppilot.
load_dev_env() {
  local root="$1"
  if [[ -f "$root/.dev.env" ]]; then
    set -a
    source "$root/.dev.env"
    set +a
  fi
  export POSTGRES_PORT="${POSTGRES_PORT:-5433}"
  export BACKEND_PORT="${BACKEND_PORT:-8080}"
  export FRONTEND_PORT="${FRONTEND_PORT:-3000}"
  export DB_NAME="${DB_NAME:-proppilot}"
  # Docker container that holds the database. Slot 0 uses the compose one; a worktree slot has its own.
  export PG_CONTAINER="${PG_CONTAINER:-proppilot-postgres}"
  export DATABASE_URL="${DATABASE_URL:-jdbc:postgresql://localhost:${POSTGRES_PORT}/${DB_NAME}}"
  # The backend reads server.port from PORT. Tie it to this slot so a stray PORT cannot clash.
  export PORT="$BACKEND_PORT"
}

# Creates database $1 in $PG_CONTAINER if it is missing.
ensure_database() {
  local db="$1"
  if ! docker exec "$PG_CONTAINER" psql -U proppilot -d postgres -Atc \
      "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1; then
    docker exec "$PG_CONTAINER" psql -q -U proppilot -d postgres -c "CREATE DATABASE \"$db\""
  fi
}
