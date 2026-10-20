---
type: architecture
updated: 2026-10-20
sources: [CLAUDE.md, .claude/settings.json, .claude/agents/, .claude/skills/, .claude/hooks/session-start.sh, https://code.claude.com/docs/en/memory, https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/skills, https://code.claude.com/docs/en/hooks]
---

# Agent harness

How Claude Code is set up for this repo, and what each piece is for.

## Memory split

| Where | Scope | What goes there |
|---|---|---|
| `CLAUDE.md` | committed, loads every session | Short rules every session needs: layout, owner scoping, invariants, definition of done. Docs suggest under 200 lines; we keep it under 80. |
| `wiki/` | committed, read on demand | Everything else we know: domain, architecture, decisions, gaps. Start at [[index]]. Schema in [[AGENTS]]. |
| `CLAUDE.local.md` | gitignored, loads after `CLAUDE.md` | Personal overrides for one person. Exists only in the worktree where you create it. |
| Auto memory | per user, `~/.claude/projects/<project>/memory/`, outside the repo | Personal preferences. Not project facts. |

`wiki/AGENTS.md` is not auto-loaded: Claude Code reads `AGENTS.md` only when no `CLAUDE.md` exists (memory docs). The skills and agents point to it instead.

## Skills (`.claude/skills/<name>/SKILL.md`)

Procedures, loaded only when relevant, so `CLAUDE.md` stays short.

- `dev-stack`: start DB, backend, frontend, seed, URLs, log in as the local-dev user, troubleshooting (port 5433, JDK 25 Lombok, empty account). See [[local-dev-auth]].
- `wiki-ingest`, `wiki-query`, `wiki-lint`: the three workflows from [[AGENTS]] as checklists. `wiki-lint/check-links.sh` lists broken wikilinks and orphan pages.
- `railway-deploy`: deploy to Railway, variable cross-fill, traps, smoke checks. Runbook: [[deploy-railway]].
- Global skills, outside this repo: `cold-repo-harness` (set up a harness on a cold repo), `obsidian-open-vault` (open a folder as an Obsidian vault on macOS).
- `/verify` is still a command file (`.claude/commands/verify.md`). Commands and skills work the same way.

## Subagents (`.claude/agents/*.md`)

| Agent | Model | Edits | Job |
|---|---|---|---|
| `backend-worker` | sonnet | code | Spring/JPA change, failing test first, `scripts/verify.sh --only backend`. Preloads `dev-stack`. |
| `frontend-worker` | sonnet | code | React/MUI change, es+en i18n, lint baseline, `--only frontend`, Playwright check on :3000. |
| `verifier` | haiku | nothing | `scripts/verify.sh --e2e` plus UI check. Reports PASS/FAIL with evidence. See [[testing]]. |
| `wiki-curator` | haiku | `wiki/` only | Ingest, query, lint. Preloads the three wiki skills. |

Model policy (ADR-007 in [[decisions]]): every Agent call sets `model`. haiku for mechanical work, sonnet for bounded code, tests and docs, opus only for hard judgment. Long independent work (a real deploy) gets its own session (`claude --bg`). Subagents load `CLAUDE.md` by default. Playwright access uses the server wildcard `mcp__playwright__*`.

## Hooks

- `SessionStart` (`startup|clear|compact`) runs `.claude/hooks/session-start.sh`. It prints a reminder to read [[index]] and the last five `log.md` headings. Plain stdout from SessionStart becomes context (hooks docs). It is read-only and always exits 0.
- `PreToolUse` (matcher `Agent`) runs `.claude/hooks/require-agent-model.sh`. It denies Agent calls that do not set `model`. Forks and agents with `model:` in frontmatter pass. Needs `jq`; without it the hook allows the call.
- `Stop` runs `.claude/hooks/wiki-ingest-check.sh`. If work outside `wiki/` is newer than `wiki/log.md`, it returns `decision: "block"` with a reason that asks for a wiki-ingest. It nudges once per change set per session (marker in `${TMPDIR:-/tmp}`), exits 0 when `stop_hook_active` is true, and fails open.
- `.claude/settings.json` env sets `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` as the fallback.

## Permissions

`.claude/settings.json` allows the dev, seed, verify, test and lint commands, and denies `railway up/deploy` and pushes to `main`/`master`. See [[deploy-railway]].
