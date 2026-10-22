---
title: Harness
type: harness
tags: [claude-code, hooks, skills]
sources: [.claude/]
updated: 2026-10-22
---

# Harness

What each Claude Code file in the repo does. The harness was built on 22 Oct 2026 ([[session-log-2026-10-22]]). Why these choices: [[decisions]].

## Docs

- `CLAUDE.md`: commands, gotchas, rules, domain invariants, definition of done, agents table. Hidden by the global gitignore, so it is committed with `git add -f`.
- `wiki/`: this knowledge base ([[AGENTS]]).

## Settings: `.claude/settings.json`

- SessionStart hook runs `.claude/hooks/session-start.sh`. It prints a pointer to `wiki/index.md`.
- PreToolUse hook on `Agent` runs `.claude/hooks/require-agent-model.sh`. It denies an Agent call with no `model` (tested with piped JSON).
- Permissions allow: read tools, git read commands, `scripts/*` helpers, `mvn test`, `npm run build|lint`, Playwright, `docker ps`.
- Permissions deny: `git push * main`, `git push * master`, `railway up*`, `railway deploy*`.
- UNVERIFIED: the `Agent` matcher in a live session, and the push deny wildcard.

## Agents: `.claude/agents/`

Eleven roles. See [[agents]].

## Skills: `.claude/skills/`

- `dev-stack`: start, stop, seed, verify the local stack. Troubleshooting for ports and JDK.
- `wiki-ingest`, `wiki-query`, `wiki-lint`: the three wiki operations ([[AGENTS]]).
- `deploy`: Railway `railway up` per folder. `disable-model-invocation: true`. Only on the human's word.

## Scripts (stack worker)

`scripts/dev-up.sh` (`--seed` optional), `dev-down.sh` (stops only pids in `.dev/`), `dev-db.sh`, `dev-backend.sh`, `dev-frontend.sh`, `seed.sh`, `verify.sh`, shared `_lib.sh`, baselines in `scripts/baselines/`. The DB runs as compose project `proppilot-cold`. Ports in `.dev.env`, toolchain in `.sdkmanrc` and `.nvmrc`. See [[testing]] for what `verify.sh` runs.

## Second stack

A second checkout can run side by side with its own `DB_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `COMPOSE_PROJECT` and `PG_CONTAINER` (all in `.dev.env`, overridable from the shell). Compose maps `${DB_PORT:-5433}:5432` and names the container `${PG_CONTAINER:-proppilot-postgres}` (`proppilot-backend/docker-compose.yml:6`, `:12`). `dev-db.sh` refuses a container of another compose project (`scripts/dev-db.sh:6-8`). `dev-backend.sh` and `dev-frontend.sh` fail on a foreign port (`scripts/dev-backend.sh:11`, `scripts/dev-frontend.sh:11`). `vite.config.js` reads `FRONTEND_PORT` and `BACKEND_PORT` (`:10`, `:13`). Teardown: `scripts/dev-down.sh --db`. Proven by the stack worker with `DB_PORT=5434 BACKEND_PORT=8081 FRONTEND_PORT=3001 COMPOSE_PROJECT=proppilot-fresh2 PG_CONTAINER=proppilot-postgres-fresh2 scripts/verify.sh` (stack worker report, commit 56c462b).

## Self-modification limit

Agents cannot edit their own permission or settings files without the permission classifier stepping in. When that happens, stage the file and let Juan apply it ([[lessons]]).

## Local stack

How to log in to the running local stack, and which user owns the seed data: [[local-login]].
