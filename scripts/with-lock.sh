#!/usr/bin/env bash
# Run a command while holding a machine-wide lock, so heavy Maven/verify runs from different
# lanes take turns. macOS has no flock, so the lock is an atomic mkdir.
#   scripts/with-lock.sh scripts/verify.sh
# Env: LOCK_DIR (default /tmp/proppilot-maven.lock), LOCK_TIMEOUT seconds (default 3600).
set -uo pipefail
[ "$#" -gt 0 ] || { echo "usage: with-lock.sh <cmd...>" >&2; exit 2; }
LOCK="${LOCK_DIR:-/tmp/proppilot-maven.lock}"
LIMIT="${LOCK_TIMEOUT:-3600}"
waited=0
until mkdir "$LOCK" 2>/dev/null; do
  holder="$(cat "$LOCK/pid" 2>/dev/null || true)"
  # Stale lock: holder died without cleanup.
  if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
    echo "with-lock: removing stale lock of dead pid $holder" >&2
    rm -rf "$LOCK"; continue
  fi
  [ "$waited" -lt "$LIMIT" ] || { echo "with-lock: timeout after ${LIMIT}s, held by pid ${holder:-?} ($(cat "$LOCK/cmd" 2>/dev/null))" >&2; exit 1; }
  [ $((waited % 30)) -eq 0 ] && echo "with-lock: waiting, held by pid ${holder:-?} ($(cat "$LOCK/cmd" 2>/dev/null))" >&2
  sleep 2; waited=$((waited + 2))
done
echo $$ >"$LOCK/pid"; echo "$PWD: $*" >"$LOCK/cmd"
trap 'rm -rf "$LOCK"' EXIT
trap 'exit 130' INT TERM HUP
"$@"
