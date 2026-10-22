---
name: wiki-lint
description: Health-check the PropPilot wiki for broken links, stale file:line cites, orphan pages, contradictions and gaps. Use periodically or after large code changes.
---

# Wiki lint

Read `wiki/AGENTS.md` first.

Check:
1. Every file in `wiki/pages/` is listed in `wiki/index.md`, and every index link resolves.
2. Every relative link in pages resolves.
3. Every `File.java:LINE` cite: open the file, read the line, confirm it still shows what the page claims. List the stale ones.
4. Pages that contradict each other (rules, numbers, status codes).
5. `UNVERIFIED` marks that can now be checked.
6. Concepts used in several pages that have no page.
7. No em dashes. No edits to `wiki/raw/`.

Fix small issues (stale line numbers, missing index lines). Report big ones as a list. Append `## [YYYY-MM-DD] lint | <summary>` to `wiki/log.md`.
