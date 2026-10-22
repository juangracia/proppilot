---
name: wiki-ingest
description: Add a source or a code area to the PropPilot wiki, update affected pages, the index and the log. Use after a feature lands, a rule changes, or a new document appears in wiki/raw.
---

# Wiki ingest

Read `wiki/AGENTS.md` first. It is not auto-loaded.

1. Identify the source. A document goes into `wiki/raw/` as a new dated file (`YYYY-MM-DD-title.md`). Never edit an existing raw file. A code area is read directly.
2. Read `wiki/index.md` to see which pages the source touches.
3. Update or create pages in `wiki/pages/`. Cite `path:line` only after you open the file and see that line. Mark the rest `UNVERIFIED`.
4. Update `wiki/index.md` (link, one line, source count).
5. Append to `wiki/log.md`: `## [YYYY-MM-DD] ingest | <title>` and 1-3 lines of detail.
6. Commit with one small commit: `docs(wiki): ingest <title>`.

Use the `wiki-curator` agent for bounded ingests.
