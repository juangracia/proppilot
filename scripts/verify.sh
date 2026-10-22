#!/usr/bin/env bash
# Run every check and print a summary table. Exit non-zero if any stage fails.
#   scripts/verify.sh                   all stages
#   scripts/verify.sh --update-baseline rewrite the lint baseline with the current count (do this only on purpose)
# Stages: backend tests, frontend build, lint vs baseline, Playwright smoke.
# Brings up db, backend and frontend and seeds if they are not already running (all idempotent).
set -uo pipefail
. "$(dirname "$0")/_lib.sh"
BASE="$ROOT/scripts/baselines"
FE="$ROOT/proppilot-frontend"
UPDATE=0; [ "${1:-}" = "--update-baseline" ] && UPDATE=1

NAMES=(); RESULTS=(); DETAILS=()
record() { NAMES+=("$1"); RESULTS+=("$2"); DETAILS+=("$3"); }
LOG="$STATE_DIR/verify.log"; : >"$LOG"

# --- stack -----------------------------------------------------------------------------
if "$ROOT/scripts/dev-up.sh" >>"$LOG" 2>&1 && "$ROOT/scripts/seed.sh" >>"$LOG" 2>&1; then STACK=ok; else STACK=fail; fi
record "stack up + seed" "$([ $STACK = ok ] && echo PASS || echo FAIL)" "db/backend/frontend on :$DB_PORT/:$BACKEND_PORT/:$FRONTEND_PORT (see .dev/verify.log)"

# --- 1. backend tests ------------------------------------------------------------------
echo "== backend tests (JDK $(java -version 2>&1 | sed -n 's/.*version "\([0-9]*\).*/\1/p')) =="
rm -rf "$ROOT/proppilot-backend/target/surefire-reports"
(cd "$ROOT/proppilot-backend" && DATABASE_URL="jdbc:postgresql://localhost:$DB_PORT/proppilot" mvn -B test) >"$STATE_DIR/backend-test.log" 2>&1
python3 -I - "$ROOT/proppilot-backend/target/surefire-reports" "$BASE/backend-known-failures.txt" >"$STATE_DIR/backend-summary.txt" <<'PY'
import glob, sys, xml.etree.ElementTree as ET
reports, known_file = sys.argv[1], sys.argv[2]
known = {l.strip() for l in open(known_file) if l.strip() and not l.startswith('#')}
total = 0; failed = []
for f in glob.glob(reports + '/TEST-*.xml'):
    for tc in ET.parse(f).getroot().iter('testcase'):
        total += 1
        if tc.find('failure') is not None or tc.find('error') is not None:
            failed.append(tc.get('classname').split('.')[-1] + '#' + tc.get('name'))
new = [t for t in failed if t not in known]
print(("FAIL" if new or total == 0 else "PASS"), f"{total} tests, {len(failed)} failed ({len(failed) - len(new)} known)" + (": new " + ", ".join(new) if new else ""))
PY
read -r r d <<<"$(cat "$STATE_DIR/backend-summary.txt")"; record "backend tests" "$r" "$d"

# --- 2. frontend build -----------------------------------------------------------------
echo "== frontend build =="
cd "$FE"
[ -x node_modules/.bin/eslint ] || npm ci --legacy-peer-deps >>"$LOG" 2>&1
if npm run build >"$STATE_DIR/build.log" 2>&1; then record "frontend build" PASS "vite build ok"; else record "frontend build" FAIL "see .dev/build.log"; fi

# --- 3. lint vs baseline ---------------------------------------------------------------
echo "== lint =="
if [ -x node_modules/.bin/eslint ]; then
  npx eslint . -f json >"$STATE_DIR/lint.json" 2>/dev/null
  CUR="$(python3 -I -c 'import json,sys; d=json.load(open(sys.argv[1])); print(sum(f["errorCount"]+f["warningCount"] for f in d))' "$STATE_DIR/lint.json")"
  if [ "$UPDATE" = 1 ]; then echo "$CUR" >"$BASE/lint-problems.txt"; fi
  BL="$(tr -d '[:space:]' <"$BASE/lint-problems.txt")"
  if [ "$CUR" -le "$BL" ]; then record "lint vs baseline" PASS "$CUR problems, baseline $BL"; else record "lint vs baseline" FAIL "$CUR problems, baseline $BL (grew by $((CUR - BL)))"; fi
else
  record "lint vs baseline" FAIL "eslint not installed (npm ci --legacy-peer-deps)"
fi

# --- 4. Playwright smoke ---------------------------------------------------------------
echo "== playwright smoke =="
ALL_SPECS="$(npx playwright test --list --reporter=list 2>/dev/null | sed -n 's/^.*› \([^ :]*\.spec\.[jt]s\):.*/\1/p' | sort -u | wc -l | tr -d ' ')"
PLAYWRIGHT_JSON_OUTPUT_NAME="$STATE_DIR/pw.json" npx playwright test e2e/smoke.spec.js --reporter=json >/dev/null 2>"$STATE_DIR/pw.err"
python3 -I - "$STATE_DIR/pw.json" "$ALL_SPECS" >"$STATE_DIR/pw-summary.txt" <<'PY'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception as e:
    print("FAIL no report:", e); sys.exit()
s = d["stats"]
files = set()
def walk(suite):
    if suite.get("file"): files.add(suite["file"])
    for x in suite.get("suites", []): walk(x)
for x in d["suites"]: walk(x)
ok = s["expected"]; bad = s["unexpected"] + s["flaky"]
status = "PASS" if ok > 0 and bad == 0 and files else "FAIL"
print(status, f"{ok} passed, {bad} failed, {len(files)} spec file run ({', '.join(sorted(files))}); {sys.argv[2]} spec files in e2e/ (visual-match.spec.js is a screenshot tool for another user, not run)")
PY
read -r r d <<<"$(cat "$STATE_DIR/pw-summary.txt")"; record "playwright smoke" "$r" "$d"

# --- summary ---------------------------------------------------------------------------
echo
printf '%-20s %-6s %s\n' STAGE RESULT DETAIL
printf '%-20s %-6s %s\n' -------------------- ------ ------
RC=0
for i in "${!NAMES[@]}"; do
  printf '%-20s %-6s %s\n' "${NAMES[$i]}" "${RESULTS[$i]}" "${DETAILS[$i]}"
  [ "${RESULTS[$i]}" = PASS ] || RC=1
done
echo
[ $RC = 0 ] && echo "verify: ALL GREEN" || echo "verify: FAILED"
exit $RC
