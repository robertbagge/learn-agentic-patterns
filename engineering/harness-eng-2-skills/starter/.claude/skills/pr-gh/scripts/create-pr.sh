#!/usr/bin/env bash
set -euo pipefail

# create-pr.sh — infra wrapper for `gh pr create`.
# Usage:
#   create-pr.sh "<title>" <body-file>

title="${1:?pr title required}"
body_file="${2:?pr body file required}"

if [[ ! -f "$body_file" ]]; then
  echo "error: body file does not exist: $body_file" >&2
  exit 1
fi

# Detect the repo's default branch as the PR base.
base="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

gh pr create \
  --base "$base" \
  --title "$title" \
  --body-file "$body_file"
