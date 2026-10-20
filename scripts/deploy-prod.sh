#!/usr/bin/env bash
# Deploy PropPilot to Railway env `production` (Juan's decision, 2026-10-20).
#   scripts/deploy-prod.sh --dry-run        print every mutating command, run none (read-only Railway lookups still run)
#   scripts/deploy-prod.sh                  verify (--e2e), back up the DB, fix variables, deploy backend then frontend, smoke
#   scripts/deploy-prod.sh --skip-verify    skip scripts/verify.sh (only if it just passed on this exact commit)
# Run from the worktree you want to ship. Needs: railway CLI (logged in), curl, gzip, python3, and pg_dump or docker.
# Never prints variable values. The DB URL goes to pg_dump through an env var, not argv.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT=4bb03a0f-05c3-4f48-ba7f-6c6a7afdcd43
ENVNAME=production
BACKEND_SVC=backend
FRONTEND_SVC=frontend
DB_SVC=Postgres
BACKEND_URL=https://backend-production-1752.up.railway.app
FRONTEND_URL=https://www.proppilot.live
BACKUP_DIR="$HOME/brain/10-projects/proppilot/backups"

DRY=false
SKIP_VERIFY=false
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=true ;;
    --skip-verify) SKIP_VERIFY=true ;;
    *) echo "Unknown option: $a" >&2; exit 2 ;;
  esac
done

die() { echo "ABORT: $*" >&2; exit 1; }
step() { echo; echo "==> $*"; }
# run: executes the command, or only prints it in --dry-run.
run() { if $DRY; then echo "[dry-run] $*"; else "$@"; fi; }
RW=(-p "$PROJECT" -e "$ENVNAME")   # flags shared by railway calls that accept them

command -v railway >/dev/null || die "railway CLI not found"
command -v python3 >/dev/null || die "python3 not found"

# --- 1. gates -------------------------------------------------------------
step "git tree must be clean"
cd "$ROOT" || die "cannot cd to $ROOT"
if [[ -n "$(git status --porcelain)" ]]; then
  git status --short
  if $DRY; then echo "WARNING: tree is dirty. A real run would abort here."; else die "git tree is dirty. Commit or stash first."; fi
fi
SHA="$(git rev-parse --short HEAD)"
BRANCH="$(git branch --show-current)"
echo "deploying $BRANCH @ $SHA"

step "verify"
if $SKIP_VERIFY; then
  echo "skipped (--skip-verify)"
elif $DRY; then
  echo "[dry-run] scripts/verify.sh --e2e"
else
  "$ROOT/scripts/verify.sh" --e2e || die "verify is not green"
fi

step "railway target (read-only)"
railway status --project "$PROJECT" --environment "$ENVNAME" >/dev/null 2>&1 || die "cannot read project $PROJECT env $ENVNAME (railway login?)"
echo "project $PROJECT, env $ENVNAME reachable"

# --- 2. backup ------------------------------------------------------------
step "back up production Postgres"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/prod-$STAMP.sql.gz"
if $DRY; then
  echo "[dry-run] railway variable list -s $DB_SVC ${RW[*]} --json  (read DATABASE_PUBLIC_URL into an env var, never printed)"
  echo "[dry-run] pg_dump \"\$DBURL\" | gzip > $OUT   (local pg_dump, else: docker run --rm -e DBURL postgres:17-alpine pg_dump ...)"
