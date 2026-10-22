#!/usr/bin/env bash
# Feature lanes: one git worktree + branch + DB/backend/frontend stack per feature.
#   scripts/wt.sh up <slug> <index>     create/reuse worktree, write lane env, start stack with --seed
#   scripts/wt.sh down <slug> [--db]    stop the lane (--db also stops its DB container)
#   scripts/wt.sh status                every lane: ports, pids, health
#   scripts/wt.sh list                  worktrees and branches
# Lane ports: DB 5433+index, backend 8080+index, frontend 3000+index. Index 0 is the main stack.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Always resolve the main repo's worktree dir, even when run from inside a lane.
COMMON="$(cd "$HERE" && git rev-parse --git-common-dir)"; COMMON="$(cd "$HERE" && cd "$COMMON" && pwd)"
REPO="$(dirname "$COMMON")"
WTDIR="$REPO/.claude/worktrees"
BASE_BRANCH="${BASE_BRANCH:-harness/claude-setup}"

die() { echo "wt: $*" >&2; exit 1; }
listen_pid() { lsof -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null | head -1; }

lane_env() { # path -> prints "KEY=VAL" lines from .dev.env.local
  [ -f "$1/.dev.env.local" ] && grep -E '^[A-Z_]+=' "$1/.dev.env.local" || true
}
envval() { lane_env "$1" | sed -n "s/^$2=//p" | head -1; }

cmd_up() {
  local slug="${1:-}" idx="${2:-}"
  [[ "$slug" =~ ^[a-z0-9][a-z0-9-]*$ ]] || die "usage: wt.sh up <slug> <index>  (slug: lowercase, digits, dashes)"
  [[ "$idx" =~ ^[1-9][0-9]*$ ]] || die "index must be a positive integer (0 is the main stack)"
  local wt="$WTDIR/$slug" branch="feat/$slug"
  local db=$((5433 + idx)) be=$((8080 + idx)) fe=$((3000 + idx))
  if [ ! -d "$wt" ]; then
    if git -C "$REPO" show-ref --verify --quiet "refs/heads/$branch"; then
      git -C "$REPO" worktree add "$wt" "$branch"
    else
      git -C "$REPO" worktree add -b "$branch" "$wt" "$BASE_BRANCH"
    fi
  else
    echo "worktree: reusing $wt"
  fi
  cat >"$wt/.dev.env.local" <<ENV
# Written by scripts/wt.sh for lane $slug. Gitignored.
DB_PORT=$db
BACKEND_PORT=$be
FRONTEND_PORT=$fe
COMPOSE_PROJECT=proppilot-$slug
PG_CONTAINER=proppilot-postgres-$slug
ENV
  # dev-up.sh checks all three ports before it starts the DB. dev-frontend.sh runs npm ci --legacy-peer-deps if needed.
  "$wt/scripts/dev-up.sh" --seed
  echo
  echo "lane $slug ($branch)"
  echo "  worktree  $wt"
  echo "  frontend  http://localhost:$fe"
  echo "  backend   http://localhost:$be/api"
  echo "  postgres  localhost:$db"
}

cmd_down() {
  local slug="${1:-}"; shift || true
  [ -n "$slug" ] || die "usage: wt.sh down <slug> [--db]"
  local wt="$WTDIR/$slug"; [ -d "$wt" ] || die "no worktree $wt"
  "$wt/scripts/dev-down.sh" "$@"
}

health() { curl -fsS -o /dev/null --max-time 3 "$1" 2>/dev/null && echo up || echo DOWN; }

cmd_status() {
  printf '%-22s %-6s %-6s %-6s %-12s %-12s %s\n' LANE DB API WEB 'BACKEND-PID' 'WEB-PID' BRANCH
  local rows=("main|$REPO/.claude/worktrees/harness|5433|8080|3000|$BASE_BRANCH")
  local d
  for d in "$WTDIR"/*/; do
    d="${d%/}"; [ -f "$d/.dev.env.local" ] || continue
    rows+=("$(basename "$d")|$d|$(envval "$d" DB_PORT)|$(envval "$d" BACKEND_PORT)|$(envval "$d" FRONTEND_PORT)|$(git -C "$d" rev-parse --abbrev-ref HEAD)")
  done
  local r name path db be fe br dbh
  for r in "${rows[@]}"; do
    IFS='|' read -r name path db be fe br <<<"$r"
    nc -z localhost "$db" 2>/dev/null && dbh="up:$db" || dbh="DOWN:$db"
    printf '%-22s %-6s %-6s %-6s %-12s %-12s %s\n' "$name" "$dbh" "$(health "http://localhost:$be/api/countries"):$be" "$(health "http://localhost:$fe/"):$fe" "$(listen_pid "$be")" "$(listen_pid "$fe")" "$br"
  done
}

cmd_list() { git -C "$REPO" worktree list; }

case "${1:-}" in
  up) shift; cmd_up "$@" ;;
  down) shift; cmd_down "$@" ;;
  status) cmd_status ;;
  list) cmd_list ;;
  *) sed -n '2,7p' "$0"; exit 2 ;;
esac
