---
name: wiki-ingest
description: Turn a new source (report, doc, notes) or a finished task's durable learnings into wiki/ updates plus a log.md entry. Use after a gotcha, decision or domain rule is learned, or when a new source should be filed into the second brain.
---

# Wiki ingest

Schema: `wiki/AGENTS.md`. Follow it; this is the short checklist.

1. If the input is an external source or report, save it as `wiki/raw/YYYY-MM-DD-<slug>.md` with frontmatter `source`, `date`, `immutable: true`. Never edit files in `raw/` after that. A finished task needs no raw file; cite the code and commit instead.
2. Write down the takeaways in a few lines. Keep only durable knowledge: rules, gotchas, decisions, verified facts.
3. Read `wiki/index.md` and find every page the takeaways touch. Update them. Create a page for a new entity or concept (`pages/entities/`, `pages/concepts/`, `pages/architecture/`). Decisions go in `pages/decisions.md` as a new ADR. Gaps go in `pages/open-questions.md`.
4. Check each claim against the code. Cite `path:line` from the repo root. Mark anything unchecked as UNVERIFIED.
5. Page frontmatter: `type`, `updated` (today), `sources`. Link with `[[wikilinks]]`. Every page needs an inbound link.
6. Update `wiki/index.md` for new or renamed pages.
7. Append to `wiki/log.md`:
   ```
   ## [YYYY-MM-DD] ingest | <source or task title>
   - <page touched: what changed>
   ```

No em dashes. No secrets or real tenant data.
