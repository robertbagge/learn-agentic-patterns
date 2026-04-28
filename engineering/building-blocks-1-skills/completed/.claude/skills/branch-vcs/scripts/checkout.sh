#!/usr/bin/env bash
set -euo pipefail
name="${1:?branch name required}"
git checkout -b "$name"
echo "$name"
