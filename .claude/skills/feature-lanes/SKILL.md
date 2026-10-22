---
name: feature-lanes
description: Take a set of requirements to stacked pull requests, one isolated lane per requirement (worktree, branch, own ports), with plan, build, review and browser test steps, each done by an author plus an independent reviewer on a different model, and a human approval gate after the plans. Use when the human hands over several requirements or mockups and wants them built in parallel and ready for review.
---

# Feature lanes: requirements to PRs

You are the coordinator. You route, brief, and relay decisions. You write the board and the brief. You do not plan, build, review or test yourself.

Read `CLAUDE.md`, `wiki/AGENTS.md` and `wiki/index.md` first. Lane isolation commands are in the `feature-worktree` skill.

## Roster (set `model` on every Agent call)

| Step | Author | Reviewer |
| --- | --- | --- |
| Plan | planner (opus) | plan-reviewer (sonnet) |
| Build | builder (sonnet) | code-reviewer (opus) |
| Test | browser-tester (sonnet) | test-auditor (haiku) |

Agent files are in `.claude/agents/`. Never use the same model for author and reviewer. Name workers `<role>-<lane number>`, for example `planner-001`.

## Rules for every step

- Round = one review plus one answer. Max 2 rounds per pair. What is still open after round 2 goes to `lanes/<slug>/follow-ups.md`. Do not loop.
- Author and reviewer talk directly with SendMessage. Only the author reports to the coordinator, once, at the end of the step: SHA (if code), result, open follow-ups. Reviewers answer only their author.
- Approval comes from the reviewer, never from the author's claim. If an author says "approved", check the reviewer's own message first.
- Freeze: the builder does not commit while the browser-tester runs. The tester records the SHA it tested.
- Wrap every `mvn` and `scripts/verify.sh` run in `scripts/with-lock.sh`. Always use JDK 17 (`JAVA_HOME=~/.sdkman/candidates/java/17.0.15-tem`). On JDK 25 a reviewer sees false errors.
- Playwright specs read `FRONTEND_PORT` and `BACKEND_PORT`, never `PORT`. A spec that reads `PORT` hits the main stack.
- Never touch the main stack (5433 / 8080 / 3000) or another lane's ports, containers or volumes.
- Nothing is pushed, no PR is opened, nothing is merged until the human says so. No AI attribution anywhere. No em dashes.

## Steps and gates

1. **Read the requirements.** Take them from an artifact or a file. Look at any mockups. Write one line per requirement. Mark mockup strictness: P0 = structure, texts, data; P1 = colors, font sizes, spacing.
2. **One lane per requirement.** Free index from `scripts/wt.sh status`. Run `scripts/wt.sh up <slug> <index>`. Record slug, branch, worktree and the three ports in the brief. Keep lane files in a folder outside the repo: `lanes/<slug>/` (plan.md, test-report.md, follow-ups.md, evidence/).
3. **Write the brief.** Copy `lanes-brief.template.md` (next to this file), fill it, and give it to every worker. Workers do not re-derive facts in it.
4. **Plan.** Per lane: planner writes `plan.md` (scope mapped to the requirement, backend endpoints/DTOs/services, frontend components, i18n es+en, seed changes, test plan of at most 30 cases with expected results, risks). plan-reviewer reviews. Max 2 rounds.
5. **Plans artifact.** When all plans are written AND approved by their reviewer, build ONE artifact for the human (sonnet writer, haiku checker). For each lane: a block "Para decidir vos" (2 options max, a recommended default) plus the technical detail (endpoints, DTOs, derivation logic, frontend vs mockup, i18n, seed, tests, risks). Write it in the language the human uses. Dark theme.
6. **HUMAN APPROVAL GATE.** Stop. The human approves the plans or changes a default. Nobody builds before this.
7. **Build.** Per lane: builder implements in the lane worktree, TDD, small commits, `scripts/verify.sh` through the lock. code-reviewer reviews the diff against the plan. Max 2 rounds. Freeze the SHA.
8. **Test.** Before it starts, the tester asks the code-reviewer to confirm approval of the exact SHA. Then browser-tester runs the plan in a real browser (Playwright CLI, headless, on the lane's frontend port) with screenshots, and writes `test-report.md` with the SHA. test-auditor checks HOW: every PASS has evidence, data was not empty, the SHA equals HEAD, nothing was skipped, the DB port is the lane's.
9. **Dry-merge between lanes.** Lanes often touch the same files (seed, `App.jsx`, `LanguageContext.jsx`). Merge the lane branches in a throwaway worktree and report conflicts before any PR.
10. **Stacked PRs.** Base = the harness branch (or the previous lane). Assignee = the human. No AI attribution in titles, bodies or commits. Body: what it does, test evidence with SHAs, open follow-ups, known issues.
11. **Links to clipboard.** `pbcopy` the PR links for the human to send.
12. **Merge only on the human's word.**

## Pushes

The permission classifier blocks agent pushes and PR creation. Stage ONE script for the whole batch (push all branches, open all PRs, copy links). Tell the human: `! bash <script>`. Do not retry the push in a loop.

## "Ship as is" mode

If the human says to ship as is: skip the remaining rounds, do not start new fixes, and write every open finding into the PR body.

## Lessons baked in

- One reviewer run used `PORT` instead of `FRONTEND_PORT` and hit the main stack on :3000 (login and page load only, no changes). Specs and briefs must name `FRONTEND_PORT`.
- Planner-001 logged "approved" before the reviewer answered. Only the reviewer's message counts.
- A layout fix can break a mockup P0 rule (an amount fit at 900px but the row split below xl). Re-test on the final SHA, not an earlier one.
- A tester spec edited after the freeze is untracked. Commit the spec before the PR so the tree is clean.
- Lane data can change while a tester re-seeds. Do not read lane data during another step's run.
- Both lanes in the first run touched `seed.sh` and `LanguageContext.jsx`. Make seed changes append-only.

## Coordinator hands (only these)

Board, spawn and brief workers, relay decisions, stage the push script. Update the board after every change. Hand off at about 50% context.
