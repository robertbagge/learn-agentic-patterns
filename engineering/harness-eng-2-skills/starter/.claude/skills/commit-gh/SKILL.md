---
name: commit-gh
description: Run git add + git commit in one call. Takes a file list and a commit message. Thin shell wrapper with fixed flags.
allowed-tools: Bash
argument-hint: "<message> [--files <f1> <f2> ...]"
---

# commit-gh

Infra-layer wrapper around `git add` + `git commit`. Does not decide *what*
to commit or *what to write* — it just runs the shell call with consistent
flags.

## When this runs

Invoked by the `commit` capability skill once that skill has produced a
message and (optionally) a file list. You usually do not invoke this
directly — the capability layer is where judgment lives.

## How to use

Delegate to the script:

```bash
.claude/skills/commit-gh/scripts/commit.sh "<message>" [file1 file2 ...]
```

- `<message>` — the full commit subject (+ optional body, newline-separated).
- `file1 file2 ...` — optional. When given, `git add <files>` runs first.
  When omitted, the already-staged index is committed.

The script refuses to run if the index is empty and no files were passed.

## Contract

- Never amends.
- Never signs.
- Never adds trailers (no `Co-Authored-By`).
- Prints the resulting commit hash on success, nothing on failure (stderr).
