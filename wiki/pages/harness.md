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

## Self-modification limit

Agents cannot edit their own permission or settings files without the permission classifier stepping in. When that happens, stage the file and let Juan apply it ([[lessons]]).
