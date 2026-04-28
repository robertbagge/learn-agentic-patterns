#!/usr/bin/env bash
set -euo pipefail

# diff-summary.sh — deterministic diff parse for identify-commits.
# Prints one line per changed file:
#   <status>  <insertions>  <deletions>  <path>
# where <status> is one of: staged, unstaged, untracked.

# Staged changes (index vs HEAD).
git diff --cached --numstat | while IFS=$'\t' read -r ins del path; do
  printf "staged\t%s\t%s\t%s\n" "$ins" "$del" "$path"
done

# Unstaged changes (working tree vs index).
git diff --numstat | while IFS=$'\t' read -r ins del path; do
  printf "unstaged\t%s\t%s\t%s\n" "$ins" "$del" "$path"
done

# Untracked files (line counts via wc -l; binary files report 0).
git ls-files --others --exclude-standard | while read -r path; do
  if [[ -f "$path" ]]; then
    lines="$(wc -l < "$path" 2>/dev/null || echo 0)"
  else
    lines=0
  fi
  printf "untracked\t%s\t0\t%s\n" "$lines" "$path"
done
