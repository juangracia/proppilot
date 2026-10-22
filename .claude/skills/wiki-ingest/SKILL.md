---
name: wiki-ingest
description: Add a source or a code area to the PropPilot wiki (the project second brain, an Obsidian vault), update pages, index and log. Use after a feature lands, a decision is made, or a new document appears.
---

# Wiki ingest

Read `wiki/AGENTS.md` first. It is the schema and it is not auto-loaded. The full flow is under "Operations, Ingest" there.

1. Copy the source to `wiki/raw/YYYY-MM-DD-title.md`. Never edit an existing raw file. Strip personal emails and secrets.
2. Read `wiki/index.md`. Find the pages the source touches.
3. Create or update pages in `wiki/pages/`. Every page needs frontmatter (title, type, tags, sources, updated) and `[[wikilinks]]`. Cite `path:line` only after you open the file. Mark the rest `UNVERIFIED`.
4. Add the page to `wiki/index.md`.
5. Append `## [YYYY-MM-DD] ingest | <title>` to `wiki/log.md`.
6. Run `python3 .claude/skills/wiki-lint/lint.py`. Fix what it reports.
7. Commit: `docs(wiki): ingest <title>`.

The `wiki-curator` agent runs this flow for bounded ingests.
