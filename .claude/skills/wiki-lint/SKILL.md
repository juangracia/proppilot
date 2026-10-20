---
name: wiki-lint
description: Health-check the wiki/ second brain for stale claims, contradictions, broken links and orphan pages, then fix or list them. Use periodically, after a big merge, or before a demo or release.
---

# Wiki lint

1. Broken and orphan links. Run `.claude/skills/wiki-lint/check-links.sh` from the repo root. It prints `broken: <link>` and `orphan: <page>`.
2. Stale citations: for each `path:line` in `wiki/pages/`, open the file and check the line still says what the page claims. Fix drifted numbers.
3. Contradictions between pages, or between a page and the code. A common one: counts in `wiki/pages/architecture/testing.md` vs the last `scripts/verify.sh` run.
4. Concepts mentioned in several pages with no page of their own. Missing cross-links.
5. `UNVERIFIED` items you can now check.
6. Fix what you can. Put the rest in `wiki/pages/open-questions.md`.
7. Append to `wiki/log.md`:
   ```
   ## [YYYY-MM-DD] lint | <scope>
   - <what changed>
   ```
