# Loads per-machine overrides from $ROOT/.dev.env (gitignored; see .dev.env.example)
# and derives the JDBC URL the backend and its tests use.
load_dev_env() {
  local root="$1"
  if [[ -f "$root/.dev.env" ]]; then
    set -a
    source "$root/.dev.env"
    set +a
  fi
  export POSTGRES_PORT="${POSTGRES_PORT:-5433}"
  export DATABASE_URL="${DATABASE_URL:-jdbc:postgresql://localhost:${POSTGRES_PORT}/proppilot}"
}
