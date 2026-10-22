---
title: Lessons from the 20 Oct rehearsal
type: lessons
tags: [process, rehearsal]
sources: [2026-10-20-meetup-rehearsal-lessons]
updated: 2026-10-22
---

# Lessons from the 20 Oct rehearsal

Source: [[2026-10-20-meetup-rehearsal-lessons]]. The rehearsal ran the full demo (cold repo, harness, two features, three PRs). It took about 2.5 hours and cost about 36 USD. These are the lessons that apply to the harness now.

## Process

- Cap code rounds at 2 per lane after tests. Later changes become follow-up notes. Decide once.
- Set mockup strictness before building: structure, texts and data are P0. Colors, sizes and spacing are P1.
- Freeze the lane during a test run. The builder does not commit while the tester runs, and the tester records the SHA ([[agents]]).
- Workers report once, at the end, to `main`. The coordinator ignores idle notices.
- Keep the coordinator thin. It was half the cost. Rotate at 50% context ([[decisions]]).
- Run plan, design and test plan in parallel, and cap the test plan near 30 cases.

## Harness

- Self-test `verify.sh`: it must prove it picks up a probe spec. In the rehearsal a glob skipped new e2e specs and it still passed ([[testing]]).
- Serialize Maven runs across lanes. Parallel surefire forks crashed once.
- The permission classifier blocks `gh pr merge`, prod `pg_dump`, skill and agent edits, and some heredoc writes. Prepare the human's `!` commands ahead ([[harness]]).

## Keep

- Author plus independent reviewer on every step ([[decisions]]).
- One worktree per feature with its own ports and Postgres container.
- Test gate by SHA, with evidence for every PASS.

## Presenter

Pre-bake the stacks and the QR repo before the talk. Say "Spanish only" in the coordinator brief.
