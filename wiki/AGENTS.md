---
title: Wiki schema and operations
type: schema
tags: [schema, wiki]
sources: []
updated: 2026-10-22
---

# Wiki schema and operations

This wiki is the project's second brain. It follows the LLM wiki pattern (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) and is an Obsidian vault (open the `wiki/` folder). It holds all project context: domain, system, harness, decisions, lessons, session history.

`CLAUDE.md` exists at the repo root, so this file is not auto-loaded. Read it before any wiki work.

## Layers

1. `raw/`: sources. Immutable. Copy a source in with a dated name `YYYY-MM-DD-title.md`. Never edit one. Strip personal emails and secrets when you copy.
2. `pages/`: the wiki. You write and maintain it.
3. This file: the schema. Refine it over time.

## Files

- `index.md`: catalog of every page and raw source. One line each: wikilink, one-line summary, source count. Grouped by category. Update on every ingest. Read it first to answer a question.
- `log.md`: append only. One heading per event: `## [YYYY-MM-DD] op | title`, op is `ingest`, `query` or `lint`. Then 1-3 lines. Recent: `grep "^## \[" wiki/log.md | tail -5`.
- `pages/*.md`: one topic per page, lowercase kebab-case file names, unique across the vault.

## Page format (Obsidian-ready)

Every page in `pages/`, plus `index.md`, `log.md` and this file, starts with YAML frontmatter:

```
---
title: Human title
type: concept | entity | rules | system | health | decision | harness | log | lessons | index | schema
tags: [lowercase, words]
sources: [raw file names without .md, or code paths]
updated: YYYY-MM-DD
---
```

Raw files have no frontmatter requirement (they are copies).

- Link pages with wikilinks: `[[page-name]]` or `[[page-name|text]]`. Use the file name without `.md`. No path, no `.md`.
- Every page is linked from `index.md` and has at least one inbound link. No orphans.
- Cite code as `path/File.java:LINE`. Open the file and check the line before you write it. Mark anything unchecked `UNVERIFIED`.
- Plain facts. No marketing words. No em dashes. No AI attribution.

## Operations

**Ingest.** Skill `.claude/skills/wiki-ingest`, agent `wiki-curator`. Steps:
1. Copy the source to `raw/` (dated name, secrets stripped). A code area is read in place.
2. Read `index.md` to find the pages it touches.
3. Create or update pages (often 3-10). Add frontmatter and wikilinks. Update `updated:`.
4. Update `index.md`.
5. Append `## [YYYY-MM-DD] ingest | <title>` to `log.md`.
6. Run the lint checks. Commit.

**Query.** Skill `wiki-query`. Read `index.md`, open the pages, answer with cites. File durable answers back as page edits and log a `query` entry.

**Lint.** Skill `wiki-lint`. Check: broken wikilinks, orphan pages, missing frontmatter keys, pages missing from the index, stale file:line cites, contradictions, `UNVERIFIED` marks that can now be checked, missing concept pages. Fix small issues, report large ones, log a `lint` entry.

## Obsidian

`wiki/.obsidian/` holds the minimal vault config. `workspace*.json` is gitignored. To open: follow the `obsidian-open-vault` skill with the vault folder `wiki/`.
