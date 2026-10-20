#!/usr/bin/env bash
# Parallel worktree stacks. Each worktree gets a slot: its own backend port, frontend port and
# Postgres container (proppilot-pg-wtN, own volume, :5440+N), so databases never mix.
# Slot 0 is the main stack (8080/3000, container proppilot-postgres).
#   scripts/wt.sh new <name> [base-ref]   worktree .claude/worktrees/<name>, branch feat/<name>, next free slot
#   scripts/wt.sh up <name> [--force]     Postgres container, backend (jar, small JVM) + vite in the background
#   scripts/wt.sh down <name>
#   scripts/wt.sh seed <name>             reset and seed only that slot's database
#   scripts/wt.sh verify <name> [--e2e]   scripts/verify.sh inside that worktree against its own stack
#   scripts/wt.sh ls                      slots, ports, state, RSS per stack
#   scripts/wt.sh rm <name> [--force]     down, delete its Postgres container and volume, remove the worktree (the branch stays)
# Limits (override in .dev.env): MAX_STACKS=4 slots, MIN_FREE_MEM_PCT=15 (macOS "free percentage"), BACKEND_JAVA_OPTS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/lib/env.sh"
source "$ROOT/scripts/lib/java.sh"
load_dev_env "$ROOT"

MAX_STACKS="${MAX_STACKS:-4}"
MIN_FREE_MEM_PCT="${MIN_FREE_MEM_PCT:-15}"
BACKEND_JAVA_OPTS="${BACKEND_JAVA_OPTS:--Xms64m -Xmx512m -XX:MaxMetaspaceSize=192m -Xss512k -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:+ExitOnOutOfMemoryError}"
# Worktrees live next to the main checkout, whichever worktree this script runs from.
MAIN_ROOT="$(cd "$ROOT" && cd "$(git rev-parse --git-common-dir)/.." && pwd)"
WT_DIR="$MAIN_ROOT/.claude/worktrees"

die() { echo "wt: $*" >&2; exit 1; }

# --- slot files -------------------------------------------------------------------------------

