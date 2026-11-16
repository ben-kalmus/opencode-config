#!/usr/bin/env bash
# Usage: build-claude-agents.sh <output-dir> [harness-dir]
# Joins <harness-dir>/claude/<name>.yml with the body of <harness-dir>/agents/<name>.md (everything after its frontmatter).
# The harness directory defaults to the one that holds this script.
set -euo pipefail

out=${1:?output dir required}
root=${2:-$(cd "$(dirname "$0")/.." && pwd)}
mkdir -p "$out"

for meta in "$root"/claude/*.yml; do
  name=$(basename "$meta" .yml)
  src="$root/agents/$name.md"
  {
    echo "---"
    cat "$meta"
    echo "---"
    awk 'fm >= 2 {gsub(/~\/\.config\/opencode\/AGENTS\.md|AGENTS\.md/, "~/.claude/CLAUDE.md"); print; next} /^---$/ {fm++}' "$src"
  } > "$out/$name.md"
  echo "wrote $out/$name.md"
done
