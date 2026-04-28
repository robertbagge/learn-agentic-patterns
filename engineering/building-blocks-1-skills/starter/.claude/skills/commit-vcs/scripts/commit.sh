#!/usr/bin/env bash
set -euo pipefail

# commit.sh — infra wrapper for `git add` + `git commit`.
# Usage:
#   commit.sh "<message>"                  # commits the staged index
#   commit.sh "<message>" <file> [<file>]  # stages the listed files, then commits

msg="${1:?commit message required}"
shift || true

# If files were passed, stage them first.
if [[ $# -gt 0 ]]; then
  git add -- "$@"
fi

# Refuse if the index is empty.
if git diff --cached --quiet; then
  echo "error: nothing staged to commit" >&2
  exit 1
fi

git commit -m "$msg"
git rev-parse HEAD
