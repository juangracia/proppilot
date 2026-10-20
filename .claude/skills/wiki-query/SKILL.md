---
name: wiki-query
description: Answer a question about PropPilot (domain, rules, architecture, how to run things) from the wiki/ second brain first, with citations. Use before exploring code for any "how does X work", "why is Y" or "where is Z" question.
---

# Wiki query

1. Read `wiki/index.md`. Open the pages it points to for the question.
2. If the wiki answers it, check that the cited `path:line` still matches the code. If a fact drifted, fix the page and bump `updated`.
3. If the wiki does not answer it, read the code. Mark what you could not check as UNVERIFIED.
4. Answer with citations: wiki pages as `[[page]]` and code as `path:line`.
5. If the answer is reusable (a how-to, a comparison, a non-obvious finding), file it as a page with `type: answer` under `wiki/pages/`, link it from `wiki/index.md`, and append to `wiki/log.md`:
   ```
   ## [YYYY-MM-DD] query | <question>
   - <page created or updated>
   ```

Do not file one-off or chatty answers.
