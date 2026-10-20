---
name: parallel-worktrees
description: Run extra PropPilot stacks (own backend, frontend and database) in separate git worktrees so parallel sessions can test independently. Use when starting parallel feature work, when two sessions fight over :8080/:3000 or the same database, or when asked to create, start, seed, verify, list or remove a worktree stack.
---

# Parallel worktrees

One Postgres container per slot (`proppilot-pg-wtN`, postgres:15, own volume `proppilot-pg-wtN-data`, 256 MB cap, small buffers), so databases never mix. Slot 0 keeps `proppilot-postgres`.

| Slot | Backend | Frontend | Postgres |
|---|---|---|---|
| 0 (main) | 8080 | 3000 | `proppilot-postgres` :5434 (your .dev.env) |
| N (1..4) | 8080+N | 3000+N | `proppilot-pg-wtN` :5440+N |

## Commands

```bash
scripts/wt.sh new <name> [base-ref]   # worktree .claude/worktrees/<name>, branch feat/<name>, next free slot
scripts/wt.sh up <name> [--force]     # builds the jar, starts backend + vite in the background
scripts/wt.sh seed <name>             # resets and seeds only that slot's database
scripts/wt.sh verify <name> [--e2e]   # scripts/verify.sh inside the worktree against its own stack
scripts/wt.sh ls                      # slots, ports, up/down, memory (MB) per stack
scripts/wt.sh down <name>
scripts/wt.sh rm <name> [--force]     # down, delete its container and volume, remove the worktree; the branch stays
```

Flow: `new` then `up` then `seed`, work in `.claude/worktrees/<name>`, `verify <name> --e2e`, then `rm`. UI at `http://localhost:300N`. Logs and pid files: `<worktree>/.stack/` (gitignored).

## Rules

- The base ref must already contain `scripts/wt.sh` and the port parametrization (default base `feat/harness-setup`). Uncommitted harness changes in another worktree are not copied.
- `up` starts the slot container (and `down` stops it; data stays in the volume). `rm` deletes container and volume. `wt.sh` never touches `proppilot-postgres`.
- Inside a slot worktree `scripts/dev-backend.sh`, `scripts/verify.sh` and `npm run dev` read that worktree's `.dev.env` (`BACKEND_PORT`, `FRONTEND_PORT`, `POSTGRES_PORT`, `PG_CONTAINER`). Do not hand-edit those keys.
- `wt.sh verify` runs backend tests against the slot database. It does not wipe the seed data (checked), but re-run `seed` after schema changes.

## Limits

- `MAX_STACKS=4` (`.dev.env`): `new` refuses a fifth slot, `up` refuses a fifth running stack.
- `MIN_FREE_MEM_PCT=15`: `up` refuses when macOS "free percentage" (`memory_pressure`) is lower. `--force` skips both checks.
- Per stack about 210 MB backend, about 33 MB Postgres (JVM `-Xmx512m -XX:+UseSerialGC -XX:TieredStopAtLevel=1`, no devtools) and 250-450 MB vite. `ps` RSS undercounts on macOS because of memory compression, so `ls` uses `footprint`. Override the JVM flags with `BACKEND_JAVA_OPTS`.
- Frontend deps: `new` clones the main `node_modules` (APFS copy-on-write, seconds) when `package-lock.json` matches, else `npm ci --prefer-offline --legacy-peer-deps`.
- Vite uses `strictPort`: a busy port fails instead of silently moving to another slot's port.

## Cleanup

`scripts/wt.sh rm <name>` refuses if the worktree has uncommitted changes (`--force` overrides). Then delete the branch if it is merged or abandoned: `git branch -D feat/<name>`. Check `scripts/wt.sh ls` , `docker ps -a` and `docker volume ls` for leftovers.
