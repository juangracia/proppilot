---
name: feature-worktree
description: Create, list, check, or stop an isolated feature lane (git worktree + branch + own Postgres, backend, frontend ports) so several features can run side by side. Use when starting a feature that needs its own running stack, or when running Maven/verify from more than one lane.
---

# Feature worktree lanes

One lane = one worktree `.claude/worktrees/<slug>`, one branch `feat/<slug>`, one stack. The main stack (5433 / 8080 / 3000) is never touched.

Ports for lane index N (N >= 1): DB `5433+N`, backend `8080+N`, frontend `3000+N`. Compose project `proppilot-<slug>`, container `proppilot-postgres-<slug>`. Lane settings live in the gitignored `.dev.env.local`, which `scripts/_lib.sh` reads before `.dev.env`.

| Goal | Command |
| --- | --- |
| Create or reuse a lane and start it (seeded) | `scripts/wt.sh up <slug> <index>` |
| Stop a lane (`--db` also removes its DB container; the data volume stays) | `scripts/wt.sh down <slug> [--db]` |
| Ports, pids, health of every lane | `scripts/wt.sh status` |
| Worktrees and branches | `scripts/wt.sh list` |
| Run Maven or verify without clashing with other lanes | `scripts/with-lock.sh scripts/verify.sh` |

## Rules

1. Pick a free index. Run `scripts/wt.sh status` first. Never reuse an index.
2. `up` is idempotent. It reuses the worktree, branch and running processes. A new branch starts from `harness/claude-setup` (override with `BASE_BRANCH`).
3. `up` checks all three ports before it creates the worktree or starts the DB. If one is taken it stops and creates nothing.
4. Work only inside your lane worktree. Use its scripts (`scripts/dev-up.sh`, `scripts/verify.sh`) from there.
5. Wrap every `mvn` and `scripts/verify.sh` run in `scripts/with-lock.sh`. The lock is a `mkdir` in `/tmp/proppilot-maven.lock`. A dead holder is detected and the lock is freed. Waits up to `LOCK_TIMEOUT` seconds (default 3600).
6. Lane deps install on first `up` with `npm ci --legacy-peer-deps`. This takes a few minutes.
7. Stop a lane with `down` when its feature is done. Remove the worktree yourself with `git worktree remove` only after the branch work is safe.
