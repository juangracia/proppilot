---
title: Agents
type: harness
tags: [agents, models]
sources: [.claude/agents/]
updated: 2026-10-22
---

# Agents

One file per role in `.claude/agents/`. Each pins a default `model` in its frontmatter. The caller can override the model per call. The reviewer must always run on a different model than the author. See [[decisions]] for why, and [[harness]] for the hook that enforces a `model` on every call.

| Agent | Default | Override when | What it does |
| --- | --- | --- | --- |
| coordinator | opus | sonnet for pure routing of a known plan | Routes work, keeps a board, never builds, hands off at 50% context |
| planner | opus | sonnet for a one-file change | Plan, technical design, test plan. Read-only on code |
| builder | sonnet | opus for cross-cutting design | Implements per plan with TDD, small commits |
| tester | sonnet | haiku to re-run existing tests | Writes and runs tests, records the SHA, evidence per PASS. Never edits app code |
| reviewer | haiku | opus for hard diffs (money, security, concurrency) | Independent review with file:line findings. Does not edit |
| deployer | sonnet | haiku for an unchanged redeploy | Railway `railway up` per folder, only on the human's word |
| explorer-domain | sonnet | haiku for a narrow lookup | Entities, rules, history |
| explorer-architecture | sonnet | haiku for a narrow lookup | Packages, auth, config, frontend structure |
| explorer-tests | sonnet | haiku to re-run a known suite | Runs the tests, reports baselines |
| explorer-build | sonnet | haiku for a quick re-check | Runs install and build, finds cold-machine breakage |
| wiki-curator | haiku | sonnet for wide ingests | Ingest, query, lint of this wiki ([[AGENTS]]) |

Limit: the `tools` field cannot restrict a path or a command. "Coordinator writes only the board" and "read-only Bash" hold by prompt text only.

Every agent reads `CLAUDE.md`, `wiki/AGENTS.md` and `wiki/index.md` first.
