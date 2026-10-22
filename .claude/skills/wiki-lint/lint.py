#!/usr/bin/env python3
"""Mechanical wiki lint: broken wikilinks, orphans, missing frontmatter, index gaps.
Usage: python3 .claude/skills/wiki-lint/lint.py [wiki_dir]   (default: wiki)
Exit 1 if any problem is found."""
import re, sys, pathlib

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "wiki")
REQUIRED = ["title", "type", "tags", "sources", "updated"]
files = [p for p in root.rglob("*.md") if ".obsidian" not in p.parts]
names = {}
for p in files:
    names.setdefault(p.stem, []).append(p)
problems = []

for n, ps in names.items():
    if len(ps) > 1:
        problems.append(f"duplicate name {n}: {[str(x) for x in ps]}")

inbound = {p.stem: set() for p in files}
for p in files:
    text = p.read_text()
    body = re.sub(r"`[^`]*`", "", text)  # ignore inline code
    for m in re.finditer(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]", body):
        target = m.group(1).strip()
        if target not in names:
            problems.append(f"{p}: broken wikilink [[{target}]]")
        elif target != p.stem:
            inbound[target].add(p.stem)
    if "raw" not in p.parts and p.name != "CLAUDE.md":  # CLAUDE.md is a symlink to the repo root file
        fm = re.match(r"---\n(.*?)\n---\n", text, re.S)
        if not fm:
            problems.append(f"{p}: missing frontmatter")
        else:
            keys = set(re.findall(r"^(\w+):", fm.group(1), re.M))
            for k in REQUIRED:
                if k not in keys:
                    problems.append(f"{p}: frontmatter missing '{k}'")
    if chr(0x2014) in text:
        problems.append(f"{p}: em dash")

index_text = (root / "index.md").read_text()
index_links = set(re.findall(r"\[\[([^\]|#]+)", index_text))
for p in files:
    if p.stem in ("index", "log", "AGENTS", "CLAUDE"):
        continue
    if p.stem not in index_links:
        problems.append(f"{p}: not linked from index.md")
    if not inbound[p.stem] - {"index"} and "raw" not in p.parts:
        problems.append(f"{p}: orphan (only the index links to it)")

print(f"files checked: {len(files)}")
print(f"problems: {len(problems)}")
for x in problems:
    print(" -", x)
sys.exit(1 if problems else 0)
