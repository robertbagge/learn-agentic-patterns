#!/usr/bin/env bash
# Rewrite stage-specific references inside a freshly-copied starter/ folder,
# and report any remaining mentions of the old name for manual review.
#
# Usage: rename-stage.sh <dest-path> <new-name>
set -euo pipefail

dst="${1:?destination path required}"
new_name="${2:?new stage name required}"

if [[ ! -d "$dst" ]]; then
  echo "error: destination does not exist: $dst" >&2
  exit 1
fi

# Portable in-place edit (works on BSD/macOS and GNU sed).
sed_inplace() {
  local expr="$1"
  local file="$2"
  local tmp
  tmp=$(mktemp)
  sed -e "$expr" "$file" > "$tmp" && mv "$tmp" "$file"
}

old_pkg_name=""   # full pyproject `name` field, e.g. harness-eng-1-claudemd-api
old_bare_name=""  # bare stage name for the grep pass, e.g. harness-eng-1-claudemd

# --- api/pyproject.toml: name + description --------------------------------
pyproject="$dst/api/pyproject.toml"
if [[ -f "$pyproject" ]]; then
  old_pkg_name=$(awk -F'"' '/^name = /{print $2; exit}' "$pyproject" || true)
  if [[ -n "$old_pkg_name" ]]; then
    old_bare_name="${old_pkg_name%-api}"
    sed_inplace "s|^name = \"$old_pkg_name\"|name = \"${new_name}-api\"|" "$pyproject"
    echo "updated: $pyproject (name: $old_pkg_name -> ${new_name}-api)"
  fi
  # Generic description update: pattern "for the X stage" -> "for the <new_name> stage".
  if grep -q 'for the .* stage' "$pyproject" 2>/dev/null; then
    sed_inplace "s|for the [^ ]* stage|for the ${new_name} stage|" "$pyproject"
    echo "updated: $pyproject (description stage name)"
  fi
fi

# --- README.md: top heading ------------------------------------------------
readme="$dst/README.md"
if [[ -f "$readme" ]]; then
  sed_inplace "1s|^# .*|# ${new_name}|" "$readme"
  echo "updated: $readme (title)"
fi

# --- Report any remaining references to the old stage name ----------------
# Search for the BARE stage name with word boundaries. This catches both
# `harness-eng-1-claudemd` and `harness-eng-1-claudemd-api` as substrings
# (since hyphens are word boundaries) while avoiding false positives on
# common substrings (e.g. `-w base` won't match inside `database`).
if [[ -n "$old_bare_name" ]]; then
  echo ""
  echo "scanning for remaining references to '$old_bare_name'..."
  matches=$(grep -rnw "$old_bare_name" "$dst" \
    --exclude-dir=node_modules \
    --exclude-dir=.venv \
    --exclude-dir=__pycache__ \
    --exclude='*.lock' \
    --exclude='*.pyc' 2>/dev/null || true)
  if [[ -z "$matches" ]]; then
    echo "no remaining references found"
  else
    echo "found remaining references (review manually):"
    echo "$matches"
  fi
fi
