#!/usr/bin/env bash
# One command to check the project. Runs every stage, prints a summary, exits non-zero if any stage failed.
#   scripts/verify.sh            backend tests + frontend lint + frontend build
#   scripts/verify.sh --e2e      also runs the Playwright smoke test (needs this slot's backend running and seeded; scripts/wt.sh verify does that for a worktree)
#   scripts/verify.sh --only backend|frontend|e2e
# Lint has a baseline of pre-existing errors (LINT_ERROR_BASELINE); it fails only if the count goes up.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LINT_ERROR_BASELINE=28
RUN_E2E=false
ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --e2e) RUN_E2E=true ;;
    --only) ONLY="$2"; shift ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

source "$ROOT/scripts/lib/env.sh"
load_dev_env "$ROOT"

RESULTS=()
FAILED=0
stage() { echo; echo "==> $1"; }
record() {
  RESULTS+=("$1: $2")
  [[ "$2" == FAIL* ]] && FAILED=1
  return 0
}
wants() { [[ -z "$ONLY" || "$ONLY" == "$1" ]]; }

if wants backend; then
  # Some tests are full @SpringBootTest and need the Postgres from scripts/dev-backend.sh.
  stage "backend: mvn test (DB $DATABASE_URL)"
  source "$ROOT/scripts/lib/java.sh"
  if use_project_jdk && (cd "$ROOT/proppilot-backend" && mvn -q test); then
    record "backend tests" "PASS"
  else
    record "backend tests" "FAIL (see Tests run / FAILURE lines above)"
  fi
fi

if wants frontend; then
  stage "frontend: lint (baseline $LINT_ERROR_BASELINE errors)"
  lint_errors=$(cd "$ROOT/proppilot-frontend" && npx eslint . -f json 2>/dev/null \
    | python3 -c 'import json,sys; print(sum(f["errorCount"] for f in json.load(sys.stdin)))')
  if [[ -z "$lint_errors" ]]; then
    record "frontend lint" "FAIL (eslint did not run)"
  elif (( lint_errors > LINT_ERROR_BASELINE )); then
    (cd "$ROOT/proppilot-frontend" && npm run -s lint) || true
    record "frontend lint" "FAIL ($lint_errors errors, baseline $LINT_ERROR_BASELINE)"
  else
    record "frontend lint" "PASS ($lint_errors errors, baseline $LINT_ERROR_BASELINE)"
  fi

  stage "frontend: build"
  if (cd "$ROOT/proppilot-frontend" && npm run -s build); then
    record "frontend build" "PASS"
  else
    record "frontend build" "FAIL"
  fi
fi

if [[ "$RUN_E2E" == true || "$ONLY" == "e2e" ]]; then
  stage "e2e: smoke"
  if ! curl -sf -o /dev/null "http://localhost:$BACKEND_PORT/api/countries"; then
    echo "Backend is not running on :$BACKEND_PORT. Start it with scripts/dev-backend.sh, then scripts/seed.py." >&2
    record "e2e smoke" "FAIL (backend not running)"
  elif (cd "$ROOT/proppilot-frontend" && npx playwright test e2e/smoke.spec.js --reporter=line); then
    record "e2e smoke" "PASS"
  else
    record "e2e smoke" "FAIL"
  fi
fi

echo; echo "==> summary"
printf '  %s\n' "${RESULTS[@]}"
if (( FAILED )); then echo "verify: FAILED"; exit 1; fi
echo "verify: OK"
