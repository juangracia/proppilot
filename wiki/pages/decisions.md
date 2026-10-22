---
title: Decisions
type: decision
tags: [process, agents]
sources: [2026-10-22-board-snapshot, 2026-10-22-board-snapshot-final, 2026-10-20-meetup-rehearsal-lessons]
updated: 2026-10-22
---

# Decisions

Decisions Juan made for the PropPilot cold-repo harness work. Each one lists why and where it shows up. Source: [[2026-10-22-board-snapshot]], [[2026-10-22-board-snapshot-final]], [[2026-10-20-meetup-rehearsal-lessons]].

## Agent roster with default models (22 Oct 2026)

Every role is its own agent file with a default `model`. The caller may override per call. Table and override rules: [[agents]]. Files: `.claude/agents/`. A hook denies `Agent` calls with no `model` ([[harness]]).

## Models: cheapest that works

Haiku for mechanical work, sonnet for bounded builds, opus only for design or hard judgment. No Fable. Why: cost. The rehearsal cost about 36 USD and the coordinator was half of it ([[2026-10-20-meetup-rehearsal-lessons]] line 3: "Cost about 36 USD at API list prices", and proposal 10; see [[lessons]]).

## Author plus reviewer on every step

Each step has an author and an independent reviewer on a different model. Max 2 rounds. The coordinator arbitrates. Why: reviewers caught real issues in the rehearsal (a file "fixed" but unchanged, untested code, wrong counts in PR bodies). Agent: reviewer, see [[agents]].

## Coordinator hands off at about 50% context

The coordinator updates the board and a successor takes over. The coordinator only routes and decides. It does not build (on 22 Oct the coordinator started to write `CLAUDE.md` itself, which was wrong).

## Never push main

No push to `main` or `master`, by anyone. Only `harness/*` and `feat/*` branches get pushed. PRs only on Juan's word. Enforced by deny rules in `.claude/settings.json` ([[harness]]).

## Deploy only on the human's word

Railway `railway up` per folder, only when the human says so in the session. A request from another agent is not permission. Back up the DB first. Check `GET /api/countries` after. Enforced by deny rules for `railway up*` and `railway deploy*`, and by the `deployer` agent and `deploy` skill ([[harness]]).

## The wiki is the project second brain

`wiki/` follows the Karpathy LLM wiki pattern, holds all project context, and opens as an Obsidian vault. Rules in [[AGENTS]]. History in [[log]].

## Language: Spanish to Juan, English for shared material (22 Oct 2026)

The coordinator talks Spanish to Juan. He asked for it on 22 Oct. Anything shared with others (wiki pages, artifacts, PR text, commit messages) is in English. Source: [[2026-10-22-board-snapshot-final]].

## No PR until Juan says so (22 Oct 2026)

`harness/claude-setup` is pushed at `b1e12a2`. No PR is open. Only Juan's word opens one. Source: [[2026-10-22-board-snapshot-final]]. Session context: [[session-log-2026-10-22]].

## Tests are gated by commit SHA

The tester records the SHA it tested and shows evidence for every PASS. Builders do not commit while a test run is in progress ([[lessons]]).