else
  mkdir -p "$BACKUP_DIR" || die "cannot create $BACKUP_DIR"
  DBURL="$(railway variable list -s "$DB_SVC" "${RW[@]}" --json 2>/dev/null \
    | python3 -I -c 'import json,sys; print(json.load(sys.stdin).get("DATABASE_PUBLIC_URL",""))')"
  [[ -n "$DBURL" ]] || die "no DATABASE_PUBLIC_URL on $DB_SVC (enable the TCP proxy in the dashboard)"
  export DBURL
  DUMP_OPTS=(--no-owner --no-privileges --clean --if-exists)
  if command -v pg_dump >/dev/null; then
    pg_dump "${DUMP_OPTS[@]}" "$DBURL" | gzip > "$OUT"
  elif command -v docker >/dev/null; then
    # server is Postgres 17, so the client must be 17 too
    docker run --rm -e DBURL postgres:17-alpine sh -c 'pg_dump --no-owner --no-privileges --clean --if-exists "$DBURL"' | gzip > "$OUT"
  else
    die "need pg_dump or docker for the backup"
  fi
  rc=${PIPESTATUS[0]}
  unset DBURL
  [[ $rc -eq 0 ]] || { rm -f "$OUT"; die "pg_dump failed (exit $rc)"; }
  gzip -t "$OUT" || die "backup file is corrupt"
  gzip -dc "$OUT" | tail -n 5 | grep "PostgreSQL database dump complete" >/dev/null || die "backup looks truncated"
  echo "backup ok: $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
fi

# --- 3. variables (only what the deploy needs, no redeploy yet) -----------
step "variables"
# Decide from names and booleans only. Values never leave python.
BVARS="$(railway variable list -s "$BACKEND_SVC" "${RW[@]}" --json 2>/dev/null)" || die "cannot list backend variables"
FVARS="$(railway variable list -s "$FRONTEND_SVC" "${RW[@]}" --json 2>/dev/null)" || die "cannot list frontend variables"

# backend: needs a DB source, JWT_SECRET, GOOGLE_CLIENT_ID, CORS_ORIGINS covering the frontend
BACKEND_CHECK="$(printf '%s' "$BVARS" | FRONTEND_URL="$FRONTEND_URL" python3 -I -c '
import json, os, sys
d = json.load(sys.stdin)
has = lambda k: bool(d.get(k))
out = []
if not (has("DATABASE_URL") or has("PGHOST")): out.append("NEED_PG")
if has("DATABASE_URL") and not d["DATABASE_URL"].startswith("jdbc:postgresql://"): out.append("BAD_DATABASE_URL")
for k in ("JWT_SECRET", "GOOGLE_CLIENT_ID", "CORS_ORIGINS"):
    if not has(k): out.append("MISSING_" + k)
if has("CORS_ORIGINS") and os.environ["FRONTEND_URL"] not in d["CORS_ORIGINS"].split(","): out.append("CORS_MISSING_FRONTEND")
print(" ".join(out) or "OK")
')"
echo "backend check: $BACKEND_CHECK"
[[ "$BACKEND_CHECK" == *BAD_DATABASE_URL* ]] && die "backend DATABASE_URL is not jdbc:postgresql://. Fix it by hand."
for m in MISSING_JWT_SECRET MISSING_GOOGLE_CLIENT_ID MISSING_CORS_ORIGINS CORS_MISSING_FRONTEND; do
  [[ "$BACKEND_CHECK" == *$m* ]] && die "backend variable problem: $m. Fix it by hand (the script never invents secrets or origins)."
done
if [[ "$BACKEND_CHECK" == *NEED_PG* ]]; then
  # shellcheck disable=SC2016  # ${{...}} is Railway syntax, not shell
  run railway variable set -s "$BACKEND_SVC" "${RW[@]}" --skip-deploys \
    'PGHOST=${{Postgres.PGHOST}}' 'PGPORT=${{Postgres.PGPORT}}' 'PGDATABASE=${{Postgres.PGDATABASE}}' \
    'PGUSER=${{Postgres.PGUSER}}' 'PGPASSWORD=${{Postgres.PGPASSWORD}}'
else
  echo "backend DB variables already present (DATABASE_URL jdbc or PG*). No change."
fi

