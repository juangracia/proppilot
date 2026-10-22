---
title: Session log 22 Oct 2026
type: log
tags: [session, history]
sources: [2026-10-22-board-snapshot, 2026-10-22-explorer-findings]
updated: 2026-10-22
---

# Session log, 22 Oct 2026

What happened on the day the cold PropPilot repo got a harness. Raw record: [[2026-10-22-board-snapshot]]. Decisions: [[decisions]].

## Start

Clone at `~/dev/proppilot-cold`, branch `demo/part2-cold` at 643d5ba (AI tooling removed for the demo). Work in a worktree on branch `harness/claude-setup`. The coordinator could not use `EnterWorktree` (its cwd was another repo), so workers used absolute paths.

## Explorers

Four read-only explorers ran in parallel: backend and architecture, frontend, domain and history, tests and deploy. Their reports became [[2026-10-22-explorer-findings]]. Key facts: JDK 17 needed (default is 25), `npm ci` needs `--legacy-peer-deps`, Postgres on 5433, 9 of 37 backend tests need the DB, lint baseline 36 problems, `index_values` is never seeded. Pages: [[architecture]], [[testing]], [[known-issues]], [[rent-adjustment]].

## Workers and commits

- Stack worker (sonnet): `f6a2512` dev scripts, pinned toolchain, seed data. Then `verify.sh`, Playwright smoke test and lint baseline (uncommitted when this page was written).
- Docs worker (sonnet), round 1:
  - `a437da0` `CLAUDE.md` and `wiki/`.
  - `60fcf02` agents and skills.
  - `e40567c` settings and hooks.
- Docs worker, roster: `9e02fad` eleven agent files with default models and the agents table ([[agents]]).
- Docs worker, second brain: this commit. Raw sources, new pages, wikilinks, Obsidian vault.

## Decisions taken

Agent roster with default models, wiki as second brain, and the standing rules (author plus reviewer, no push to main, deploy only on word). See [[decisions]].

## Open at the time of writing

- Fresh-clone check: a reviewer follows `CLAUDE.md` to a green `verify.sh`.
- Push of `harness/claude-setup`. A PR only on Juan's word.
- UNVERIFIED items in [[harness]].
