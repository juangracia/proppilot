# proppilot cold-repo board (meetup 22 Oct 2026)
Updated: 22 Oct 2026 (coordinator session b216cc7b). Live state; update after every change.
Model: ~/.claude/skills/project-coordinator/SKILL.md. Old rehearsal board (closed): ~/brain/10-projects/proppilot/board.md

## Coordinator parameters
- board: this file. Facts for workers: ./explorer-findings.md
- repo: clone ~/dev/proppilot-cold (branch demo/part2-cold @643d5ba); work ONLY in worktree ~/dev/proppilot-cold/.claude/worktrees/harness, branch harness/claude-setup. EnterWorktree does not work (session cwd is another repo): absolute paths.
- language: Spanish to Juan, short plain sentences (ELI5 output style on: STE-like, outcome first)
- posting rules: never Slack; never push main/master; push only harness/* and feat/* branches; PRs and Railway deploy only on Juan's word
- git host: gh, account juangracia (GH_TOKEN=$(gh auth token --user juangracia))
- gotchas: JDK 17 inline (default java 25); `npm ci --legacy-peer-deps`; Postgres compose on 5433; agents cannot edit their own permission/settings (Self-Modification) -> stage `! ` commands for Juan; heredoc writes in worktrees may be refused -> script files
- rotation: hand off at ~50% context (Juan's rule). Successor reads this board + MEMORY.md, confirms in 3 lines.
- author+reviewer rule: every step = author worker + independent reviewer on a different model, max 2 rounds, coordinator arbitrates
- models: set model on every Agent call; haiku mechanical, sonnet bounded build, opus only hard judgment. No Fable.
- coordinator hands: board, spawn/brief/message workers, relay decisions. NOTHING else (lesson 22 Oct: coordinator cloned + planned to write CLAUDE.md itself).

## Pending Juan's word / action
- none

## In flight (workers)
- docs-builder (sonnet): round 1 done (a437da0 CLAUDE.md+wiki, 60fcf02 agents+skills, e40567c settings+hooks). Roster applied 9e02fad (11 agents, Agents table in CLAUDE.md). Gap: path/command limits only by prompt text. UNVERIFIED: Agent matcher live, push deny wildcard, deploy skill lacks Railway service names; recheck verify.sh/smoke refs after stack-builder.
- stack-builder (sonnet subagent, named): scripts, seed, verify, smoke. Running.

## Done
- 4 explorers launched; domain, architecture, tests reports in -> explorer-findings.md

## Next
1. stack worker (sonnet): dev scripts, .dev.env, .sdkmanrc/.nvmrc, seed, verify.sh + Playwright smoke + negative control, look at app
2. docs worker (sonnet, parallel): CLAUDE.md, wiki/ (karpathy schema), .claude agents/skills/hooks/settings
3. reviewer (opus? no: haiku verifier on fresh clone + sonnet-different? decide): fresh clone follows CLAUDE.md to green verify
4. push branch harness/claude-setup; PR only on Juan's word

## Decisions
- 22 Oct: Juan: every role = its own agent with a default model, overridable per call. Roster sent to docs-builder: coordinator(opus), planner(opus), builder(sonnet), tester(sonnet), reviewer(haiku, opus for hard diffs, always different from author), deployer(sonnet, only on human word), explorer-domain/architecture/tests/build(sonnet), wiki-curator(haiku). Files .claude/agents/<role>.md + Agents table in CLAUDE.md.
- 22 Oct: Juan: wiki/ = project second brain (Karpathy LLM wiki) with ALL context (board, findings, decisions, harness, session log), Obsidian-ready, open in Obsidian. Assigned to docs-builder; then reviewer (haiku) checks links/frontmatter/sources.
