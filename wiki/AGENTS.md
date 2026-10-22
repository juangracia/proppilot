# Wiki schema and operations

This wiki follows the "LLM wiki" pattern (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). It has three layers.

1. `wiki/raw/` holds sources. They are immutable. Never edit a raw file. Add a new dated file instead.
2. `wiki/pages/` holds the wiki. You write and maintain it.
3. This file is the schema. Humans and agents refine it over time.

`CLAUDE.md` exists at the repo root, so this file is not auto-loaded. Read it before any wiki work.

## Files

- `wiki/index.md`: catalog of every page. One line per page: link, one-line summary, source count. Grouped by category. Update it on every ingest. Read it first when you answer a question.
- `wiki/log.md`: append-only history. One heading per event: `## [YYYY-MM-DD] op | title`. `op` is `ingest`, `query`, or `lint`. Then 1-3 lines of detail. Recent entries: `grep "^## \[" wiki/log.md | tail -5`.
- `wiki/pages/*.md`: one topic per page, lowercase kebab-case names.

## Page format

- Start with `# Title` and one sentence that says what the page covers.
- Cite code as `path/File.java:LINE`. Open the file and check the line before you write the cite. Mark anything you could not check as `UNVERIFIED`.
- Link related pages with relative links, for example `[business rules](business-rules.md)`.
- End with `Sources:` listing the raw files or code paths used.
- Plain facts. No marketing words. No em dashes.

## Operations

**Ingest.** A source is a file in `wiki/raw/` or a code area. Read it. Write or update the pages it touches (often 3-10). Update `index.md`. Append a log entry. Skill: `.claude/skills/wiki-ingest`.

**Query.** Read `index.md`. Open the relevant pages. Answer with cites. If the answer is new and durable, file it as a page or add it to one, then update the index and log (`query` entry). Skill: `.claude/skills/wiki-query`.

**Lint.** Check for: broken links, pages missing from the index, index entries without a page, cites whose line no longer matches, contradictions between pages, claims marked `UNVERIFIED` that can now be checked, concepts that deserve their own page. Fix small issues. Report big ones. Append a `lint` log entry. Skill: `.claude/skills/wiki-lint`.

## Page categories (for index.md)

- Domain: glossary, entities, business rules, rent adjustment
- System: architecture, api, testing
- Health: known issues
