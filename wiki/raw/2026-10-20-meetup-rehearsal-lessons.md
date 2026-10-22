# PropPilot meetup rehearsal, 20 Oct 2026: lessons

Rehearsal of the live demo "cold repo to Claude Code harness to two features with PRs". Total about 2.5 h (old coordinator ~1.5 h: harness, plan, mockups; proppilot-coordinator-2 ~1 h: plan review, test plan, 2 parallel lanes, 3 PRs, public idea repo). Cost about 36 USD at API list prices (coordinator on opus ~17, workers ~18, mostly sonnet). Board: ~/brain/10-projects/proppilot/board.md.

## Result
- PR #36 harness -> main, #37 REQ-002 agenda, #38 REQ-001 morosidad (stacked on #36). All tested in their own worktree stack. None merged, no deploy (rehearsal stopped there).
- Public idea repo + QR: https://github.com/juangracia/claude-code-harness-idea

## Where the time went (biggest first)
1. Cosmetic mockup loops on REQ-001: 5 code SHAs (63422de, 22d387f, 5a55185, a6c9d13, 7c06a03), each one resetting the test gate (retest + re-review + PR re-check). Cause: mockup colors and exact layout were P0, and the coordinator changed its mind once (notes vs fix).
2. Message flood: ~10 duplicated idle notifications per step reached the coordinator and Juan. Crossed messages caused stale decisions (worker acting on an old call).
3. Moving HEAD: builders committed while testers ran, so reviewers correctly refused to sign off. Good gate, slow.
4. Harness bug found late: verify.sh glob skipped the new e2e specs (passed with "1 spec file"). Caught by a builder, fixed mid-run.
5. Permission classifier blocks the agents on: `gh pr merge` (Merge Without Review), prod pg_dump (Production Reads), skill/agent edits (Self-Modification), heredoc writes in worktrees. Each one cost a round trip to Juan.
6. Test plan grew to 53 cases (target 35) and was written after the plan, not in parallel.

## Proposals to cut the time for the real meetup
1. Cap code rounds: max 2 code rounds per lane after tests; anything after that goes to the PR as a follow-up note. Decide once, never flip.
2. Mockup strictness up front: P0 = structure, texts and data; colors, font sizes and exact spacing = P1. Write it in the test plan before building.
3. Freeze the lane during a test run: builder does not commit while the tester runs; tester always records the SHA.
4. Workers report only once at the end via `main`; coordinator ignores idle notifications and only relays decisions. Name every peer in the brief and say "report to main" (custom coordinator names do not resolve for subagents).
5. Self-test the harness before lanes: verify must prove it picks up a probe spec (count of spec files).
6. Serialize Maven/verify runs across lanes (parallel surefire forks crashed once).
7. Prepare the presenter's `!` commands ahead: merges, prod backup, any skill edit. Or decide before the talk whether to add permission rules for the demo (Juan's call).
8. Write plan, technical design and test plan in parallel (three author+reviewer pairs) instead of in sequence; cap the test plan at ~30 cases.
9. Pre-bake before going on stage: stacks up and seeded, QR repo created and projected from minute one, Chrome tabs ready (main :3000, lanes :3001/:3002).
10. Keep the coordinator thin (it was half the cost): it routes and decides, workers produce. Rotate at 50% context.
11. Presenter UX that worked: macOS popup on each milestone, "abrila" = open in Chrome, Slack draft copied to clipboard, read-only debate chat page for the plan review.
12. Language: the coordinator slipped into English several times while Juan was presenting in Spanish. Make "Spanish only" explicit in the coordinator brief.

## What worked well (keep)
- Author + independent reviewer on every step, debating directly, max 2 rounds. Reviewers caught real issues: a file "fixed" but unchanged, untested uncommitted code, wrong counts in PR bodies, a missing no-phone test, tests passing on empty data.
- One worktree per feature with its own ports and Postgres container (wt.sh); dry merge between lane PRs proved no conflicts.
- Test gate by SHA, evidence required for every PASS.