# Value of KEY in a worktree's .dev.env, empty if unset.
dev_env_get() { grep -s "^$2=" "$1/.dev.env" | tail -1 | cut -d= -f2- || true; }
# Names of worktrees that hold a slot (SLOT > 0 in .dev.env).
slot_names() {
  local d
  for d in "$WT_DIR"/*/; do
    d="${d%/}"
    [[ -n "$(dev_env_get "$d" SLOT)" && "$(dev_env_get "$d" SLOT)" != 0 ]] && basename "$d"
  done
  return 0
}
wt_path() {
  local dir="$WT_DIR/$1"
  [[ -d "$dir" && -n "$(dev_env_get "$dir" SLOT)" ]] || die "no slot worktree named '$1' (see: scripts/wt.sh ls)"
  echo "$dir"
}
# Runs a command with the slot's own settings (ports, DATABASE_URL), not the caller's.
in_slot() {
  local dir="$1"; shift
  ( unset DATABASE_URL PORT BACKEND_PORT FRONTEND_PORT DB_NAME PG_CONTAINER
    load_dev_env "$dir"
    "$@" )
}

# --- processes --------------------------------------------------------------------------------

pid_of() { local f="$1/.stack/$2.pid"; [[ -f "$f" ]] && cat "$f" || true; }
alive() { [[ -n "${1:-}" ]] && kill -0 "$1" 2>/dev/null; }
# Memory in MB of one process. macOS compresses idle pages, so ps RSS undercounts a JVM a lot;
# `footprint` reports the real physical footprint. Falls back to RSS.
proc_mb() {
  local mb
  mb="$(footprint -p "$1" 2>/dev/null | awk '/phys_footprint:/ { v = $2; u = $3; if (u == "KB") v /= 1024; if (u == "GB") v *= 1024; printf "%d", v; exit }')"
  echo "${mb:-$(( $(ps -o rss= -p "$1" 2>/dev/null | tr -d ' ' || echo 0) / 1024 ))}"
}
# Memory in MB of a process and its children.
tree_mem_mb() {
  local pid="$1" mb=0 p
  alive "$pid" || { echo 0; return; }
  for p in "$pid" $(pgrep -P "$pid" 2>/dev/null || true); do
    mb=$(( mb + $(proc_mb "$p") ))
  done
  echo "$mb"
}
stop_tree() {
  local pid="$1" p i
  alive "$pid" || return 0
  for p in $(pgrep -P "$pid" 2>/dev/null || true); do kill "$p" 2>/dev/null || true; done
  kill "$pid" 2>/dev/null || true
  for i in {1..20}; do alive "$pid" || return 0; sleep 0.5; done
  kill -9 "$pid" 2>/dev/null || true
}
port_free() { ! lsof -ti "tcp:$1" -sTCP:LISTEN >/dev/null 2>&1; }
free_mem_pct() { memory_pressure | awk '/free percentage/ { gsub("%", "", $5); print $5 }'; }
wait_for() { # url pid seconds
  local i
  for ((i = 0; i < $3; i++)); do
    curl -sf -o /dev/null "$1" && return 0
    alive "$2" || return 1
    sleep 1
  done
  return 1
}
# One small Postgres per slot. Lean: 32 MB shared buffers, 30 connections, 256 MB hard cap.
pg_create() { # container port
  docker run -d --name "$1" --memory 256m -p "$2:5432" -v "$1-data:/var/lib/postgresql/data" \
    -e POSTGRES_USER=proppilot -e POSTGRES_PASSWORD=proppilot123 -e POSTGRES_DB=proppilot \
    postgres:15 -c shared_buffers=32MB -c max_connections=30 -c work_mem=2MB \
    -c maintenance_work_mem=16MB -c effective_cache_size=64MB >/dev/null
}
pg_wait() {
  local i
  for i in {1..60}; do
    docker exec "$1" pg_isready -U proppilot >/dev/null 2>&1 && return 0
    sleep 1
  done
  die "Postgres container $1 did not become ready"
}
pg_start() { # container: start it if stopped
  [[ -n "$(docker ps -q -f "name=^$1$")" ]] || docker start "$1" >/dev/null
  pg_wait "$1"
}
pg_mem_mb() { docker stats --no-stream --format '{{.MemUsage}}' "$1" 2>/dev/null | awk '{ v = $1; if (v ~ /GiB/) v *= 1024; printf "%d", v }'; }

# --- commands ---------------------------------------------------------------------------------

cmd_new() {
  local name="${1:-}" base="${2:-feat/harness-setup}" slot used dir
  [[ "$name" =~ ^[a-z0-9][a-z0-9-]*$ ]] || die "usage: wt.sh new <name> [base-ref] (name: lowercase letters, digits, dashes)"
  dir="$WT_DIR/$name"
  [[ ! -e "$dir" ]] || die "$dir already exists"
  used=" $(for n in $(slot_names); do dev_env_get "$WT_DIR/$n" SLOT; done | tr '\n' ' ') "
  for ((slot = 1; slot <= MAX_STACKS; slot++)); do
    [[ "$used" != *" $slot "* ]] && port_free $((8080 + slot)) && port_free $((3000 + slot)) && port_free $((5440 + slot)) && break
  done
  (( slot <= MAX_STACKS )) || die "all $MAX_STACKS slots are taken or their ports are busy (MAX_STACKS in .dev.env). Remove one: wt.sh rm <name>"

  git -C "$ROOT" worktree add "$dir" -b "feat/$name" "$base"
  cat > "$dir/.dev.env" <<EOF
# Written by scripts/wt.sh. Slot $slot of the parallel stacks.
SLOT=$slot
BACKEND_PORT=$((8080 + slot))
FRONTEND_PORT=$((3000 + slot))
DB_NAME=proppilot
PG_CONTAINER=proppilot-pg-wt$slot
POSTGRES_PORT=$((5440 + slot))
MAX_STACKS=$MAX_STACKS
MIN_FREE_MEM_PCT=$MIN_FREE_MEM_PCT
EOF
  pg_create "proppilot-pg-wt$slot" $((5440 + slot))
  install_frontend_deps "$dir"
  pg_wait "proppilot-pg-wt$slot"
  echo "wt: '$name' is slot $slot. Backend :$((8080 + slot)), frontend :$((3000 + slot)), Postgres proppilot-pg-wt$slot :$((5440 + slot))."
  echo "wt: next: scripts/wt.sh up $name && scripts/wt.sh seed $name"
}

# Cheapest safe install: clone the main checkout's node_modules (APFS copy-on-write, instant, no extra disk)
# when the lockfile matches, else npm ci from the offline cache.
install_frontend_deps() {
  local dest="$1/proppilot-frontend" src="$ROOT/proppilot-frontend"
  if [[ -d "$src/node_modules" ]] && cmp -s "$src/package-lock.json" "$dest/package-lock.json" \
      && cp -cR "$src/node_modules" "$dest/node_modules" 2>/dev/null; then
    rm -rf "$dest/node_modules/.vite"
    echo "wt: node_modules cloned from $src (same lockfile)"
  else
    rm -rf "$dest/node_modules"
    (cd "$dest" && npm ci --prefer-offline --legacy-peer-deps --no-audit --no-fund --loglevel=error)
  fi
}

cmd_up() {
  local name="${1:-}" force=false dir slot running n pct jar
  [[ "${2:-}" == "--force" ]] && force=true
  dir="$(wt_path "$name")"
  slot="$(dev_env_get "$dir" SLOT)"
  alive "$(pid_of "$dir" backend)" && die "'$name' is already up"

  if [[ "$force" == false ]]; then
    running=0
    for n in $(slot_names); do alive "$(pid_of "$WT_DIR/$n" backend)" && running=$((running + 1)); done
    (( running < MAX_STACKS )) || die "$running stacks already up (MAX_STACKS=$MAX_STACKS). Stop one or use --force."
    pct="$(free_mem_pct)"
    (( pct >= MIN_FREE_MEM_PCT )) || die "free memory is ${pct}% (MIN_FREE_MEM_PCT=$MIN_FREE_MEM_PCT). Close something or use --force."
  fi
  pg_start "$(dev_env_get "$dir" PG_CONTAINER)"
  mkdir -p "$dir/.stack"

  echo "wt: building backend jar ($name)"
  use_project_jdk
  (cd "$dir/proppilot-backend" && MAVEN_OPTS="-Xmx384m -XX:+UseSerialGC" mvn -q -DskipTests package) \
    || die "backend build failed"
  jar="$(ls "$dir"/proppilot-backend/target/*.jar | grep -v '\.original$' | head -1)"

  # No devtools in the fat jar, small heap, one GC thread, C1 only. Pool of 5 keeps Postgres connections low.
  in_slot "$dir" bash -c '
    cd "$1/proppilot-backend"
    export SPRING_PROFILES_ACTIVE=local SHOW_SQL=false SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=5
    nohup java $2 -jar "$3" > "$1/.stack/backend.log" 2>&1 &
    echo $! > "$1/.stack/backend.pid"
  ' _ "$dir" "$BACKEND_JAVA_OPTS" "$jar"
  wait_for "http://localhost:$((8080 + slot))/api/countries" "$(pid_of "$dir" backend)" 180 \
    || die "backend did not answer on :$((8080 + slot)). See $dir/.stack/backend.log"

  in_slot "$dir" bash -c '
    cd "$1/proppilot-frontend"
    export NODE_OPTIONS=--max-old-space-size=256
    nohup node_modules/.bin/vite > "$1/.stack/frontend.log" 2>&1 &
    echo $! > "$1/.stack/frontend.pid"
  ' _ "$dir"
  wait_for "http://localhost:$((3000 + slot))/" "$(pid_of "$dir" frontend)" 60 \
    || die "frontend did not answer on :$((3000 + slot)). See $dir/.stack/frontend.log"
  echo "wt: '$name' up. UI http://localhost:$((3000 + slot))  API http://localhost:$((8080 + slot))/api"
}

cmd_down() {
  local dir; dir="$(wt_path "${1:-}")"
  stop_tree "$(pid_of "$dir" frontend)"
  stop_tree "$(pid_of "$dir" backend)"
  rm -f "$dir/.stack/backend.pid" "$dir/.stack/frontend.pid"
  docker stop "$(dev_env_get "$dir" PG_CONTAINER)" >/dev/null 2>&1 || true # data stays in its volume
  echo "wt: '$1' down"
}

cmd_seed() {
  local dir slot; dir="$(wt_path "${1:-}")"; slot="$(dev_env_get "$dir" SLOT)"
  alive "$(pid_of "$dir" backend)" || die "'$1' is not up. Run: scripts/wt.sh up $1"
  python3 "$ROOT/scripts/seed.py" --reset --api "http://localhost:$((8080 + slot))/api" \
    --db "$(dev_env_get "$dir" DB_NAME)" --container "$(dev_env_get "$dir" PG_CONTAINER)"
}

cmd_verify() {
  local dir; dir="$(wt_path "${1:-}")"; shift
  local args=("$@")
  alive "$(pid_of "$dir" backend)" || die "'$dir' is not up. Run: scripts/wt.sh up <name> && scripts/wt.sh seed <name>"
  # Cap the Maven and surefire JVMs so several verifies can run side by side.
  ( cd "$dir" && JAVA_TOOL_OPTIONS="-Xmx512m -XX:+UseSerialGC" in_slot "$dir" scripts/verify.sh ${args[@]+"${args[@]}"} )
}

cmd_ls() {
  local n dir slot be fe pg state fmt='%-5s %-14s %-8s %-9s %-6s %7s %7s %7s\n'
  printf "$fmt" SLOT NAME BACKEND FRONTEND STATE BE_MB FE_MB PG_MB
  # Slot 0: whatever listens on 8080/3000 (the main stack, not managed by this script).
  be="$(lsof -ti tcp:8080 -sTCP:LISTEN 2>/dev/null | head -1 || true)"
  fe="$(lsof -ti tcp:3000 -sTCP:LISTEN 2>/dev/null | head -1 || true)"
  printf "$fmt" 0 main 8080 3000 "$([[ -n "$be" ]] && echo up || echo down)" \
    "$([[ -n "$be" ]] && tree_mem_mb "$be" || echo -)" "$([[ -n "$fe" ]] && tree_mem_mb "$fe" || echo -)" \
    "$(pg_mem_mb proppilot-postgres)"
  for n in $(slot_names); do
    dir="$WT_DIR/$n"; slot="$(dev_env_get "$dir" SLOT)"
    be="$(pid_of "$dir" backend)"; fe="$(pid_of "$dir" frontend)"
    pg="$(pg_mem_mb "$(dev_env_get "$dir" PG_CONTAINER)")"
    state=down; alive "$be" && state=up
    printf "$fmt" "$slot" "$n" "$((8080 + slot))" "$((3000 + slot))" "$state" \
      "$(alive "$be" && tree_mem_mb "$be" || echo -)" "$(alive "$fe" && tree_mem_mb "$fe" || echo -)" "${pg:--}"
  done
  echo "free memory: $(free_mem_pct)% (min $MIN_FREE_MEM_PCT%), max slots: $MAX_STACKS"
}

cmd_rm() {
  local dir pg; dir="$(wt_path "${1:-}")"; pg="$(dev_env_get "$dir" PG_CONTAINER)"
  if [[ "${2:-}" != "--force" && -n "$(git -C "$dir" status --porcelain)" ]]; then
    die "'$1' has uncommitted changes. Commit them or use: wt.sh rm $1 --force"
  fi
  cmd_down "$1"
  docker rm -f "$pg" >/dev/null 2>&1 || true
  docker volume rm "$pg-data" >/dev/null 2>&1 || true
  git -C "$ROOT" worktree remove --force "$dir"
  echo "wt: '$1' removed, container $pg and its volume deleted. Branch feat/$1 is kept (delete: git branch -D feat/$1)."
}

case "${1:-}" in
  new) shift; cmd_new "$@" ;;
  up) shift; cmd_up "$@" ;;
  down) shift; cmd_down "$@" ;;
  seed) shift; cmd_seed "$@" ;;
  verify) shift; cmd_verify "$@" ;;
  ls) cmd_ls ;;
  rm) shift; cmd_rm "$@" ;;
  *) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
