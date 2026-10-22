# Feature lanes: shared brief (<date>)

Everything below is established fact. Do not re-derive it. Coordinator is `<name>`.

## Inputs
- Requirements: <path or artifact URL>
- Mockups: <paths>. Look at them with the Read tool.
- Repo base: <repo path>, base branch `<harness branch>` (HEAD <sha>). Read `CLAUDE.md`, `wiki/AGENTS.md`, `wiki/index.md` first.
- Domain facts: wiki/pages/business-rules.md and the pages that match these requirements.
- Mockup strictness: P0 = structure, texts, data; P1 = colors, font sizes, exact spacing.

## Lanes (each isolated: own worktree, branch, DB/backend/frontend ports)
| Lane | Slug | Branch | Worktree | DB | Backend | Frontend |
|---|---|---|---|---|---|---|
| REQ-XXX <name> | <slug> | feat/<slug> | .claude/worktrees/<slug> | <port> | <port> | <port> |
Main stack (do not touch): 5433 / 8080 / 3000, worktree `<harness>`.
Created only with `scripts/wt.sh up <slug> <index>` (skill `feature-worktree`).

## Roles per lane (author + independent reviewer, max 2 rounds, direct SendMessage)
1. planner (opus) writes `lanes/<slug>/plan.md`. plan-reviewer (sonnet) reviews.
2. builder (sonnet) implements the approved plan, TDD, small commits. code-reviewer (opus) reviews the diff against the plan.
3. browser-tester (sonnet): Playwright CLI headless on the lane's frontend port, screenshots, records the SHA. test-auditor (haiku) checks how it was tested.
- Round = one review plus one answer. After 2 rounds open items go to `lanes/<slug>/follow-ups.md`.
- Only the author reports to the coordinator, once: SHA, result, open follow-ups. Reviewers reply only to their author.
- Approval counts only when the reviewer says it. The tester asks the reviewer to confirm the SHA before testing.
- Freeze: the builder does not commit while the tester runs.

## Hard constraints
- Work only in your lane worktree. Never touch the main stack or another lane.
- Maven and verify: `scripts/with-lock.sh`, with JAVA_HOME set to JDK 17.
- Specs read FRONTEND_PORT and BACKEND_PORT, never PORT.
- Do not push, open PRs, deploy or post anywhere unless the coordinator says so.
- No AI attribution anywhere. No em dashes.
- Prove behavior with a run. Evidence for every claim (file:line, command plus output).
- New UI strings in both es and en. Errors via GlobalExceptionHandler.
- Lane files: <folder>/lanes/<slug>/