# frontend: VITE_API_URL must be backend URL + /api (build-time). VITE_GOOGLE_CLIENT_ID copied from backend if absent.
FRONT_CHECK="$(printf '%s' "$FVARS" | WANT="$BACKEND_URL/api" python3 -I -c '
import json, os, sys
d = json.load(sys.stdin)
out = []
if d.get("VITE_API_URL") != os.environ["WANT"]: out.append("FIX_API_URL")
if not d.get("VITE_GOOGLE_CLIENT_ID"): out.append("FIX_GOOGLE_ID")
print(" ".join(out) or "OK")
')"
echo "frontend check: $FRONT_CHECK"
if [[ "$FRONT_CHECK" == *FIX_API_URL* ]]; then
  run railway variable set -s "$FRONTEND_SVC" "${RW[@]}" --skip-deploys "VITE_API_URL=$BACKEND_URL/api"
fi
if [[ "$FRONT_CHECK" == *FIX_GOOGLE_ID* ]]; then
  if $DRY; then
    echo "[dry-run] copy backend GOOGLE_CLIENT_ID to frontend VITE_GOOGLE_CLIENT_ID via stdin (value not shown)"
  else
    printf '%s' "$BVARS" | python3 -I -c 'import json,sys; sys.stdout.write(json.load(sys.stdin)["GOOGLE_CLIENT_ID"])' \
      | railway variable set VITE_GOOGLE_CLIENT_ID --stdin -s "$FRONTEND_SVC" "${RW[@]}" --skip-deploys || die "could not set VITE_GOOGLE_CLIENT_ID"
  fi
fi
unset BVARS FVARS

# --- 4. deploy ------------------------------------------------------------
wait_success() {  # $1 = service. Polls the newest deployment until SUCCESS or a failure state.
  local svc="$1" line
  for _ in $(seq 1 60); do
    line="$(railway deployment list -s "$svc" "${RW[@]}" --limit 1 2>/dev/null | sed -n '2p')"
    echo "  [$svc] $line"
    case "$line" in
      *SUCCESS*) return 0 ;;
      *FAILED*|*CRASHED*) return 1 ;;
    esac
    sleep 10
  done
  return 1
}

deploy() {  # $1 = service, $2 = folder
  step "deploy $1 from $2"
  if $DRY; then
    echo "[dry-run] (cd $ROOT/$2 && railway up . -s $1 -e $ENVNAME -p $PROJECT --ci -m \"prod $1 $SHA\")"
    echo "[dry-run] poll: railway deployment list -s $1 -e $ENVNAME -p $PROJECT --limit 1  until SUCCESS"
  else
    (cd "$ROOT/$2" && railway up . -s "$1" -e "$ENVNAME" -p "$PROJECT" --ci -m "prod $1 $SHA") || die "railway up failed for $1"
    wait_success "$1" || die "$1 deployment did not reach SUCCESS"
  fi
}
deploy "$BACKEND_SVC" proppilot-backend
deploy "$FRONTEND_SVC" proppilot-frontend

# --- 5. smoke -------------------------------------------------------------
step "smoke"
FAIL=0
check() {  # $1 = label, $2 = url, $3 = expected code
  if $DRY; then echo "[dry-run] curl $2  (expect $3)"; return; fi
  local code; code="$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$2")"
  if [[ "$code" == "$3" ]]; then echo "PASS $1 $code"; else echo "FAIL $1 got $code, want $3"; FAIL=1; fi
}
check "backend /api/countries" "$BACKEND_URL/api/countries" 200
check "backend /api/property-units (no token)" "$BACKEND_URL/api/property-units" 401
check "frontend" "$FRONTEND_URL" 200

echo
echo "deployed commit: $SHA ($BRANCH)"
$DRY && echo "dry-run: nothing was changed."
[[ $FAIL -eq 0 ]] || die "smoke failed. Backup is at $OUT. Roll back: Railway dashboard, service, Deployments, redeploy the previous one. Data: restore the backup (docs/deploy-railway.md)."
echo "Next: log in with Google on $FRONTEND_URL and open a lease."
