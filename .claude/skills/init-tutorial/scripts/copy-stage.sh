#!/usr/bin/env bash
# Copy a source stage directory to a destination, skipping build artifacts,
# virtual envs, lock files, and VCS metadata.
#
# Usage: copy-stage.sh <source-path> <dest-path>
set -euo pipefail

src="${1:?source path required}"
dst="${2:?destination path required}"

if [[ ! -d "$src" ]]; then
  echo "error: source does not exist: $src" >&2
  exit 1
fi
if [[ -e "$dst" ]]; then
  echo "error: destination already exists: $dst" >&2
  exit 1
fi

mkdir -p "$(dirname "$dst")"

rsync -a \
  --exclude='node_modules' \
  --exclude='.venv' \
  --exclude='venv' \
  --exclude='__pycache__' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.turbo' \
  --exclude='.next' \
  --exclude='bun.lock' \
  --exclude='uv.lock' \
  --exclude='*.egg-info' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  "$src/" "$dst/"

echo "copied: $src -> $dst"
