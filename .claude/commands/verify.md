---
description: Run the full verify loop (backend tests, frontend lint/build, e2e smoke) and summarize
---

1. Check the backend answers: `curl -sf http://localhost:8080/api/countries`. If it does not, tell the user to start the stack (see the `dev-stack` skill) and stop.
2. Run `scripts/verify.sh --e2e`.
3. Report the summary block as a short table: stage, PASS/FAIL, counts. For each FAIL, quote the key error line (test name + assertion, or lint count vs baseline).
4. Compare with the last known state in `wiki/pages/architecture/testing.md`. Say clearly which failures are new.
5. Do not change code in this command.
