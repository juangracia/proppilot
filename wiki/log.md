---
title: Wiki log
type: log
tags: [log]
sources: []
updated: 2026-10-22
---

# Wiki log

Append only. Format: `## [YYYY-MM-DD] op | title`.

## [2026-10-22] ingest | Explorer findings (cold repo)
Added `raw/2026-10-22-explorer-findings.md`. Created glossary, entities, business-rules, rent-adjustment, architecture, api, testing, known-issues. Cites checked against the code at commit 643d5ba plus harness branch.

## [2026-10-22] ingest | Backend source: services, entities, controllers
Re-opened the service, entity and controller files named in the pages and checked every file:line cite.

## [2026-10-22] ingest | Board snapshot and rehearsal lessons
Copied the coordinator board to `raw/2026-10-22-board-snapshot.md` and the 20 Oct rehearsal lessons to `raw/2026-10-20-meetup-rehearsal-lessons.md`. No secrets or emails found. Added pages decisions, agents, harness, session-log-2026-10-22, lessons.

## [2026-10-22] ingest | Obsidian conversion
Added YAML frontmatter to all pages, converted links to wikilinks, rebuilt the index, rewrote AGENTS.md ops, added `.obsidian/`.

## [2026-10-22] lint | First lint pass
Checked wikilinks, orphans, frontmatter. Ran `.claude/skills/wiki-lint/lint.py`: 19 files, 0 problems after adding Related links to 5 pages that were orphans. Negative control: a bad `[[nope]]` link was reported, then removed.

## [2026-10-22] ingest | Stack worker outputs
Documented the real `scripts/` behavior, verify stages, baselines, compose project name, known failing tests and the Playwright report gotcha in CLAUDE.md, testing, known-issues, rent-adjustment, harness, session-log and the dev-stack skill. Facts opened in `scripts/*.sh`, `.dev.env`, `playwright.config.js`; the 778992 figure was read from the running API.

## [2026-10-22] lint | Lint baseline 36 vs 32 explained
The 4 missing problems are `no-undef` errors for `process` in `playwright.config.js`, removed by `/* global process */` in 01a51a0. Verified with eslint on the file before and after.
