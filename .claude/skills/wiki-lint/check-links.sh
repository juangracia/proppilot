#!/usr/bin/env bash
# Lists broken [[wikilinks]] and orphan pages (no inbound link) in wiki/. Run from the repo root.
set -uo pipefail

cd "$(dirname "$0")/../../../wiki"

# Links written inside backticks (`[[like-this]]`) are examples, not links.
grep -roh --include='*.md' '`\?\[\[[^]|#]*' . | grep -v '^`' | sed 's/^\[\[//' | sort -u | while read -r link; do
  [[ -n "$(find . -name "$link.md" -not -path './raw/*' | head -1)" ]] || echo "broken: $link"
done

find pages -name '*.md' | while read -r page; do
  name="$(basename "$page" .md)"
  grep -rqF --include='*.md' "[[$name" . || echo "orphan: $name"
done
