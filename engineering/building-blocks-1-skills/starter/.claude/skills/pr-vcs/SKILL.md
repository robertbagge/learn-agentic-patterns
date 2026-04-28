---
name: pr-vcs
description: Run gh pr create for the current branch. Takes a title and a body. Thin shell wrapper with fixed flags and base-branch detection.
allowed-tools: Bash
argument-hint: "<title> <body-file>"
---

# pr-vcs

Infra-layer wrapper around `gh pr create`. Does not write the PR body or
decide when to open the PR — it just runs the shell call with consistent
flags and figures out the base branch.

## When this runs

Invoked by the `pr` capability skill after that skill has rendered the PR
body from the repo's template. You usually do not invoke this directly.

## How to use

Delegate to the script:

```bash
.claude/skills/pr-vcs/scripts/create-pr.sh "<title>" <body-file>
```

- `<title>` — PR title (typically the Conventional-Commits subject of the
  first commit on the branch).
- `<body-file>` — path to a file containing the fully-rendered PR body.
  Passing a file (rather than an inline string) keeps multi-line bodies
  clean in the shell.

## Contract

- Uses `gh pr create --base <detected-base>` where the base is whatever
  `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` reports.
- Never opens draft PRs (the capability layer decides that — this is
  infra, one call shape only).
- Prints the new PR URL on success.
- Assumes the branch is already pushed. Pushing is the capability layer's
  job.
